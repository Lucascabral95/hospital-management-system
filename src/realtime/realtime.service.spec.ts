import { Test, TestingModule } from "@nestjs/testing";
import { RealtimeService } from "./realtime.service";
import { NotFoundException } from "@nestjs/common";
import { CreateAppointmentSocketDto } from "./dto";

describe("RealtimeService", () => {
  let service: RealtimeService;

  // Mock de Prisma
  const mockPrismaClient = {
    appointment: {
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
      providers: [RealtimeService],
    }).compile();

    service = module.get<RealtimeService>(RealtimeService);

    // Asignar mock a la instancia del servicio
    Object.assign(service, mockPrismaClient);
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
      mockPrismaClient.appointment.create.mockResolvedValue(createdAppointment);

      const result = await service.create(dto);

      expect(service.appointment.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result).toEqual(createdAppointment);
    });
  });

  describe("findAll", () => {
    it("should return all appointments ordered by updatedAt desc", async () => {
      const appointments = [{ id: 1, updatedAt: new Date() }];
      mockPrismaClient.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.findAll();

      expect(service.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: "desc" },
          include: { patient: expect.any(Object) },
        }),
      );
      expect(result).toEqual(appointments);
    });

    it("should throw NotFoundException on error", async () => {
      mockPrismaClient.appointment.findMany.mockRejectedValue(new Error("DB Error"));

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe("findOne (private but tested via public methods)", () => {
    // Testeamos findOne indirectamente a través de updateStatusInProgress
    it("should throw NotFoundException if appointment not found", async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);

      await expect(service.updateStatusInProgress(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateStatusInProgress", () => {
    it("should update status to IN_PROGRESS", async () => {
      const appointment = { id: 1, status: "PENDING" };
      const updated = { id: 1, status: "IN_PROGRESS" };

      mockPrismaClient.appointment.findUnique.mockResolvedValue(appointment);
      mockPrismaClient.appointment.update.mockResolvedValue(updated);

      const result = await service.updateStatusInProgress(1);

      expect(service.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "IN_PROGRESS" },
      });
      expect(result).toEqual(updated);
    });
  });

  describe("updateStatusCompleted", () => {
    it("should update status to COMPLETED", async () => {
      const appointment = { id: 1, status: "IN_PROGRESS" };
      const updated = { id: 1, status: "COMPLETED" };

      mockPrismaClient.appointment.findUnique.mockResolvedValue(appointment);
      mockPrismaClient.appointment.update.mockResolvedValue(updated);

      const result = await service.updateStatusCompleted(1);

      expect(service.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "COMPLETED" },
      });
      expect(result).toEqual(updated);
    });
  });

  describe("remove", () => {
    it("should delete appointment if found", async () => {
      const appointment = { id: 1 };
      mockPrismaClient.appointment.findUnique.mockResolvedValue(appointment);
      mockPrismaClient.appointment.delete.mockResolvedValue(appointment);

      const result = await service.remove(1);

      expect(service.appointment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({
        message: "Realtime deleted successfully",
        deletedRealtime: appointment,
      });
    });
  });
});
