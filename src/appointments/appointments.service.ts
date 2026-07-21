import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateAppointmentDto, FilterAppointmentsDto, GetSlotsDto, UpdateAppointmentDto } from "./dto";
import { Prisma, Specialty } from "@prisma/client";
import { PatientsService } from "src/patients/patients.service";
import { PrismaService } from "src/prisma/prisma.service";

const APPOINTMENT_PATIENT_SELECT = {
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
} satisfies Prisma.PatientsSelect;

const SLOT_INTERVAL_MINUTES = 30;
const NON_BLOCKING_STATUSES: Prisma.AppointmentWhereInput["status"] = { notIn: ["CANCELLED"] };

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientService: PatientsService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    const patientsFind = await this.patientService.findOne(createAppointmentDto.patientsId);

    if (!patientsFind) {
      throw new NotFoundException("Patient not found");
    }

    const { doctorId, scheduledAt } = createAppointmentDto;

    try {
      if (doctorId && scheduledAt) {
        return await this.prisma.$transaction(async (tx) => {
          const conflicting = await tx.appointment.findFirst({
            where: {
              doctorId,
              scheduledAt: new Date(scheduledAt),
              status: NON_BLOCKING_STATUSES,
            },
          });

          if (conflicting) {
            throw new BadRequestException("El turno seleccionado ya no está disponible");
          }

          return tx.appointment.create({ data: createAppointmentDto });
        });
      }

      return await this.prisma.appointment.create({
        data: createAppointmentDto,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException("Error creating appointment");
    }
  }

  async getDoctorsBySpecialty(specialty?: Specialty) {
    return this.prisma.doctor.findMany({
      where: specialty ? { specialty } : undefined,
      select: {
        id: true,
        specialty: true,
        auth: { select: { id: true, full_name: true } },
      },
    });
  }

  async getAvailableSlots(getSlotsDto: GetSlotsDto) {
    const { doctorId, date } = getSlotsDto;
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

    const availability = await this.prisma.doctorAvailability.findMany({
      where: { doctorId, dayOfWeek },
    });

    if (availability.length === 0) return [];

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: NON_BLOCKING_STATUSES,
      },
      select: { scheduledAt: true, durationMinutes: true },
    });

    const now = Date.now();
    const slots: string[] = [];

    for (const block of availability) {
      const [startHour, startMinute] = block.startTime.split(":").map(Number);
      const [endHour, endMinute] = block.endTime.split(":").map(Number);

      let cursor = new Date(`${date}T00:00:00`);
      cursor.setHours(startHour, startMinute, 0, 0);
      const blockEnd = new Date(`${date}T00:00:00`);
      blockEnd.setHours(endHour, endMinute, 0, 0);

      while (cursor.getTime() + SLOT_INTERVAL_MINUTES * 60000 <= blockEnd.getTime()) {
        const slotEnd = new Date(cursor.getTime() + SLOT_INTERVAL_MINUTES * 60000);

        const overlaps = existingAppointments.some((appt) => {
          const apptStart = appt.scheduledAt.getTime();
          const apptEnd = apptStart + appt.durationMinutes * 60000;
          return cursor.getTime() < apptEnd && slotEnd.getTime() > apptStart;
        });

        if (!overlaps && cursor.getTime() > now) {
          slots.push(cursor.toISOString());
        }

        cursor = slotEnd;
      }
    }

    return slots;
  }

  async cancel(id: number) {
    try {
      return await this.prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Appointment not found");
      }
      throw error;
    }
  }

  async reschedule(id: number, scheduledAt: string) {
    const appointment = await this.findOne(id);

    return await this.prisma.$transaction(async (tx) => {
      const conflicting = await tx.appointment.findFirst({
        where: {
          id: { not: id },
          doctorId: appointment.doctorId,
          scheduledAt: new Date(scheduledAt),
          status: NON_BLOCKING_STATUSES,
        },
      });

      if (conflicting) {
        throw new BadRequestException("El turno seleccionado ya no está disponible");
      }

      return tx.appointment.update({
        where: { id },
        data: { scheduledAt: new Date(scheduledAt), status: "SCHEDULED" },
      });
    });
  }

  async findAll(filterAppointmentDto: FilterAppointmentsDto) {
    const { limit, page } = filterAppointmentDto;

    try {
      const where = {
        status: filterAppointmentDto.status === "ALL" ? undefined : filterAppointmentDto.status,
      };

      const [total, allAppointments] = await Promise.all([
        this.prisma.appointment.count({ where }),
        this.prisma.appointment.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            updatedAt: "asc",
          },
          include: {
            patient: {
              select: APPOINTMENT_PATIENT_SELECT,
            },
          },
        }),
      ]);

      return {
        totalPages: Math.ceil(total / limit),
        page,
        total,
        data: allAppointments,
      };
    } catch (error) {
      throw new InternalServerErrorException("Error finding appointments");
    }
  }

  async findOne(id: number) {
    try {
      const findOneAppointment = await this.prisma.appointment.findUnique({
        where: {
          id: id,
        },
        include: {
          patient: {
            select: APPOINTMENT_PATIENT_SELECT,
          },
        },
      });

      if (!findOneAppointment) {
        throw new NotFoundException("Appointment not found");
      }

      return findOneAppointment;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    try {
      const updatedAppointment = await this.prisma.appointment.update({
        where: {
          id,
        },
        data: updateAppointmentDto,
      });

      return updatedAppointment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Appointment not found");
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const deletedAppointment = await this.prisma.appointment.delete({
        where: {
          id,
        },
      });

      return deletedAppointment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Appointment not found");
      }
      throw error;
    }
  }
}
