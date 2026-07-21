import { Test, TestingModule } from "@nestjs/testing";
import { AppointmentsService } from "./appointments.service";
import { PatientsService } from "src/patients/patients.service";
import { PrismaService } from "src/prisma/prisma.service";
import { BadRequestException, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateAppointmentDto, FilterAppointmentsDto, UpdateAppointmentDto } from "./dto";

describe("AppointmentsService", () => {
  let service: AppointmentsService;
  let patientService: PatientsService;

  const mockPatientsService = {
    findOne: jest.fn(),
  };

  const mockTx = {
    appointment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPrismaService = {
    appointment: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    doctor: {
      findMany: jest.fn(),
    },
    doctorAvailability: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PatientsService, useValue: mockPatientsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    patientService = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create appointment if patient exists", async () => {
      const dto: CreateAppointmentDto = { patientsId: 1 /* other fields */ } as any;
      const createdAppointment = { id: 1, ...dto };

      mockPatientsService.findOne.mockResolvedValue({ id: 1 });
      mockPrismaService.appointment.create.mockResolvedValue(createdAppointment);

      const result = await service.create(dto);

      expect(patientService.findOne).toHaveBeenCalledWith(dto.patientsId);
      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(createdAppointment);
    });

    it("should throw NotFoundException if patient not found", async () => {
      const dto: CreateAppointmentDto = { patientsId: 999 } as any;

      mockPatientsService.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow("Patient not found");
    });

    it("should throw InternalServerErrorException on create error", async () => {
      const dto: CreateAppointmentDto = { patientsId: 1 } as any;
      mockPatientsService.findOne.mockResolvedValue({ id: 1 });
      mockPrismaService.appointment.create.mockRejectedValue(new Error("DB error"));

      await expect(service.create(dto)).rejects.toThrow(InternalServerErrorException);
    });

    it("should create via transaction when doctorId and scheduledAt are provided", async () => {
      const dto: CreateAppointmentDto = {
        patientsId: 1,
        doctorId: 2,
        scheduledAt: "2026-08-01T10:00:00.000Z",
      } as any;
      const created = { id: 1, ...dto };

      mockPatientsService.findOne.mockResolvedValue({ id: 1 });
      mockTx.appointment.findFirst.mockResolvedValue(null);
      mockTx.appointment.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTx.appointment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ doctorId: 2 }),
        }),
      );
      expect(result).toEqual(created);
    });

    it("should throw BadRequestException when the slot is already taken", async () => {
      const dto: CreateAppointmentDto = {
        patientsId: 1,
        doctorId: 2,
        scheduledAt: "2026-08-01T10:00:00.000Z",
      } as any;

      mockPatientsService.findOne.mockResolvedValue({ id: 1 });
      mockTx.appointment.findFirst.mockResolvedValue({ id: 99 });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("getDoctorsBySpecialty", () => {
    it("should return doctors filtered by specialty", async () => {
      const doctors = [{ id: 1, specialty: "Cardiology", auth: { id: 1, full_name: "Dr. A" } }];
      mockPrismaService.doctor.findMany.mockResolvedValue(doctors);

      const result = await service.getDoctorsBySpecialty("Cardiology" as any);

      expect(mockPrismaService.doctor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { specialty: "Cardiology" } }),
      );
      expect(result).toEqual(doctors);
    });

    it("should return all doctors when no specialty is given", async () => {
      mockPrismaService.doctor.findMany.mockResolvedValue([]);

      await service.getDoctorsBySpecialty(undefined);

      expect(mockPrismaService.doctor.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
    });
  });

  describe("getAvailableSlots", () => {
    it("should return an empty array when the doctor has no availability that day", async () => {
      mockPrismaService.doctorAvailability.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots({ doctorId: 1, date: "2099-01-05" });

      expect(result).toEqual([]);
    });

    it("should generate free 30-minute slots excluding already booked ones", async () => {
      mockPrismaService.doctorAvailability.findMany.mockResolvedValue([
        { doctorId: 1, dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
      ]);
      mockPrismaService.appointment.findMany.mockResolvedValue([
        { scheduledAt: new Date("2099-01-05T09:00:00"), durationMinutes: 30 },
      ]);

      const result = await service.getAvailableSlots({ doctorId: 1, date: "2099-01-05" });

      expect(result.length).toBe(1);
      expect(new Date(result[0]).getHours()).toBe(9);
      expect(new Date(result[0]).getMinutes()).toBe(30);
    });
  });

  describe("cancel", () => {
    it("should set status to CANCELLED", async () => {
      const cancelled = { id: 1, status: "CANCELLED" };
      mockPrismaService.appointment.update.mockResolvedValue(cancelled);

      const result = await service.cancel(1);

      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "CANCELLED" },
      });
      expect(result).toEqual(cancelled);
    });

    it("should throw NotFoundException when appointment does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.appointment.update.mockRejectedValue(prismaError);

      await expect(service.cancel(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("reschedule", () => {
    it("should update scheduledAt and reset status to SCHEDULED when the new slot is free", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue({ id: 1, doctorId: 2 } as any);
      mockTx.appointment.findFirst.mockResolvedValue(null);
      const updated = { id: 1, status: "SCHEDULED" };
      mockTx.appointment.update.mockResolvedValue(updated);

      const result = await service.reschedule(1, "2026-08-02T11:00:00.000Z");

      expect(result).toEqual(updated);
    });

    it("should throw BadRequestException when the new slot is taken", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue({ id: 1, doctorId: 2 } as any);
      mockTx.appointment.findFirst.mockResolvedValue({ id: 55 });

      await expect(service.reschedule(1, "2026-08-02T11:00:00.000Z")).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return filtered and paginated appointments", async () => {
      const filterDto: FilterAppointmentsDto = { status: "PENDING", page: 1, limit: 10 } as any;
      const appointments = [{ id: 1 }];

      mockPrismaService.appointment.count.mockResolvedValue(1);
      mockPrismaService.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.findAll(filterDto);

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "PENDING" },
          skip: 0,
          take: 10,
          orderBy: { updatedAt: "asc" },
          include: expect.any(Object),
        }),
      );
      expect(result).toEqual({
        totalPages: 1,
        page: 1,
        total: 1,
        data: appointments,
      });
    });

    it('should return all appointments when status is "ALL"', async () => {
      const filterDto: FilterAppointmentsDto = { status: "ALL", page: 1, limit: 10 } as any;
      const appointments = [{ id: 1 }];

      mockPrismaService.appointment.count.mockResolvedValue(1);
      mockPrismaService.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.findAll(filterDto);

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: undefined },
        }),
      );
      expect(result.data).toEqual(appointments);
    });

    it("should throw InternalServerErrorException on error", async () => {
      mockPrismaService.appointment.count.mockRejectedValue(new Error("DB error"));

      await expect(service.findAll({ page: 1, limit: 10 } as any)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findOne", () => {
    it("should return appointment if found", async () => {
      const appointment = { id: 1, patient: { name: "John" } };

      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);

      const result = await service.findOne(1);

      expect(mockPrismaService.appointment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: expect.any(Object),
        }),
      );
      expect(result).toEqual(appointment);
    });

    it("should throw NotFoundException if appointment not found", async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow("Appointment not found");
    });
  });

  describe("update", () => {
    it("should update appointment", async () => {
      const dto: UpdateAppointmentDto = { status: "CONFIRMED" } as any;

      mockPrismaService.appointment.update.mockResolvedValue({ id: 1, ...dto });

      const result = await service.update(1, dto);

      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({ where: { id: 1 }, data: dto });
      expect(result).toEqual({ id: 1, ...dto });
    });

    it("should throw NotFoundException when appointment does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.appointment.update.mockRejectedValue(prismaError);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete appointment", async () => {
      mockPrismaService.appointment.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(mockPrismaService.appointment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });

    it("should throw NotFoundException when appointment does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.appointment.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
