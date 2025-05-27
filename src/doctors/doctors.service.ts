import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { CreateDoctorDto, UpdateDoctorDto } from "./dto";
import { AuthService } from "src/auth/auth.service";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Injectable()
export class DoctorsService extends PrismaClient implements OnModuleInit {
  constructor(private readonly authService: AuthService) {
    super();
  }

  onModuleInit() {
    this.$connect();
  }

  async create(createDoctorDto: CreateDoctorDto) {
    const findAuth = await this.authService.findOne(createDoctorDto.authId);

    if (!findAuth) {
      throw new NotFoundException("Auth not found");
    }

    try {
      const creationDoctor = await this.doctor.create({
        data: {
          ...createDoctorDto,
        },
      });

      return creationDoctor;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("Licence number already exists");
        }
      } else {
        throw new BadRequestException(error.message);
      }
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, page } = paginationDto;
    const totalPages = Math.ceil((await this.doctor.count()) / limit);
    const total = await this.doctor.count();

    const allDoctors = await this.doctor.findMany();
    return {
      totalPage: totalPages,
      page: page,
      total: total,
      data: allDoctors,
    };
  }

  async findOne(id: number) {
    try {
      const findDoctorById = await this.doctor.findFirst({
        where: {
          id,
        },
      });

      if (!findDoctorById) {
        throw new NotFoundException("Doctor not found");
      }

      return findDoctorById;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updateDoctorDto: UpdateDoctorDto) {
    await this.findOne(id);

    const updatedDoctor = await this.doctor.update({
      where: {
        id,
      },
      data: {
        ...updateDoctorDto,
      },
    });

    return {
      message: "Doctor updated successfully",
      updatedDoctor,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    const deletedDoctor = await this.doctor.delete({
      where: {
        id,
      },
    });

    return {
      message: "Doctor deleted successfully",
      deletedDoctor,
    };
  }
}
