import { Test, TestingModule } from "@nestjs/testing";
import { MedicalRecordsService } from "./medical-records.service";
import { DoctorsService } from "../doctors/doctors.service";
import { PatientsService } from "../patients/patients.service";
import { AuthService } from "../auth/auth.service";
import { CreateMedicalRecordDto } from "./dto/create-medical-record.dto";
import { UpdateMedicalRecordDto } from "./dto/update-medical-record.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { NotFoundException } from "@nestjs/common";

describe("MedicalRecordsService", () => {
  let service: MedicalRecordsService;
  let doctorsService: DoctorsService;
  let patientsService: PatientsService;
  let authService: AuthService;

  const mockDoctorsService = {
    findOne: jest.fn(),
  };

  const mockPatientsService = {
    findOne: jest.fn(),
  };

  const mockAuthService = {
    findOne: jest.fn(),
  };

  const mockPrismaClient = {
    medicalRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $connect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalRecordsService,
        {
          provide: DoctorsService,
          useValue: mockDoctorsService,
        },
        {
          provide: PatientsService,
          useValue: mockPatientsService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<MedicalRecordsService>(MedicalRecordsService);
    doctorsService = module.get<DoctorsService>(DoctorsService);
    patientsService = module.get<PatientsService>(PatientsService);
    authService = module.get<AuthService>(AuthService);

    Object.assign(service, mockPrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a medical record when auth and patient exist", async () => {
      const dto: CreateMedicalRecordDto = { doctorId: 1, patientsId: 2, diagnosis: "Flu" } as any;
      const mockAuth = { id: 1, full_name: "Dr. Smith" };
      const mockPatient = { id: 2, name: "John" };
      const mockCreated = { id: 1, ...dto };

      mockAuthService.findOne.mockResolvedValue(mockAuth);
      mockPatientsService.findOne.mockResolvedValue(mockPatient);
      mockPrismaClient.medicalRecord.create.mockResolvedValue(mockCreated);

      const result = await service.create(dto);

      expect(authService.findOne).toHaveBeenCalledWith(dto.doctorId);
      expect(patientsService.findOne).toHaveBeenCalledWith(dto.patientsId);
      expect(mockPrismaClient.medicalRecord.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(mockCreated);
    });

    it("should throw NotFoundException when auth not found", async () => {
      const dto: CreateMedicalRecordDto = { doctorId: 999, patientsId: 2 } as any;

      mockAuthService.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow("Auth #999 not found");
    });

    it("should throw NotFoundException when patient not found", async () => {
      const dto: CreateMedicalRecordDto = { doctorId: 1, patientsId: 999 } as any;
      const mockAuth = { id: 1 };

      mockAuthService.findOne.mockResolvedValue(mockAuth);
      mockPatientsService.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow("Patient #999 not found");
    });
  });

  describe("findAll", () => {
    it("should return all medical records", async () => {
      const mockRecords = [{ id: 1 }, { id: 2 }];

      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(mockRecords);

      const result = await service.findAll();

      expect(mockPrismaClient.medicalRecord.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockRecords);
    });
  });

  describe("findAllWithPatientsAndDoctors", () => {
    it("should return paginated medical records with relations", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 } as any;
      const mockRecords = [{ id: 1, Doctor: {}, Patients: {} }];

      mockPrismaClient.medicalRecord.count.mockResolvedValue(25);
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(mockRecords);

      const result = await service.findAllWithPatientsAndDoctors(paginationDto);

      expect(mockPrismaClient.medicalRecord.count).toHaveBeenCalled();
      expect(mockPrismaClient.medicalRecord.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: {
          Doctor: { include: { auth: true } },
          Patients: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual({
        totalPage: 3,
        page: 1,
        total: 25,
        data: mockRecords,
      });
    });
  });

  describe("findMedicalRecordsByPatientId", () => {
    it("should return medical records for a patient", async () => {
      const patientId = 5;
      const paginationDto: PaginationDto = { order: "asc", sortedBy: "createdAt" } as any;
      const mockPatient = { id: 5 };
      const mockRecords = [{ id: 1, patientsId: 5 }];

      mockPatientsService.findOne.mockResolvedValue(mockPatient);
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(mockRecords);

      const result = await service.findMedicalRecordsByPatientId(patientId, paginationDto);

      expect(patientsService.findOne).toHaveBeenCalledWith(patientId);
      expect(mockPrismaClient.medicalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientsId: patientId },
          orderBy: { createdAt: "asc" },
        }),
      );
      expect(result).toEqual(mockRecords);
    });

    it("should throw NotFoundException on database error", async () => {
      const patientId = 5;
      const paginationDto: PaginationDto = { order: "asc" } as any;
      const mockPatient = { id: 5 };

      mockPatientsService.findOne.mockResolvedValue(mockPatient);
      mockPrismaClient.medicalRecord.findMany.mockRejectedValue(new Error("DB error"));

      await expect(service.findMedicalRecordsByPatientId(patientId, paginationDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("findMedicalRecordsByDoctorId", () => {
    it("should return medical records for a doctor", async () => {
      const doctorId = 3;
      const paginationDto: PaginationDto = { order: "desc", sortedBy: "createdAt" } as any;
      const mockAuth = { id: 3 };
      const mockRecords = [{ id: 1, doctorId: 3 }];

      mockAuthService.findOne.mockResolvedValue(mockAuth);
      mockPrismaClient.medicalRecord.findMany.mockResolvedValue(mockRecords);

      const result = await service.findMedicalRecordsByDoctorId(doctorId, paginationDto);

      expect(authService.findOne).toHaveBeenCalledWith(doctorId);
      expect(mockPrismaClient.medicalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { Doctor: { auth: { id: doctorId } } },
          orderBy: { createdAt: "desc" },
        }),
      );
      expect(result).toEqual(mockRecords);
    });

    it("should throw NotFoundException on database error", async () => {
      const doctorId = 3;
      const paginationDto: PaginationDto = { order: "desc" } as any;
      const mockAuth = { id: 3 };

      mockAuthService.findOne.mockResolvedValue(mockAuth);
      mockPrismaClient.medicalRecord.findMany.mockRejectedValue(new Error("DB error"));

      await expect(service.findMedicalRecordsByDoctorId(doctorId, paginationDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("findOne", () => {
    it("should return a medical record by id", async () => {
      const mockRecord = { id: 1, diagnosis: "Flu" };

      mockPrismaClient.medicalRecord.findUnique.mockResolvedValue(mockRecord);

      const result = await service.findOne(1);

      expect(mockPrismaClient.medicalRecord.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockRecord);
    });

    it("should throw NotFoundException when record not found", async () => {
      mockPrismaClient.medicalRecord.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow("MedicalRecord #999 not found");
    });
  });

  describe("update", () => {
    it("should update a medical record", async () => {
      const dto: UpdateMedicalRecordDto = { diagnosis: "Updated" } as any;
      const mockExisting = { id: 1, diagnosis: "Flu" };
      const mockUpdated = { id: 1, diagnosis: "Updated" };

      mockPrismaClient.medicalRecord.findUnique.mockResolvedValue(mockExisting);
      mockPrismaClient.medicalRecord.update.mockResolvedValue(mockUpdated);

      const result = await service.update(1, dto);

      expect(mockPrismaClient.medicalRecord.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
      expect(result).toEqual(mockUpdated);
    });

    it("should throw NotFoundException if record does not exist", async () => {
      mockPrismaClient.medicalRecord.findUnique.mockResolvedValue(null);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete a medical record", async () => {
      const mockRecord = { id: 1, diagnosis: "Flu" };

      mockPrismaClient.medicalRecord.findUnique.mockResolvedValue(mockRecord);
      mockPrismaClient.medicalRecord.delete.mockResolvedValue(mockRecord);

      const result = await service.remove(1);

      expect(mockPrismaClient.medicalRecord.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockRecord);
    });

    it("should throw NotFoundException if record does not exist", async () => {
      mockPrismaClient.medicalRecord.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
