import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from "./dto";
import { PrismaClient } from "@prisma/client";
import { DoctorsService } from "src/doctors/doctors.service";
import { PatientsService } from "src/patients/patients.service";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Injectable()
export class MedicalRecordsService extends PrismaClient implements OnModuleInit {
  constructor(
    private readonly doctorService: DoctorsService,
    private readonly patientService: PatientsService,
  ) {
    super();
  }
  onModuleInit() {
    this.$connect();
  }

  async create(createMedicalRecordDto: CreateMedicalRecordDto) {
    const findDoctor = await this.doctorService.findOne(createMedicalRecordDto.doctorId);
    if (!findDoctor) {
      throw new NotFoundException(`Doctor #${createMedicalRecordDto.doctorId} not found`);
    }

    const findPatient = await this.patientService.findOne(createMedicalRecordDto.patientsId);
    if (!findPatient) {
      throw new NotFoundException(`Patient #${createMedicalRecordDto.patientsId} not found`);
    }

    return await this.medicalRecord.create({
      data: {
        ...createMedicalRecordDto,
      },
    });
  }

  async findAll() {
    return await this.medicalRecord.findMany();
  }

  async findAllWithPatientsAndDoctors(paginationDto: PaginationDto) {
    const { limit, page } = paginationDto;
    const totalPages = Math.ceil((await this.medicalRecord.count()) / limit);
    const totalRecords = await this.medicalRecord.count();

    const medicalRecords = await this.medicalRecord.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        Doctor: {
          include: {
            auth: true,
          },
        },
        Patients: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      totalPage: totalPages,
      page: page,
      total: totalRecords,
      data: medicalRecords,
    };
  }

  async findOne(id: number) {
    const findOneMedicalRecord = await this.medicalRecord.findUnique({
      where: {
        id,
      },
    });

    if (!findOneMedicalRecord) {
      throw new NotFoundException(`MedicalRecord #${id} not found`);
    }

    return findOneMedicalRecord;
  }

  async update(id: number, updateMedicalRecordDto: UpdateMedicalRecordDto) {
    await this.findOne(id);

    return await this.medicalRecord.update({
      where: {
        id,
      },
      data: {
        ...updateMedicalRecordDto,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return await this.medicalRecord.delete({
      where: {
        id,
      },
    });
  }
}
