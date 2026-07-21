import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Status } from "@prisma/client";
import { CreateDiagnosisDto, CreateIntermentDto, PatchDiagnosisDto, UpdateIntermentDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class IntermentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createIntermentDto: CreateIntermentDto) {
    try {
      const { diagnosis, ...intermentData } = createIntermentDto;

      const interment = await this.prisma.interment.create({
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

    const [totalInterments, data] = await Promise.all([
      this.prisma.interment.count(),
      this.prisma.interment.findMany({
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
      }),
    ]);

    return {
      totalPages: Math.ceil(totalInterments / limit),
      page,
      total: totalInterments,
      data,
    };
  }

  async findOne(id: number) {
    try {
      const interment = await this.prisma.interment.findUnique({
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
      if (error instanceof NotFoundException) throw error;
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
    try {
      const updatedStatusOfInterment = await this.prisma.interment.update({
        where: {
          id: id,
        },
        data: {
          status: status,
          dischargeDate: status === Status.COMPLETED ? new Date() : null,
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Interment #${id} not found`);
      }
      throw new BadRequestException(error.message);
    }
  }

  async updateDiagnosisById(intermentId: number, updateDiagnosisDto: PatchDiagnosisDto) {
    try {
      const updatedDiagnosis = await this.prisma.diagnosis.update({
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Diagnosis #${intermentId} not found`);
      }
      throw new BadRequestException(error.message);
    }
  }

  async getAllDiagnosis(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const [total, data] = await Promise.all([
      this.prisma.diagnosis.count(),
      this.prisma.diagnosis.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "desc" },
      }),
    ]);

    return {
      totalPage: Math.ceil(total / limit),
      page,
      total,
      data,
    };
  }

  async getDiagnosisById(id: number) {
    const findDiagnosisById = await this.prisma.diagnosis.findUnique({
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
    try {
      const createdDiagnosis = await this.prisma.interment.update({
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Interment #${intermentId} not found`);
      }
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.interment.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`Interment #${id} not found`);
      }
      throw error;
    }

    return `Interment #${id} deleted successfully`;
  }
}
