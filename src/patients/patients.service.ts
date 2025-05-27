import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { CreatePatientDto, UpdatePatientDto } from "./dto";
import { PrismaClient, Prisma } from "@prisma/client";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { patients } from "mock";

@Injectable()
export class PatientsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger("PatientsService");

  onModuleInit() {
    this.$connect();
    this.logger.log(`Connected to database`);
  }

  async create(createPatientDto: CreatePatientDto) {
    try {
      const creationPatient = await this.patients.create({
        data: createPatientDto,
      });

      return creationPatient;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("DNI already exists");
        }
      }
      throw new BadRequestException(error.message);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, gender } = paginationDto;

    const where = gender ? { gender } : {};

    const totalPatients = await this.patients.count({ where });
    const totalPages = Math.ceil(totalPatients / limit);

    const data = await this.patients.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
    });

    return {
      totalPages,
      page,
      total: totalPatients,
      data,
    };
  }

  async findOne(id: number) {
    const findUserById = await this.patients.findUnique({
      where: {
        id,
      },
    });

    if (!findUserById) {
      throw new NotFoundException("Patient not found");
    }

    return findUserById;
  }

  async update(id: number, updatePatientDto: UpdatePatientDto) {
    await this.findOne(id);

    try {
      const updatedPatient = await this.patients.update({
        where: { id },
        data: updatePatientDto,
      });

      return {
        message: "Patient updated successfully",
        updatedPatient,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      const deletedPatient = await this.patients.delete({
        where: { id },
      });

      return {
        message: "Patient deleted successfully",
        deletedPatient,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async seed() {
    try {
      await this.patients.createMany({
        data: patients,
        skipDuplicates: true,
      });

      return "Seeded successfully";
    } catch (error) {
      console.log("Error seeding patients");
      throw new InternalServerErrorException(error.message);
    }
  }
}
