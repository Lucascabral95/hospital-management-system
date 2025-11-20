import { Test, TestingModule } from "@nestjs/testing";
import { PatientsService } from "./patients.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

describe("PatientsService", () => {
  let service: PatientsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    patients: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a patient successfully", async () => {
      const dto: CreatePatientDto = { name: "John", last_name: "Doe", dni: "12345678" } as any;
      const mockCreated = { id: 1, ...dto };

      mockPrismaService.patients.create.mockResolvedValue(mockCreated);

      const result = await service.create(dto);

      expect(prisma.patients.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(mockCreated);
    });

    it("should throw ConflictException when DNI already exists (P2002)", async () => {
      const dto: CreatePatientDto = { dni: "12345678" } as any;
      const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
      });

      mockPrismaService.patients.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow("DNI already exists");
    });

    it("should throw BadRequestException on other errors", async () => {
      const dto: CreatePatientDto = { dni: "12345678" } as any;
      mockPrismaService.patients.create.mockRejectedValue(new Error("Database error"));

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated patients", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10, order: "asc", sortedBy: "name" } as any;
      const mockPatients = [{ id: 1, name: "John" }];

      mockPrismaService.patients.count.mockResolvedValue(15);
      mockPrismaService.patients.findMany.mockResolvedValue(mockPatients);

      const result = await service.findAll(paginationDto);

      expect(prisma.patients.count).toHaveBeenCalledWith({ where: {} });
      expect(prisma.patients.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { name: "asc" },
      });
      expect(result).toEqual({
        totalPages: 2,
        page: 1,
        total: 15,
        data: mockPatients,
      });
    });

    it("should filter by gender when provided", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10, gender: "M" } as any;

      mockPrismaService.patients.count.mockResolvedValue(5);
      mockPrismaService.patients.findMany.mockResolvedValue([]);

      await service.findAll(paginationDto);

      expect(prisma.patients.count).toHaveBeenCalledWith({ where: { gender: "M" } });
      expect(prisma.patients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gender: "M" },
        }),
      );
    });
  });

  describe("findAllPatientsWithoutPagination", () => {
    it("should return patients matching search query", async () => {
      const mockPatients = [{ id: 1, name: "John", last_name: "Doe" }];

      mockPrismaService.patients.findMany.mockResolvedValue(mockPatients);

      const result = await service.findAllPatientsWithoutPagination("John");

      expect(prisma.patients.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "John", mode: "insensitive" } },
            { last_name: { contains: "John", mode: "insensitive" } },
          ],
        },
      });
      expect(result).toEqual(mockPatients);
    });

    it("should throw NotFoundException when no patient provided", async () => {
      await expect(service.findAllPatientsWithoutPagination("")).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when no patients found", async () => {
      mockPrismaService.patients.findMany.mockResolvedValue([]);

      await expect(service.findAllPatientsWithoutPagination("NonExistent")).rejects.toThrow(BadRequestException);
      await expect(service.findAllPatientsWithoutPagination("NonExistent")).rejects.toThrow("Patient not found");
    });
  });

  describe("findAllSelect", () => {
    it("should return patients with selected fields", async () => {
      const mockPatients = [{ id: 1, name: "John", last_name: "Doe", dni: "12345678" }];

      mockPrismaService.patients.findMany.mockResolvedValue(mockPatients);

      const result = await service.findAllSelect();

      expect(prisma.patients.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true, last_name: true, dni: true },
      });
      expect(result).toEqual(mockPatients);
    });
  });

  describe("findOne", () => {
    it("should return a patient by id", async () => {
      const mockPatient = { id: 1, name: "John" };

      mockPrismaService.patients.findUnique.mockResolvedValue(mockPatient);

      const result = await service.findOne(1);

      expect(prisma.patients.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockPatient);
    });

    it("should throw NotFoundException when patient not found", async () => {
      mockPrismaService.patients.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow("Patient not found");
    });
  });

  describe("findByDni", () => {
    it("should return patient by DNI", async () => {
      const mockPatient = { id: 1, name: "John", dni: "12345678" };

      mockPrismaService.patients.findUnique.mockResolvedValue(mockPatient);

      const result = await service.findByDni("12345678");

      expect(prisma.patients.findUnique).toHaveBeenCalledWith({
        where: { dni: "12345678" },
        select: { id: true, name: true, last_name: true, dni: true, date_born: true },
      });
      expect(result).toEqual(mockPatient);
    });

    it("should throw BadRequestException when DNI not found", async () => {
      mockPrismaService.patients.findUnique.mockResolvedValue(null);

      await expect(service.findByDni("99999999")).rejects.toThrow(BadRequestException);
      await expect(service.findByDni("99999999")).rejects.toThrow("Patient with DNI 99999999 not found");
    });
  });

  describe("getMedicalRecordsByPatientId", () => {
    it("should return patient with medical records", async () => {
      const mockPatient = { id: 1, name: "John" };
      const mockWithRecords = { ...mockPatient, medical_records: [] };

      mockPrismaService.patients.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.patients.findFirst.mockResolvedValue(mockWithRecords);

      const result = await service.getMedicalRecordsByPatientId(1);

      expect(prisma.patients.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.objectContaining({ medical_records: expect.any(Object) }),
      });
      expect(result).toEqual(mockWithRecords);
    });
  });

  describe("update", () => {
    it("should update a patient successfully", async () => {
      const dto: UpdatePatientDto = { name: "Updated" } as any;
      const mockPatient = { id: 1, name: "John" };
      const mockUpdated = { id: 1, name: "Updated" };

      mockPrismaService.patients.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.patients.update.mockResolvedValue(mockUpdated);

      const result = await service.update(1, dto);

      expect(prisma.patients.update).toHaveBeenCalledWith({ where: { id: 1 }, data: dto });
      expect(result).toEqual({
        message: "Patient updated successfully",
        updatedPatient: mockUpdated,
      });
    });

    it("should throw NotFoundException if patient does not exist", async () => {
      mockPrismaService.patients.findUnique.mockResolvedValue(null);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete a patient successfully", async () => {
      const mockPatient = { id: 1, name: "John" };

      mockPrismaService.patients.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.patients.delete.mockResolvedValue(mockPatient);

      const result = await service.remove(1);

      expect(prisma.patients.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        message: "Patient deleted successfully",
        deletedPatient: mockPatient,
      });
    });

    it("should throw NotFoundException if patient does not exist", async () => {
      mockPrismaService.patients.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("seed", () => {
    it("should seed patients successfully", async () => {
      mockPrismaService.patients.createMany.mockResolvedValue({ count: 10 });

      const result = await service.seed();

      expect(prisma.patients.createMany).toHaveBeenCalled();
      expect(result).toBe("Seeded successfully");
    });

    it("should throw InternalServerErrorException on error", async () => {
      mockPrismaService.patients.createMany.mockRejectedValue(new Error("Seed error"));

      await expect(service.seed()).rejects.toThrow(InternalServerErrorException);
    });
  });
});
