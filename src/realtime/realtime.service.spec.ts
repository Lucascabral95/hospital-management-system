import { Test, TestingModule } from "@nestjs/testing";
import { RealtimeService } from "./realtime.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateAppointmentSocketDto } from "./dto";

describe("RealtimeService", () => {
  let service: RealtimeService;

  const mockPrismaService = {
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealtimeService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<RealtimeService>(RealtimeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create an appointment", async () => {
      const dto: CreateAppointmentSocketDto = { patientsId: 1, doctorId: 2 } as any;
      const createdAppointment = { id: 1, ...dto };
      mockPrismaService.appointment.create.mockResolvedValue(createdAppointment);

      const result = await service.create(dto);

      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result).toEqual(createdAppointment);
    });
  });

  describe("findAll", () => {
    it("should return the live board window of appointments ordered by updatedAt desc", async () => {
      const appointments = [{ id: 1, updatedAt: new Date() }];
      mockPrismaService.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.findAll();

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: "desc" },
          include: { patient: expect.any(Object) },
          where: expect.objectContaining({ OR: expect.any(Array) }),
          take: expect.any(Number),
        }),
      );
      expect(result).toEqual(appointments);
    });

    it("should throw NotFoundException on error", async () => {
      mockPrismaService.appointment.findMany.mockRejectedValue(new Error("DB Error"));

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateStatusInProgress", () => {
    it("should update status to IN_PROGRESS", async () => {
      const updated = { id: 1, status: "IN_PROGRESS" };

      mockPrismaService.appointment.update.mockResolvedValue(updated);

      const result = await service.updateStatusInProgress(1);

      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "IN_PROGRESS" },
      });
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException if appointment not found (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.appointment.update.mockRejectedValue(prismaError);

      await expect(service.updateStatusInProgress(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateStatusCompleted", () => {
    it("should update status to COMPLETED", async () => {
      const updated = { id: 1, status: "COMPLETED" };

      mockPrismaService.appointment.update.mockResolvedValue(updated);

      const result = await service.updateStatusCompleted(1);

      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "COMPLETED" },
      });
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException if appointment not found (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.appointment.update.mockRejectedValue(prismaError);

      await expect(service.updateStatusCompleted(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete appointment if found", async () => {
      const appointment = { id: 1 };
      mockPrismaService.appointment.delete.mockResolvedValue(appointment);

      const result = await service.remove(1);

      expect(mockPrismaService.appointment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({
        message: "Realtime deleted successfully",
        deletedRealtime: appointment,
      });
    });

    it("should throw NotFoundException if appointment not found (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.appointment.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
