import { Test, TestingModule } from "@nestjs/testing";
import { PrescriptionsService } from "./prescriptions.service";
import { MedicalRecordsService } from "../medical-records/medical-records.service";
import { NotFoundException } from "@nestjs/common";
import { CreatePrescriptionDto } from "./dto/create-prescription.dto";
import { UpdatePrescriptionDto } from "./dto/update-prescription.dto";

describe("PrescriptionsService", () => {
  let service: PrescriptionsService;
  let medicalRecordsService: MedicalRecordsService;

  const mockMedicalRecordsService = {
    findOne: jest.fn(),
  };

  const mockPrismaClient = {
    prescriptions: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        {
          provide: MedicalRecordsService,
          useValue: mockMedicalRecordsService,
        },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
    medicalRecordsService = module.get<MedicalRecordsService>(MedicalRecordsService);

    Object.assign(service, mockPrismaClient);
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
      mockPrismaClient.prescriptions.create.mockResolvedValue(mockCreatedPrescription);

      const result = await service.create(dto);

      expect(medicalRecordsService.findOne).toHaveBeenCalledWith(dto.medicalRecordId);
      expect(mockPrismaClient.prescriptions.create).toHaveBeenCalledWith({ data: dto });
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
    it("should return all prescriptions with medical records", async () => {
      const mockPrescriptions = [
        { id: 1, MedicalRecord: { id: 1 } },
        { id: 2, MedicalRecord: { id: 2 } },
      ];

      mockPrismaClient.prescriptions.findMany.mockResolvedValue(mockPrescriptions);

      const result = await service.findAll();

      expect(mockPrismaClient.prescriptions.findMany).toHaveBeenCalledWith({
        include: { MedicalRecord: true },
      });
      expect(result).toEqual(mockPrescriptions);
    });
  });

  describe("findOne", () => {
    it("should return a prescription when found", async () => {
      const mockPrescription = { id: 1, note: "Test" };

      mockPrismaClient.prescriptions.findUnique.mockResolvedValue(mockPrescription);

      const result = await service.findOne(1);

      expect(mockPrismaClient.prescriptions.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockPrescription);
    });

    it("should throw NotFoundException when prescription not found", async () => {
      mockPrismaClient.prescriptions.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow("Prescription not found");
    });
  });

  describe("update", () => {
    it("should update a prescription when found", async () => {
      const dto: UpdatePrescriptionDto = { note: "Updated" } as any;
      const mockExisting = { id: 1, note: "Old" };
      const mockUpdated = { id: 1, note: "Updated" };

      mockPrismaClient.prescriptions.findUnique.mockResolvedValue(mockExisting);
      mockPrismaClient.prescriptions.update.mockResolvedValue(mockUpdated);

      const result = await service.update(1, dto);

      expect(mockPrismaClient.prescriptions.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
      expect(result).toEqual({
        message: "Prescription updated successfully",
        updatedPrescription: mockUpdated,
      });
    });

    it("should throw NotFoundException if prescription does not exist", async () => {
      mockPrismaClient.prescriptions.findUnique.mockResolvedValue(null);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete a prescription when found", async () => {
      const mockPrescription = { id: 1, note: "Test" };

      mockPrismaClient.prescriptions.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaClient.prescriptions.delete.mockResolvedValue(mockPrescription);

      const result = await service.remove(1);

      expect(mockPrismaClient.prescriptions.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        message: "Prescription deleted successfully",
        deletedPrescription: mockPrescription,
      });
    });

    it("should throw NotFoundException if prescription does not exist", async () => {
      mockPrismaClient.prescriptions.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
