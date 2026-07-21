import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { NotificationsGateway } from "./notifications.gateway";

const REMINDER_WINDOW_MINUTES = 60;
const REMINDER_TYPE = "APPOINTMENT_REMINDER";

export interface CreateNotificationInput {
  recipientAuthId: number;
  type: string;
  title: string;
  body: string;
  relatedType?: string;
  relatedId?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger("NotificationsService");

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async notify(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: input,
    });

    this.gateway.emitToUser(input.recipientAuthId, notification);

    return notification;
  }

  async findAllForUser(authId: number, paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const where: Prisma.NotificationWhereInput = { recipientAuthId: authId };

    const [total, unreadCount, data] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, read: false } }),
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      totalPage: Math.ceil(total / limit),
      page,
      total,
      unreadCount,
      data,
    };
  }

  async markRead(id: number, authId: number) {
    try {
      return await this.prisma.notification.update({
        where: { id, recipientAuthId: authId },
        data: { read: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Notification not found");
      }
      throw error;
    }
  }

  async markAllRead(authId: number) {
    return this.prisma.notification.updateMany({
      where: { recipientAuthId: authId, read: false },
      data: { read: true },
    });
  }

  async notifyDoctorOfAppointment(
    doctorId: number,
    appointmentId: number,
    title: string,
    body: string,
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { authId: true },
    });

    if (!doctor) return null;

    return this.notify({
      recipientAuthId: doctor.authId,
      type: "APPOINTMENT",
      title,
      body,
      relatedType: "Appointment",
      relatedId: appointmentId,
    });
  }

  // Reminds the assigned doctor of appointments starting soon. Guards against duplicate
  // reminders by checking whether a REMINDER_TYPE notification already exists for that
  // appointment, since Appointment has no dedicated "reminded" flag.
  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendUpcomingAppointmentReminders() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60000);

    const upcoming = await this.prisma.appointment.findMany({
      where: {
        doctorId: { not: null },
        scheduledAt: { gte: now, lte: windowEnd },
        status: { notIn: ["CANCELLED", "COMPLETED", "NO_SHOW"] },
      },
      select: { id: true, doctorId: true, specialty: true, scheduledAt: true },
    });

    for (const appointment of upcoming) {
      try {
        const alreadyReminded = await this.prisma.notification.findFirst({
          where: { relatedType: REMINDER_TYPE, relatedId: appointment.id },
        });
        if (alreadyReminded) continue;

        const doctor = await this.prisma.doctor.findUnique({
          where: { id: appointment.doctorId! },
          select: { authId: true },
        });
        if (!doctor) continue;

        await this.notify({
          recipientAuthId: doctor.authId,
          type: REMINDER_TYPE,
          title: "Turno próximo",
          body: `Tenés un turno de ${appointment.specialty} a las ${appointment.scheduledAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}.`,
          relatedType: REMINDER_TYPE,
          relatedId: appointment.id,
        });
      } catch (error) {
        this.logger.warn(`Failed to send reminder for appointment #${appointment.id}: ${error.message}`);
      }
    }
  }
}
