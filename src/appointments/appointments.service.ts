import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { CreateAppointmentDto, FilterAppointmentsDto, UpdateAppointmentDto } from "./dto";
import { PrismaClient } from "@prisma/client";
import { PatientsService } from "src/patients/patients.service";

@Injectable()
export class AppointmentsService extends PrismaClient implements OnModuleInit {
  constructor(private readonly patientService: PatientsService) {
    super();
  }

  onModuleInit() {
    this.$connect();
  }

  async create(createAppointmentDto: CreateAppointmentDto) {
    const patientsFind = await this.patientService.findOne(createAppointmentDto.patientsId);

    if (!patientsFind) {
      throw new NotFoundException("Patient not found");
    }

    try {
      const createdAppointment = await this.appointment.create({
        data: createAppointmentDto,
      });

      return createdAppointment;
    } catch (error) {
      throw new InternalServerErrorException("Error creating appointment");
    }
  }

  async findAll(filterAppointmentDto: FilterAppointmentsDto) {
    try {
      const allAppointments = await this.appointment.findMany({
        where: {
          status: filterAppointmentDto.status === "ALL" ? undefined : filterAppointmentDto.status,
        },
        orderBy: {
          updatedAt: "asc",
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
      throw new InternalServerErrorException("Error finding appointments");
    }
  }

  async findOne(id: number) {
    try {
      const findOneAppointment = await this.appointment.findUnique({
        where: {
          id: id,
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

      if (!findOneAppointment) {
        throw new NotFoundException("Appointment not found");
      }

      return findOneAppointment;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    await this.findOne(id);

    const updatedAppointment = await this.appointment.update({
      where: {
        id,
      },
      data: updateAppointmentDto,
    });

    return updatedAppointment;
  }

  async remove(id: number) {
    await this.findOne(id);

    const deletedAppointment = await this.appointment.delete({
      where: {
        id,
      },
    });

    return deletedAppointment;
  }
}
