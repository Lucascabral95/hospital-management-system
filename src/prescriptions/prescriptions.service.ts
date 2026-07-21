import { Injectable, NotFoundException } from "@nestjs/common";
import { CreatePrescriptionDto, UpdatePrescriptionDto } from "./dto";
import { Prisma } from "@prisma/client";
import { MedicalRecordsService } from "src/medical-records/medical-records.service";
import { PrismaService } from "src/prisma/prisma.service";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly medicalRecordsService: MedicalRecordsService,
  ) {}

  async create(createPrescriptionDto: CreatePrescriptionDto) {
    const findMedicalRecord = await this.medicalRecordsService.findOne(createPrescriptionDto.medicalRecordId);

    if (!findMedicalRecord) {
      throw new NotFoundException(`MedicalRecord #${createPrescriptionDto.medicalRecordId} not found`);
    }

    return await this.prisma.prescriptions.create({
      data: createPrescriptionDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const [total, prescriptions] = await Promise.all([
      this.prisma.prescriptions.count(),
      this.prisma.prescriptions.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          MedicalRecord: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      totalPage: Math.ceil(total / limit),
      page,
      total,
      data: prescriptions,
    };
  }

  async findOne(id: number) {
    const findPrescriptionById = await this.prisma.prescriptions.findUnique({
      where: { id },
    });

    if (!findPrescriptionById) {
      throw new NotFoundException("Prescription not found");
    }

    return findPrescriptionById;
  }

  async update(id: number, updatePrescriptionDto: UpdatePrescriptionDto) {
    try {
      const updatedPrescription = await this.prisma.prescriptions.update({
        where: { id },
        data: updatePrescriptionDto,
      });

      return {
        message: "Prescription updated successfully",
        updatedPrescription,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Prescription not found");
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const deletedPrescription = await this.prisma.prescriptions.delete({
        where: {
          id,
        },
      });

      return {
        message: "Prescription deleted successfully",
        deletedPrescription,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Prescription not found");
      }
      throw error;
    }
  }
}
