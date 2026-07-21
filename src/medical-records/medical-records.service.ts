import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from "./dto";
import { Prisma } from "@prisma/client";
import { PatientsService } from "src/patients/patients.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { AuthService } from "src/auth/auth.service";
import { PrismaService } from "src/prisma/prisma.service";

const DOCTOR_WITH_AUTH_SELECT = {
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
} satisfies Prisma.DoctorSelect;

const PATIENT_SUMMARY_SELECT = {
  id: true,
  dni: true,
  name: true,
  last_name: true,
  date_born: true,
  gender: true,
  country: true,
} satisfies Prisma.PatientsSelect;

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientService: PatientsService,
    private readonly authService: AuthService,
  ) {}

  async create(createMedicalRecordDto: CreateMedicalRecordDto) {
    const findAuth = await this.authService.findOne(createMedicalRecordDto.doctorId);
    if (!findAuth) {
      throw new NotFoundException(`Auth #${createMedicalRecordDto.doctorId} not found`);
    }

    const findPatient = await this.patientService.findOne(createMedicalRecordDto.patientsId);
    if (!findPatient) {
      throw new NotFoundException(`Patient #${createMedicalRecordDto.patientsId} not found`);
    }

    return await this.prisma.medicalRecord.create({
      data: {
        ...createMedicalRecordDto,
      },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const [total, medicalRecords] = await Promise.all([
      this.prisma.medicalRecord.count(),
      this.prisma.medicalRecord.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      totalPage: Math.ceil(total / limit),
      page,
      total,
      data: medicalRecords,
    };
  }

  async findAllWithPatientsAndDoctors(paginationDto: PaginationDto) {
    const { limit, page } = paginationDto;

    const [totalRecords, medicalRecords] = await Promise.all([
      this.prisma.medicalRecord.count(),
      this.prisma.medicalRecord.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          date: true,
          reasonForVisit: true,
          diagnosis: true,
          treatment: true,
          createdAt: true,
          updatedAt: true,
          Doctor: { select: DOCTOR_WITH_AUTH_SELECT },
          Patients: { select: PATIENT_SUMMARY_SELECT },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return {
      totalPage: Math.ceil(totalRecords / limit),
      page: page,
      total: totalRecords,
      data: medicalRecords,
    };
  }

  // -----------------------

  async findMedicalRecordsByPatientId(id: number, paginationDto: PaginationDto) {
    await this.patientService.findOne(id);
    const { order, sortedBy = "createdAt" } = paginationDto;

    try {
      const findMedicalRecordsByPatientId = await this.prisma.medicalRecord.findMany({
        where: {
          patientsId: id,
        },
        orderBy: {
          [sortedBy]: order,
        },
        include: {
          Doctor: {
            select: DOCTOR_WITH_AUTH_SELECT,
          },
          Patients: {
            select: PATIENT_SUMMARY_SELECT,
          },
        },
      });

      return findMedicalRecordsByPatientId;
    } catch (error) {
      throw new NotFoundException(`Medical records for patient #${id} not found`);
    }
  }

  async findMedicalRecordsByDoctorId(id: number, paginationDto: PaginationDto) {
    await this.authService.findOne(id);

    const { order, sortedBy = "createdAt" } = paginationDto;

    try {
      const findMedicalRecordsByDoctorId = await this.prisma.medicalRecord.findMany({
        where: {
          Doctor: {
            auth: {
              id: id,
            },
          },
        },
        orderBy: {
          [sortedBy]: order,
        },
        include: {
          Doctor: {
            select: DOCTOR_WITH_AUTH_SELECT,
          },
          Patients: {
            select: PATIENT_SUMMARY_SELECT,
          },
        },
      });

      return findMedicalRecordsByDoctorId;
    } catch (error) {
      throw new NotFoundException(`Medical records for doctor #${id} not found`);
    }
  }

  // -----------------------

  async findOne(id: number) {
    const findOneMedicalRecord = await this.prisma.medicalRecord.findUnique({
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
    try {
      return await this.prisma.medicalRecord.update({
        where: {
          id,
        },
        data: {
          ...updateMedicalRecordDto,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`MedicalRecord #${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.medicalRecord.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException(`MedicalRecord #${id} not found`);
      }
      throw error;
    }
  }
}
