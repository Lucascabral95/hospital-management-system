import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { CreatePrescriptionDto, UpdatePrescriptionDto } from "./dto";
import { PrismaClient } from "@prisma/client";
import { MedicalRecordsService } from "src/medical-records/medical-records.service";

@Injectable()
export class PrescriptionsService extends PrismaClient implements OnModuleInit {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {
    super();
  }

  onModuleInit() {
    this.$connect();
  }

  async create(createPrescriptionDto: CreatePrescriptionDto) {
    const findMedicalRecord = await this.medicalRecordsService.findOne(createPrescriptionDto.medicalRecordId);

    if (!findMedicalRecord) {
      throw new NotFoundException(`MedicalRecord #${createPrescriptionDto.medicalRecordId} not found`);
    }

    return await this.prescriptions.create({
      data: createPrescriptionDto,
    });
  }

  async findAll() {
    return await this.prescriptions.findMany({
      include: {
        MedicalRecord: true,
      },
    });
  }

  async findOne(id: number) {
    const findPrescriptionById = await this.prescriptions.findUnique({
      where: { id },
    });

    if (!findPrescriptionById) {
      throw new NotFoundException("Prescription not found");
    }

    return findPrescriptionById;
  }

  async update(id: number, updatePrescriptionDto: UpdatePrescriptionDto) {
    await this.findOne(id);

    const updatedPrescription = await this.prescriptions.update({
      where: { id },
      data: updatePrescriptionDto,
    });

    return {
      message: "Prescription updated successfully",
      updatedPrescription,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    const deletedPrescription = await this.prescriptions.delete({
      where: {
        id,
      },
    });

    return {
      message: "Prescription deleted successfully",
      deletedPrescription,
    };
  }
}
