import { Test, TestingModule } from "@nestjs/testing";
import { DoctorsService } from "./doctors.service";
import { AuthService } from "src/auth/auth.service";
import { CreateDoctorDto, UpdateDoctorDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";

describe("DoctorsService", () => {
  let service: DoctorsService;
  let authService: AuthService;

  const mockAuthService = {
    findOne: jest.fn(),
  };

  const mockPrismaClient = {
    doctor: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    patients: {
      count: jest.fn(),
    },
    interment: {
      count: jest.fn(),
    },
    appointment: {
      count: jest.fn(),
    },
    $connect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DoctorsService, { provide: AuthService, useValue: mockAuthService }],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
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
    it("should create doctor when auth exists", async () => {
      const dto: CreateDoctorDto = { authId: 1, specialty: "Cardiology" } as any;
      const createdDoctor = { id: 1, ...dto };

      mockAuthService.findOne.mockResolvedValue({ id: 1 });
      mockPrismaClient.doctor.create.mockResolvedValue(createdDoctor);

      const result = await service.create(dto);

      expect(authService.findOne).toHaveBeenCalledWith(dto.authId);
      expect(service.doctor.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(createdDoctor);
    });

    it("should throw NotFoundException if auth not found", async () => {
      const dto: CreateDoctorDto = { authId: 999 } as any;
      mockAuthService.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow("Auth not found");
    });

    it("should throw ConflictException on duplicate licence (P2002)", async () => {
      const dto: CreateDoctorDto = { authId: 1 } as any;
      mockAuthService.findOne.mockResolvedValue({ id: 1 });

      const prismaError = new Prisma.PrismaClientKnownRequestError("Duplicate", {
        code: "P2002",
        clientVersion: "5.0.0",
      });

      mockPrismaClient.doctor.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow("Licence number already exists");
    });

    it("should throw BadRequestException on other errors", async () => {
      const dto: CreateDoctorDto = { authId: 1 } as any;
      mockAuthService.findOne.mockResolvedValue({ id: 1 });
      mockPrismaClient.doctor.create.mockRejectedValue(new Error("Other error"));

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated doctors", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 } as any;
      const doctors = [{ id: 1, specialty: "Cardio" }];
      mockPrismaClient.doctor.count.mockResolvedValue(15);
      mockPrismaClient.doctor.findMany.mockResolvedValue(doctors);

      const result = await service.findAll(paginationDto);

      expect(service.doctor.count).toHaveBeenCalled();
      expect(service.doctor.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        totalPage: 2,
        page: 1,
        total: 15,
        data: doctors,
      });
    });
  });

  describe("findOne", () => {
    it("should return doctor with auth", async () => {
      const doctor = { id: 1, auth: { id: 1, full_name: "Dr. A" } };
      mockPrismaClient.doctor.findFirst.mockResolvedValue(doctor);

      const result = await service.findOne(1);

      expect(service.doctor.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: { auth: true },
        }),
      );
      expect(result).toEqual(doctor);
    });

    it("should throw InternalServerErrorException if doctor not found", async () => {
      mockPrismaClient.doctor.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(InternalServerErrorException);
      await expect(service.findOne(999)).rejects.toThrow("Doctor not found");
    });

    it("should throw InternalServerErrorException on error", async () => {
      mockPrismaClient.doctor.findFirst.mockRejectedValue(new Error("DB error"));

      await expect(service.findOne(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findAllSelect", () => {
    it("should return selected fields for all doctors", async () => {
      const doctors = [{ id: 1, specialty: "Cardio", auth: { id: 1, full_name: "Dr. A" } }];
      mockPrismaClient.doctor.findMany.mockResolvedValue(doctors);

      const result = await service.findAllSelect();

      expect(service.doctor.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          specialty: true,
          auth: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
      });
      expect(result).toEqual(doctors);
    });

    it("should throw BadRequestException on error", async () => {
      mockPrismaClient.doctor.findMany.mockRejectedValue(new Error("DB error"));

      await expect(service.findAllSelect()).rejects.toThrow(BadRequestException);
    });
  });

  describe("findPatientsOfDoctorById", () => {
    it("should return patients of doctor", async () => {
      const doctor = { id: 1 };
      const doctorWithPatients = { id: 1, medicalRecords: [{ id: 1, Patients: { id: 1 } }] };

      jest.spyOn(service, "findOne").mockResolvedValue(doctor as any);
      mockPrismaClient.doctor.findFirst.mockResolvedValue(doctorWithPatients);

      const result = await service.findPatientsOfDoctorById(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.doctor.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: { medicalRecords: { include: { Patients: true } } },
        }),
      );
      expect(result).toEqual(doctorWithPatients);
    });

    it("should throw InternalServerErrorException on error", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue({
        id: 1,
        specialty: "Cardiology",
        licenceNumber: 12345,
        authId: 1,
        auth: {
          id: 1,
          full_name: "Dr. Test",
          email: "test@example.com",
          password: "hashedpassword",
          role: "DOCTOR",
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaClient.doctor.findFirst.mockRejectedValue(new Error("DB error"));

      await expect(service.findPatientsOfDoctorById(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("update", () => {
    it("should update doctor", async () => {
      const dto: UpdateDoctorDto = { specialty: "Neurology" } as any;
      jest.spyOn(service, "findOne").mockResolvedValue({
        id: 1,
        specialty: "Cardiology",
        licenceNumber: 12345,
        authId: 1,
        auth: {
          id: 1,
          full_name: "Dr. Test",
          email: "test@example.com",
          password: "hashedpassword",
          role: "DOCTOR",
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const updatedDoctor = { id: 1, specialty: "Neurology" };

      mockPrismaClient.doctor.update.mockResolvedValue(updatedDoctor);

      const result = await service.update(1, dto);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.doctor.update).toHaveBeenCalledWith({ where: { id: 1 }, data: dto });
      expect(result).toEqual({
        message: "Doctor updated successfully",
        updatedDoctor,
      });
    });
  });

  describe("remove", () => {
    it("should remove doctor", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue({
        id: 1,
        specialty: "Cardiology",
        licenceNumber: 12345,
        authId: 1,
        auth: {
          id: 1,
          full_name: "Dr. Test",
          email: "test@example.com",
          password: "hashedpassword",
          role: "DOCTOR",
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const deletedDoctor = { id: 1 };

      mockPrismaClient.doctor.delete.mockResolvedValue(deletedDoctor);

      const result = await service.remove(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.doctor.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        message: "Doctor deleted successfully",
        deletedDoctor,
      });
    });
  });

  describe("totalResource", () => {
    it("should return counts for all resources", async () => {
      mockPrismaClient.doctor.count.mockResolvedValue(10);
      mockPrismaClient.patients.count.mockResolvedValue(20);
      mockPrismaClient.interment.count.mockResolvedValue(5);
      mockPrismaClient.appointment.count.mockResolvedValue(15);

      const result = await service.totalResource();

      expect(service.doctor.count).toHaveBeenCalled();
      expect(service.patients.count).toHaveBeenCalled();
      expect(service.interment.count).toHaveBeenCalled();
      expect(service.appointment.count).toHaveBeenCalled();

      expect(result).toEqual({
        totalDoctors: 10,
        totalPatients: 20,
        totalInterments: 5,
        totalAppointments: 15,
      });
    });
  });
});
