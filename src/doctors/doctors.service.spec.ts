import { Test, TestingModule } from "@nestjs/testing";
import { DoctorsService } from "./doctors.service";
import { AuthService } from "src/auth/auth.service";
import { PrismaService } from "src/prisma/prisma.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { CreateDoctorDto, UpdateDoctorDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { Prisma } from "@prisma/client";
import { NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";

describe("DoctorsService", () => {
  let service: DoctorsService;
  let authService: AuthService;

  const mockAuthService = {
    findOne: jest.fn(),
  };

  const mockPrismaService = {
    doctor: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
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
    doctorAvailability: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
    authService = module.get<AuthService>(AuthService);
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
      mockPrismaService.doctor.create.mockResolvedValue(createdDoctor);

      const result = await service.create(dto);

      expect(authService.findOne).toHaveBeenCalledWith(dto.authId);
      expect(mockPrismaService.doctor.create).toHaveBeenCalledWith({ data: dto });
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

      mockPrismaService.doctor.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow("Licence number already exists");
    });

    it("should throw BadRequestException on other errors", async () => {
      const dto: CreateDoctorDto = { authId: 1 } as any;
      mockAuthService.findOne.mockResolvedValue({ id: 1 });
      mockPrismaService.doctor.create.mockRejectedValue(new Error("Other error"));

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated doctors with a single count call", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 } as any;
      const doctors = [{ id: 1, specialty: "Cardio" }];
      mockPrismaService.doctor.count.mockResolvedValue(15);
      mockPrismaService.doctor.findMany.mockResolvedValue(doctors);

      const result = await service.findAll(paginationDto);

      expect(mockPrismaService.doctor.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.doctor.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
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
      mockPrismaService.doctor.findUnique.mockResolvedValue(doctor);

      const result = await service.findOne(1);

      expect(mockPrismaService.doctor.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
      expect(result).toEqual(doctor);
    });

    it("should throw NotFoundException if doctor not found", async () => {
      mockPrismaService.doctor.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow("Doctor not found");
    });
  });

  describe("findAllSelect", () => {
    it("should return selected fields for all doctors", async () => {
      const doctors = [{ id: 1, specialty: "Cardio", auth: { id: 1, full_name: "Dr. A" } }];
      mockPrismaService.doctor.findMany.mockResolvedValue(doctors);

      const result = await service.findAllSelect();

      expect(mockPrismaService.doctor.findMany).toHaveBeenCalledWith({
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
      mockPrismaService.doctor.findMany.mockRejectedValue(new Error("DB error"));

      await expect(service.findAllSelect()).rejects.toThrow(BadRequestException);
    });
  });

  describe("findPatientsOfDoctorById", () => {
    it("should return patients of doctor", async () => {
      const doctor = { id: 1 };
      const doctorWithPatients = { id: 1, medicalRecords: [{ id: 1, Patients: { id: 1 } }] };

      jest.spyOn(service, "findOne").mockResolvedValue(doctor as any);
      mockPrismaService.doctor.findFirst.mockResolvedValue(doctorWithPatients);

      const result = await service.findPatientsOfDoctorById(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(mockPrismaService.doctor.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: { medicalRecords: { include: { Patients: true } } },
        }),
      );
      expect(result).toEqual(doctorWithPatients);
    });
  });

  describe("update", () => {
    it("should update doctor", async () => {
      const dto: UpdateDoctorDto = { specialty: "Neurology" } as any;
      const updatedDoctor = { id: 1, specialty: "Neurology" };

      mockPrismaService.doctor.update.mockResolvedValue(updatedDoctor);

      const result = await service.update(1, dto);

      expect(mockPrismaService.doctor.update).toHaveBeenCalledWith({ where: { id: 1 }, data: dto });
      expect(result).toEqual({
        message: "Doctor updated successfully",
        updatedDoctor,
      });
    });

    it("should throw NotFoundException when doctor does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.doctor.update.mockRejectedValue(prismaError);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should remove doctor", async () => {
      const deletedDoctor = { id: 1 };
      mockPrismaService.doctor.delete.mockResolvedValue(deletedDoctor);

      const result = await service.remove(1);

      expect(mockPrismaService.doctor.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        message: "Doctor deleted successfully",
        deletedDoctor,
      });
    });

    it("should throw NotFoundException when doctor does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.doctor.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("getAvailability", () => {
    it("should return the availability blocks for a doctor", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue({ id: 1 } as any);
      const availability = [{ id: 1, doctorId: 1, dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }];
      mockPrismaService.doctorAvailability.findMany.mockResolvedValue(availability);

      const result = await service.getAvailability(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(mockPrismaService.doctorAvailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { doctorId: 1 } }),
      );
      expect(result).toEqual(availability);
    });
  });

  describe("addAvailability", () => {
    it("should create an availability block", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue({ id: 1 } as any);
      const dto = { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" };
      const created = { id: 1, doctorId: 1, ...dto };
      mockPrismaService.doctorAvailability.create.mockResolvedValue(created);

      const result = await service.addAvailability(1, dto);

      expect(mockPrismaService.doctorAvailability.create).toHaveBeenCalledWith({
        data: { doctorId: 1, ...dto },
      });
      expect(result).toEqual(created);
    });

    it("should throw BadRequestException when startTime is not before endTime", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue({ id: 1 } as any);
      const dto = { dayOfWeek: 1, startTime: "17:00", endTime: "09:00" };

      await expect(service.addAvailability(1, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("removeAvailability", () => {
    it("should delete an availability block", async () => {
      mockPrismaService.doctorAvailability.delete.mockResolvedValue({ id: 5 });

      const result = await service.removeAvailability(1, 5);

      expect(mockPrismaService.doctorAvailability.delete).toHaveBeenCalledWith({
        where: { id: 5, doctorId: 1 },
      });
      expect(result).toEqual({ id: 5 });
    });

    it("should throw NotFoundException when availability does not exist (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.doctorAvailability.delete.mockRejectedValue(prismaError);

      await expect(service.removeAvailability(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("totalResource", () => {
    it("should return counts for all resources", async () => {
      mockPrismaService.doctor.count.mockResolvedValue(10);
      mockPrismaService.patients.count.mockResolvedValue(20);
      mockPrismaService.interment.count.mockResolvedValue(5);
      mockPrismaService.appointment.count.mockResolvedValue(15);

      const result = await service.totalResource();

      expect(result).toEqual({
        totalDoctors: 10,
        totalPatients: 20,
        totalInterments: 5,
        totalAppointments: 15,
      });
    });
  });
});
