import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { Prisma } from "@prisma/client";
import { CreateAvailabilityDto, CreateDoctorDto, UpdateDoctorDto } from "./dto";
import { AuthService } from "src/auth/auth.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { GetPatientsOfDoctorByIDDto } from "./dto/get-patients-of-doctor-by-id.dto";
import { PrismaService } from "src/prisma/prisma.service";

const DOCTORS_SELECT_CACHE_KEY = "doctors:select";
const DOCTORS_DASHBOARD_CACHE_KEY = "doctors:dashboard:resources";

const DOCTOR_SELECT = {
  id: true,
  specialty: true,
  licenceNumber: true,
  authId: true,
  createdAt: true,
  updatedAt: true,
  auth: {
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      is_active: true,
    },
  },
} satisfies Prisma.DoctorSelect;

@Injectable()
export class DoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async invalidateHotCaches() {
    await Promise.all([
      this.cacheManager.del(DOCTORS_SELECT_CACHE_KEY),
      this.cacheManager.del(DOCTORS_DASHBOARD_CACHE_KEY),
    ]);
  }

  async create(createDoctorDto: CreateDoctorDto) {
    const findAuth = await this.authService.findOne(createDoctorDto.authId);

    if (!findAuth) {
      throw new NotFoundException("Auth not found");
    }

    try {
      const creationDoctor = await this.prisma.doctor.create({
        data: {
          ...createDoctorDto,
        },
      });

      await this.invalidateHotCaches();

      return creationDoctor;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("Licence number already exists");
        }
      }
      throw new BadRequestException(error.message);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, page } = paginationDto;

    const [total, allDoctors] = await Promise.all([
      this.prisma.doctor.count(),
      this.prisma.doctor.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: DOCTOR_SELECT,
      }),
    ]);

    return {
      totalPage: Math.ceil(total / limit),
      page: page,
      total: total,
      data: allDoctors,
    };
  }

  async findOne(id: number) {
    const findDoctorById = await this.prisma.doctor.findUnique({
      where: {
        id: id,
      },
      select: DOCTOR_SELECT,
    });

    if (!findDoctorById) {
      throw new NotFoundException("Doctor not found");
    }

    return findDoctorById;
  }

  async findAllSelect() {
    const cached = await this.cacheManager.get(DOCTORS_SELECT_CACHE_KEY);
    if (cached) return cached;

    try {
      const allDoctors = await this.prisma.doctor.findMany({
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

      await this.cacheManager.set(DOCTORS_SELECT_CACHE_KEY, allDoctors);

      return allDoctors;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findPatientsOfDoctorById(doctorId: number) {
    await this.findOne(doctorId);

    const findPatientsOfDoctor = await this.prisma.doctor.findFirst({
      where: {
        id: doctorId,
      },
      include: {
        medicalRecords: {
          include: {
            Patients: true,
          },
        },
      },
    });

    return findPatientsOfDoctor;
  }

  async update(id: number, updateDoctorDto: UpdateDoctorDto) {
    try {
      const updatedDoctor = await this.prisma.doctor.update({
        where: {
          id,
        },
        data: {
          ...updateDoctorDto,
        },
      });

      await this.invalidateHotCaches();

      return {
        message: "Doctor updated successfully",
        updatedDoctor,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Doctor not found");
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const deletedDoctor = await this.prisma.doctor.delete({
        where: {
          id,
        },
      });

      await this.invalidateHotCaches();

      return {
        message: "Doctor deleted successfully",
        deletedDoctor,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Doctor not found");
      }
      throw error;
    }
  }

  async getAvailability(doctorId: number) {
    await this.findOne(doctorId);

    return this.prisma.doctorAvailability.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  async addAvailability(doctorId: number, createAvailabilityDto: CreateAvailabilityDto) {
    await this.findOne(doctorId);

    if (createAvailabilityDto.startTime >= createAvailabilityDto.endTime) {
      throw new BadRequestException("startTime must be before endTime");
    }

    return this.prisma.doctorAvailability.create({
      data: {
        doctorId,
        ...createAvailabilityDto,
      },
    });
  }

  async removeAvailability(doctorId: number, availabilityId: number) {
    try {
      return await this.prisma.doctorAvailability.delete({
        where: { id: availabilityId, doctorId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Availability slot not found");
      }
      throw error;
    }
  }

  async totalResource() {
    const cached = await this.cacheManager.get(DOCTORS_DASHBOARD_CACHE_KEY);
    if (cached) return cached;

    const [totalDoctors, totalPatients, totalInterments, totalAppointments] = await Promise.all([
      this.prisma.doctor.count(),
      this.prisma.patients.count(),
      this.prisma.interment.count(),
      this.prisma.appointment.count(),
    ]);

    const result = {
      totalDoctors,
      totalPatients,
      totalInterments,
      totalAppointments,
    };

    // Short TTL: counts span patients/interments/appointments modules too,
    // so exact cross-module invalidation isn't worth the coupling for a stats dashboard.
    await this.cacheManager.set(DOCTORS_DASHBOARD_CACHE_KEY, result, 15000);

    return result;
  }
}
