import { Test, TestingModule } from "@nestjs/testing";
import { AppointmentsService } from "./appointments.service";
import { PatientsService } from "src/patients/patients.service";
import { NotFoundException, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { CreateAppointmentDto, FilterAppointmentsDto, UpdateAppointmentDto } from "./dto";

describe("AppointmentsService", () => {
  let service: AppointmentsService;
  let patientService: PatientsService;

  const mockPatientsService = {
    findOne: jest.fn(),
  };

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
      providers: [AppointmentsService, { provide: PatientsService, useValue: mockPatientsService }],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    patientService = module.get<PatientsService>(PatientsService);

    Object.assign(service, mockPrismaClient);
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
      mockPrismaClient.appointment.create.mockResolvedValue(createdAppointment);

      const result = await service.create(dto);

      expect(patientService.findOne).toHaveBeenCalledWith(dto.patientsId);
      expect(service.appointment.create).toHaveBeenCalledWith({ data: dto });
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
      mockPrismaClient.appointment.create.mockRejectedValue(new Error("DB error"));

      await expect(service.create(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findAll", () => {
    it("should return filtered appointments", async () => {
      const filterDto: FilterAppointmentsDto = { status: "SCHEDULED" } as any;
      const appointments = [{ id: 1 }];

      mockPrismaClient.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.findAll(filterDto);

      expect(service.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "SCHEDULED" },
          orderBy: { updatedAt: "asc" },
          include: expect.any(Object),
        }),
      );
      expect(result).toEqual(appointments);
    });

    it('should return all appointments when status is "ALL"', async () => {
      const filterDto: FilterAppointmentsDto = { status: "ALL" } as any;
      const appointments = [{ id: 1 }];

      mockPrismaClient.appointment.findMany.mockResolvedValue(appointments);

      const result = await service.findAll(filterDto);

      expect(service.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: undefined },
        }),
      );
      expect(result).toEqual(appointments);
    });

    it("should throw InternalServerErrorException on error", async () => {
      mockPrismaClient.appointment.findMany.mockRejectedValue(new Error("DB error"));

      await expect(service.findAll({} as any)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findOne", () => {
    it("should return appointment if found", async () => {
      const appointment = { id: 1, patient: { name: "John" } };

      mockPrismaClient.appointment.findUnique.mockResolvedValue(appointment);

      const result = await service.findOne(1);

      expect(service.appointment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: expect.any(Object),
        }),
      );
      expect(result).toEqual(appointment);
    });

    it("should throw BadRequestException if appointment not found", async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(BadRequestException);
      await expect(service.findOne(999)).rejects.toThrow("Appointment not found");
    });
  });

  describe("update", () => {
    it("should update appointment", async () => {
      const dto: UpdateAppointmentDto = { status: "CONFIRMED" } as any;
      jest.spyOn(service, "findOne").mockResolvedValue({
        id: 1,
        patient: {
          id: 1,
          createdAt: new Date(),
          dni: "12345678",
          name: "Test",
          last_name: "User",
          date_born: "2000-01-01",
          gender: "MALE",
          phone: "123456789",
          email: "test@example.com",
          country: null,
        },
        patientsId: 1,
        doctorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockPrismaClient.appointment.update.mockResolvedValue({ id: 1, ...dto });

      const result = await service.update(1, dto);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.appointment.update).toHaveBeenCalledWith({ where: { id: 1 }, data: dto });
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe("remove", () => {
    it("should delete appointment", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue({
        id: 1,
        patient: {
          id: 1,
          createdAt: new Date(),
          dni: "12345678",
          name: "Test",
          last_name: "User",
          date_born: "2000-01-01",
          gender: "MALE",
          phone: "123456789",
          email: "test@example.com",
          country: null,
        },
        patientsId: 1,
        doctorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockPrismaClient.appointment.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.appointment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });
  });
});
