import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { PrismaClient, Status } from "@prisma/client";
import { CreateDiagnosisDto, CreateIntermentDto, PatchDiagnosisDto, UpdateIntermentDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Injectable()
export class IntermentService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async create(createIntermentDto: CreateIntermentDto) {
    try {
      const { diagnosis, ...intermentData } = createIntermentDto;

      const interment = await this.interment.create({
        data: {
          ...intermentData,
          ...(diagnosis && diagnosis.length > 0
            ? {
                Diagnosis: {
                  create: diagnosis,
                },
              }
            : {}),
        },
        include: {
          Diagnosis: true,
        },
      });

      return {
        message: "Interment created successfully",
        interment,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, sortedBy = "createdAt", order = "desc" } = paginationDto;

    const searchSort = ["createdAt"];

    const sortedByFinal = searchSort.includes(sortedBy) ? sortedBy : "createdAt";
    const orderFinal = ["asc", "desc"].includes(order) ? order : "desc";

    const data = await this.interment.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        Diagnosis: true,
        doctor: {
          select: {
            specialty: true,
            licenceNumber: true,
            id: true,
            auth: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
        patient: {
          select: {
            name: true,
            last_name: true,
            dni: true,
            date_born: true,
            gender: true,
            phone: true,
            street: true,
            city: true,
            state: true,
            zip_code: true,
          },
        },
      },
      orderBy: {
        [sortedByFinal]: orderFinal,
      },
    });

    const totalInterments = await this.interment.count();
    const totalPages = Math.ceil(totalInterments / limit);

    return {
      totalPages,
      page,
      total: totalInterments,
      data,
    };
  }

  async findOne(id: number) {
    try {
      const interment = await this.interment.findUnique({
        where: { id },
        include: {
          Diagnosis: true,
          doctor: {
            select: {
              specialty: true,
              licenceNumber: true,
              id: true,
              auth: {
                select: {
                  full_name: true,
                  email: true,
                },
              },
            },
          },
          patient: {
            select: {
              name: true,
              last_name: true,
              dni: true,
              date_born: true,
              gender: true,
              phone: true,
              street: true,
              city: true,
              state: true,
              zip_code: true,
            },
          },
        },
      });

      if (!interment) {
        throw new NotFoundException(`Interment #${id} not found`);
      }

      return interment;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, updateIntermentDto: UpdateIntermentDto) {
    await this.findOne(id);

    try {
      return {
        message: "Interment updated successfully",
        updateIntermentDto,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateStatus(id: number, status: Status) {
    await this.findOne(id);

    try {
      const updatedStatusOfInterment = await this.interment.update({
        where: {
          id: id,
        },
        data: {
          status: status,
          dischargeDate:
            status === Status.COMPLETED
              ? new Date()
              : status === Status.PENDING
                ? null
                : status === Status.IN_PROGRESS
                  ? null
                  : null,
        },
        include: {
          Diagnosis: true,
        },
      });

      return {
        message: "Interment status updated successfully",
        updatedStatusOfInterment,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateDiagnosisById(intermentId: number, updateDiagnosisDto: PatchDiagnosisDto) {
    await this.getDiagnosisById(intermentId);

    try {
      const updatedDiagnosis = await this.diagnosis.update({
        where: {
          id: intermentId,
        },
        data: updateDiagnosisDto,
      });

      return {
        message: "Diagnosis updated successfully",
        updatedDiagnosis,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllDiagnosis() {
    return await this.diagnosis.findMany();
  }

  async getDiagnosisById(id: number) {
    const findDiagnosisById = await this.diagnosis.findUnique({
      where: {
        id,
      },
    });

    if (!findDiagnosisById) {
      throw new NotFoundException(`Diagnosis #${id} not found`);
    }

    return findDiagnosisById;
  }

  async addDiagnosisInInterment(intermentId: number, createDiagnosisDto: CreateDiagnosisDto) {
    await this.findOne(intermentId);

    try {
      const createdDiagnosis = await this.interment.update({
        where: {
          id: intermentId,
        },
        data: {
          Diagnosis: {
            create: createDiagnosisDto,
          },
        },
      });

      return {
        message: "Diagnosis created successfully",
        createdDiagnosis,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.interment.delete({ where: { id } });

    return `Interment #${id} deleted successfully`;
  }

  async;
}
