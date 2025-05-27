import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { CreateAppointmentDto, UpdateAppointmentDto, GetAppointmentsDto } from "./dto";
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

  async findAll(): Promise<GetAppointmentsDto[]> {
    return await this.appointment.findMany();
  }

  async findOne(id: number): Promise<GetAppointmentsDto> {
    try {
      const findOneAppointment = await this.appointment.findUnique({
        where: {
          id,
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
