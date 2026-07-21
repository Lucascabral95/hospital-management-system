import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateAppointmentSocketDto, GetAppointmentsDto } from "./dto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

const LIVE_BOARD_WINDOW_DAYS = 30;
const LIVE_BOARD_MAX_RESULTS = 500;

@Injectable()
export class RealtimeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAppointmentDto: CreateAppointmentSocketDto) {
    const createdAppointment = await this.prisma.appointment.create({
      data: {
        ...createAppointmentDto,
      },
    });

    return createdAppointment;
  }

  async findAll() {
    const since = new Date();
    since.setDate(since.getDate() - LIVE_BOARD_WINDOW_DAYS);

    try {
      const allAppointments = await this.prisma.appointment.findMany({
        where: {
          OR: [{ status: { not: "COMPLETED" } }, { updatedAt: { gte: since } }],
        },
        take: LIVE_BOARD_MAX_RESULTS,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              last_name: true,
              dni: true,
              date_born: true,
              gender: true,
              phone: true,
              email: true,
              country: true,
              createdAt: true,
            },
          },
        },
      });

      return allAppointments;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async findOne(id: number): Promise<GetAppointmentsDto> {
    const findOneRealtime = await this.prisma.appointment.findUnique({
      where: {
        id,
      },
    });

    if (!findOneRealtime) {
      throw new NotFoundException(`Appointment with #${id} not found`);
    }

    return findOneRealtime;
  }

  async updateStatusInProgress(id: number) {
    try {
      return await this.prisma.appointment.update({
        where: {
          id,
        },
        data: {
          status: "IN_PROGRESS",
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Appointment with #${id} not found`);
      }
      throw error;
    }
  }

  async updateStatusCompleted(id: number) {
    try {
      return await this.prisma.appointment.update({
        where: {
          id,
        },
        data: {
          status: "COMPLETED",
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Appointment with #${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const deletedRealtime = await this.prisma.appointment.delete({
        where: {
          id,
        },
      });

      return {
        message: "Realtime deleted successfully",
        deletedRealtime,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Appointment with #${id} not found`);
      }
      throw error;
    }
  }
}
