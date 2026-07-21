import { Test, TestingModule } from "@nestjs/testing";
import { PrescriptionsService } from "./prescriptions.service";
import { MedicalRecordsService } from "../medical-records/medical-records.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreatePrescriptionDto } from "./dto/create-prescription.dto";
import { UpdatePrescriptionDto } from "./dto/update-prescription.dto";

describe("PrescriptionsService", () => {
  let service: PrescriptionsService;
  let medicalRecordsService: MedicalRecordsService;

  const mockMedicalRecordsService = {
    findOne: jest.fn(),
  };

  const mockPrismaService = {
    prescriptions: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        { provide: MedicalRecordsService, useValue: mockMedicalRecordsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
    medicalRecordsService = module.get<MedicalRecordsService>(MedicalRecordsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a prescription when medical record exists", async () => {
      const dto: CreatePrescriptionDto = { medicalRecordId: 1, note: "Test" } as any;
      const mockMedicalRecord = { id: 1, patientId: 1 };
      const mockCreatedPrescription = { id: 1, ...dto };

      mockMedicalRecordsService.findOne.mockResolvedValue(mockMedicalRecord);
      mockPrismaService.prescriptions.create.mockResolvedValue(mockCreatedPrescription);

      const result = await service.create(dto);

      expect(medicalRecordsService.findOne).toHaveBeenCalledWith(dto.medicalRecordId);
      expect(mockPrismaService.prescriptions.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(mockCreatedPrescription);
    });

    it("should throw NotFoundException when medical record does not exist", async () => {
      const dto: CreatePrescriptionDto = { medicalRecordId: 999 } as any;

      mockMedicalRecordsService.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow("MedicalRecord #999 not found");
    });
  });

  describe("findAll", () => {
    it("should return paginated prescriptions with medical records", async () => {
      const paginationDto = { page: 1, limit: 10 } as any;
      const mockPrescriptions = [
        { id: 1, MedicalRecord: { id: 1 } },
        { id: 2, MedicalRecord: { id: 2 } },
      ];

      mockPrismaService.prescriptions.count.mockResolvedValue(2);
      mockPrismaService.prescriptions.findMany.mockResolvedValue(mockPrescriptions);

      const result = await service.findAll(paginationDto);

      expect(mockPrismaService.prescriptions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          include: { MedicalRecord: true },
        }),
      );
      expect(result).toEqual({
        totalPage: 1,
        page: 1,
        total: 2,
        data: mockPrescriptions,
      });
    });
  });

  describe("findOne", () => {
    it("should return a prescription when found", async () => {
      const mockPrescription = { id: 1, note: "Test" };

      mockPrismaService.prescriptions.findUnique.mockResolvedValue(mockPrescription);

      const result = await service.findOne(1);

      expect(mockPrismaService.prescriptions.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockPrescription);
    });

    it("should throw NotFoundException when prescription not found", async () => {
      mockPrismaService.prescriptions.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow("Prescription not found");
    });
  });

  describe("update", () => {
    it("should update a prescription when found", async () => {
      const dto: UpdatePrescriptionDto = { note: "Updated" } as any;
      const mockUpdated = { id: 1, note: "Updated" };

      mockPrismaService.prescriptions.update.mockResolvedValue(mockUpdated);

      const result = await service.update(1, dto);

      expect(mockPrismaService.prescriptions.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
      expect(result).toEqual({
        message: "Prescription updated successfully",
        updatedPrescription: mockUpdated,
      });
    });

    it("should throw NotFoundException if prescription does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.prescriptions.update.mockRejectedValue(prismaError);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete a prescription when found", async () => {
      const mockPrescription = { id: 1, note: "Test" };

      mockPrismaService.prescriptions.delete.mockResolvedValue(mockPrescription);

      const result = await service.remove(1);

      expect(mockPrismaService.prescriptions.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        message: "Prescription deleted successfully",
        deletedPrescription: mockPrescription,
      });
    });

    it("should throw NotFoundException if prescription does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.prescriptions.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
