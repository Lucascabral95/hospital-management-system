import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { CreatePatientDto, UpdatePatientDto } from "./dto";
import { Prisma } from "@prisma/client";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { patients } from "mock";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PatientsService {
  private readonly logger = new Logger("PatientsService");

  constructor(private readonly prisma: PrismaService) {
    this.logger.log(`Connected to database`);
  }

  async create(createPatientDto: CreatePatientDto) {
    try {
      const creationPatient = await this.prisma.patients.create({
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
    const { page, limit, gender, order = "desc", sortedBy = "name" } = paginationDto;

    const where = gender ? { gender } : {};
    const columnSorted = ["name", "date_born"];
    const sortedParameter = ["asc", "desc"];

    const sortByFinal = columnSorted.includes(sortedBy) ? sortedBy : "name";
    const orderFinal = sortedParameter.includes(order) ? order : "desc";

    const totalPatients = await this.prisma.patients.count({ where });
    const totalPages = Math.ceil(totalPatients / limit);

    const data = await this.prisma.patients.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: {
        [sortByFinal]: orderFinal,
      },
    });

    return {
      totalPages,
      page,
      total: totalPatients,
      data,
    };
  }

  async findAllPatientsWithoutPagination(patient: string) {
    if (!patient) {
      throw new NotFoundException("Patient not found");
    }

    try {
      const patientSearched = await this.prisma.patients.findMany({
        where: {
          OR: [
            {
              name: {
                contains: patient,
                mode: "insensitive",
              },
            },
            {
              last_name: {
                contains: patient,
                mode: "insensitive",
              },
            },
          ],
        },
      });

      if (patientSearched.length === 0) {
        throw new NotFoundException("Patient not found");
      }

      return patientSearched;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllSelect() {
    try {
      const allPatients = await this.prisma.patients.findMany({
        select: {
          id: true,
          name: true,
          last_name: true,
          dni: true,
        },
      });

      return allPatients;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getMedicalRecordsByPatientId(id: number) {
    await this.findOne(id);

    try {
      const findMedicalRecordsOfPatiend = await this.prisma.patients.findFirst({
        where: {
          id: id,
        },
        include: {
          medical_records: {
            include: {
              Doctor: {
                select: {
                  id: true,
                  specialty: true,
                  licenceNumber: true,
                  auth: {
                    select: {
                      id: true,
                      full_name: true,
                      email: true,
                      role: true,
                      is_active: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return findMedicalRecordsOfPatiend;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findOne(id: number) {
    const findUserById = await this.prisma.patients.findUnique({
      where: {
        id,
      },
    });

    if (!findUserById) {
      throw new NotFoundException("Patient not found");
    }

    return findUserById;
  }

  async findByDni(dni: string) {
    try {
      const findByDni = await this.prisma.patients.findUnique({
        where: {
          dni: dni,
        },
        select: {
          id: true,
          name: true,
          last_name: true,
          dni: true,
          date_born: true,
        },
      });

      if (!findByDni) {
        throw new NotFoundException(`Patient with DNI ${dni} not found`);
      }

      return findByDni;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, updatePatientDto: UpdatePatientDto) {
    await this.findOne(id);

    try {
      const updatedPatient = await this.prisma.patients.update({
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
      const deletedPatient = await this.prisma.patients.delete({
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
      await this.prisma.patients.createMany({
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
