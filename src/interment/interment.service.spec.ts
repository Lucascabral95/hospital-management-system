import { Test, TestingModule } from "@nestjs/testing";
import { IntermentService } from "./interment.service";
import { PrismaService } from "../prisma/prisma.service";
import { PaginationDto } from "../common/dto/pagination.dto";
import { CreateIntermentDto, CreateDiagnosisDto } from "./dto/create-interment.dto";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma, Status } from "@prisma/client";
import { PatchDiagnosisDto, UpdateIntermentDto } from "./dto";

describe("IntermentService", () => {
  let service: IntermentService;

  const mockPrismaService = {
    interment: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    diagnosis: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntermentService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<IntermentService>(IntermentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create interment with diagnosis", async () => {
      const dto: CreateIntermentDto = {
        patientId: 1,
        doctorId: 1,
        diagnosis: [{ description: "test diagnosis" }],
      } as any;

      const mockResult = { id: 1, ...dto };
      mockPrismaService.interment.create.mockResolvedValue(mockResult);

      const result = await service.create(dto);

      expect(mockPrismaService.interment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            Diagnosis: expect.any(Object),
          }),
          include: { Diagnosis: true },
        }),
      );

      expect(result).toEqual({
        message: "Interment created successfully",
        interment: mockResult,
      });
    });

    it("should throw BadRequestException on error", async () => {
      mockPrismaService.interment.create.mockRejectedValue(new Error("DB error"));

      await expect(service.create({} as CreateIntermentDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated interments", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 } as any;
      const mockData = [{ id: 1 }];

      mockPrismaService.interment.count.mockResolvedValue(15);
      mockPrismaService.interment.findMany.mockResolvedValue(mockData);

      const result = await service.findAll(paginationDto);

      expect(mockPrismaService.interment.count).toHaveBeenCalled();
      expect(mockPrismaService.interment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          include: expect.any(Object),
          orderBy: { createdAt: "desc" },
        }),
      );

      expect(result).toEqual({
        totalPages: 2,
        page: 1,
        total: 15,
        data: mockData,
      });
    });
  });

  describe("findOne", () => {
    it("should return interment if found", async () => {
      const mockInterment = { id: 1 };
      mockPrismaService.interment.findUnique.mockResolvedValue(mockInterment);

      const result = await service.findOne(1);

      expect(mockPrismaService.interment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: expect.any(Object),
        }),
      );

      expect(result).toEqual(mockInterment);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.interment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow("Interment #999 not found");
    });

    it("should throw BadRequestException on error", async () => {
      mockPrismaService.interment.findUnique.mockRejectedValue(new Error("DB error"));

      await expect(service.findOne(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe("update", () => {
    it("should update interment", async () => {
      const dto: UpdateIntermentDto = { patientId: 1 } as any;
      jest.spyOn(service, "findOne").mockResolvedValue({ id: 1 } as any);

      const result = await service.update(1, dto);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: "Interment updated successfully",
        updateIntermentDto: dto,
      });
    });

    it("should throw BadRequestException on error", async () => {
      jest.spyOn(service, "findOne").mockRejectedValue(new BadRequestException("Not found"));

      await expect(service.update(1, {} as UpdateIntermentDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateStatus", () => {
    it("should update interment status", async () => {
      const mockUpdateStatus = { id: 1, status: Status.COMPLETED };

      mockPrismaService.interment.update.mockResolvedValue(mockUpdateStatus);

      const result = await service.updateStatus(1, Status.COMPLETED);

      expect(mockPrismaService.interment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ status: Status.COMPLETED }),
          include: { Diagnosis: true },
        }),
      );

      expect(result).toEqual({
        message: "Interment status updated successfully",
        updatedStatusOfInterment: mockUpdateStatus,
      });
    });

    it("should throw NotFoundException when interment does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.interment.update.mockRejectedValue(prismaError);

      await expect(service.updateStatus(999, Status.PENDING)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on other errors", async () => {
      mockPrismaService.interment.update.mockRejectedValue(new Error("DB error"));

      await expect(service.updateStatus(1, Status.PENDING)).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateDiagnosisById", () => {
    it("should update diagnosis", async () => {
      const dto: PatchDiagnosisDto = { description: "updated" } as any;
      const mockUpdatedDiagnosis = { id: 1, description: "updated" };

      mockPrismaService.diagnosis.update.mockResolvedValue(mockUpdatedDiagnosis);

      const result = await service.updateDiagnosisById(1, dto);

      expect(mockPrismaService.diagnosis.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: dto,
        }),
      );

      expect(result).toEqual({
        message: "Diagnosis updated successfully",
        updatedDiagnosis: mockUpdatedDiagnosis,
      });
    });

    it("should throw NotFoundException when diagnosis does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.diagnosis.update.mockRejectedValue(prismaError);

      await expect(service.updateDiagnosisById(999, {} as PatchDiagnosisDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("getAllDiagnosis", () => {
    it("should return paginated diagnosis", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 } as any;
      const mockDiagnosis = [{ id: 1, description: "test" }];

      mockPrismaService.diagnosis.count.mockResolvedValue(1);
      mockPrismaService.diagnosis.findMany.mockResolvedValue(mockDiagnosis);

      const result = await service.getAllDiagnosis(paginationDto);

      expect(mockPrismaService.diagnosis.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
      expect(result).toEqual({
        totalPage: 1,
        page: 1,
        total: 1,
        data: mockDiagnosis,
      });
    });
  });

  describe("getDiagnosisById", () => {
    it("should return diagnosis if found", async () => {
      const mockDiagnosis = { id: 1, description: "test" };

      mockPrismaService.diagnosis.findUnique.mockResolvedValue(mockDiagnosis);

      const result = await service.getDiagnosisById(1);

      expect(mockPrismaService.diagnosis.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockDiagnosis);
    });

    it("should throw NotFoundException if diagnosis not found", async () => {
      mockPrismaService.diagnosis.findUnique.mockResolvedValue(null);

      await expect(service.getDiagnosisById(999)).rejects.toThrow(NotFoundException);
      await expect(service.getDiagnosisById(999)).rejects.toThrow("Diagnosis #999 not found");
    });
  });

  describe("addDiagnosisInInterment", () => {
    it("should add diagnosis to interment", async () => {
      const dto: CreateDiagnosisDto = { description: "new diagnosis" } as any;
      const mockCreated = { id: 1, Diagnosis: [dto] };

      mockPrismaService.interment.update.mockResolvedValue(mockCreated);

      const result = await service.addDiagnosisInInterment(1, dto);

      expect(mockPrismaService.interment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { Diagnosis: { create: dto } },
        }),
      );

      expect(result).toEqual({
        message: "Diagnosis created successfully",
        createdDiagnosis: mockCreated,
      });
    });

    it("should throw NotFoundException when interment does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.interment.update.mockRejectedValue(prismaError);

      await expect(service.addDiagnosisInInterment(999, {} as CreateDiagnosisDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should remove interment", async () => {
      mockPrismaService.interment.delete.mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(mockPrismaService.interment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual("Interment #1 deleted successfully");
    });

    it("should throw NotFoundException when interment does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.interment.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
