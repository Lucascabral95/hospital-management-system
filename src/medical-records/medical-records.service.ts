import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from "./dto";
import { PrismaClient } from "@prisma/client";
import { DoctorsService } from "src/doctors/doctors.service";
import { PatientsService } from "src/patients/patients.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { AuthService } from "src/auth/auth.service";

@Injectable()
export class MedicalRecordsService extends PrismaClient implements OnModuleInit {
  constructor(
    private readonly doctorService: DoctorsService,
    private readonly patientService: PatientsService,
    private readonly authService: AuthService,
  ) {
    super();
  }
  onModuleInit() {
    this.$connect();
  }

  async create(createMedicalRecordDto: CreateMedicalRecordDto) {
    // const findDoctor = await this.doctorService.findOne(createMedicalRecordDto.doctorId);
    // if (!findDoctor) {
    //   throw new NotFoundException(`Doctor #${createMedicalRecordDto.doctorId} not found`);
    // }
    const findAuth = await this.authService.findOne(createMedicalRecordDto.doctorId);
    if (!findAuth) {
      throw new NotFoundException(`Auth #${createMedicalRecordDto.doctorId} not found`);
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

  // -----------------------

  async findMedicalRecordsByPatientId(id: number, paginationDto: PaginationDto) {
    await this.patientService.findOne(id);
    const { order, sortedBy = "createdAt" } = paginationDto;

    try {
      const findMedicalRecordsByPatientId = await this.medicalRecord.findMany({
        where: {
          patientsId: id,
        },
        orderBy: {
          [sortedBy]: order,
        },
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
          Patients: {
            select: {
              id: true,
              dni: true,
              name: true,
              last_name: true,
              date_born: true,
              gender: true,
              country: true,
            },
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
      const findMedicalRecordsByDoctorId = await this.medicalRecord.findMany({
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
          Patients: {
            select: {
              id: true,
              dni: true,
              name: true,
              last_name: true,
              date_born: true,
              gender: true,
              country: true,
            },
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
