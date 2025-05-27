import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { CreateAppointmentSocketDto, GetAppointmentsDto } from "./dto";
import { PrismaClient, Status } from "@prisma/client";

@Injectable()
export class RealtimeService extends PrismaClient implements OnModuleInit {
  onModuleInit() {
    this.$connect();
  }

  async create(createAppointmentDto: CreateAppointmentSocketDto) {
    const createdAppointment = await this.appointment.create({
      data: {
        ...createAppointmentDto,
      },
    });

    return createdAppointment;
  }

  async findAll() {
    return await this.appointment.findMany({
      orderBy: {
        createdAt: "asc",
      },
      where: {
        status: {
          in: [Status.IN_PROGRESS, Status.PENDING],
        },
      },
      include: {
        patient: true,
      },
    });
  }

  private async findOne(id: number): Promise<GetAppointmentsDto> {
    const findOneRealtime = await this.appointment.findUnique({
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
    await this.findOne(id);

    const updatedAppointment = await this.appointment.update({
      where: {
        id,
      },
      data: {
        status: "IN_PROGRESS",
      },
    });

    return updatedAppointment;
  }

  async updateStatusCompleted(id: number) {
    await this.findOne(id);

    const updatedAppointment = await this.appointment.update({
      where: {
        id,
      },
      data: {
        status: "COMPLETED",
      },
    });

    return updatedAppointment;
  }

  async remove(id: number) {
    await this.findOne(id);

    const deletedRealtime = await this.appointment.delete({
      where: {
        id,
      },
    });

    return {
      message: "Realtime deleted successfully",
      deletedRealtime,
    };
  }
}
