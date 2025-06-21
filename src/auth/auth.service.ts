import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CreateAuthDto, UpdateAuthDto, LoginDto, PayloadJwtDto } from "./dto";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { RoleAccess } from "@prisma/client";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger("AuthService");

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.log("Connected to database");
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, page = 1, sortedBy = "full_name", order = "desc" } = paginationDto;

    const total = await this.prisma.auth.count();
    const totalPages = Math.ceil(total / limit);
    const params = ["full_name"];
    const orderParams = ["asc", "desc"];

    const sortedParameter = params.includes(sortedBy) ? sortedBy : "full_name";
    const sortedOrder = orderParams.includes(order) ? order : "desc";

    const allUsers = await this.prisma.auth.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortedParameter]: sortedOrder },
      include: {
        Doctor: true,
      },
    });

    return {
      totalPages,
      page,
      total,
      data: allUsers,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.auth.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException("Invalid credentials");
    }

    const payload = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role as RoleAccess,
      is_active: user.is_active,
    };

    return {
      message: "Login successful",
      token: this.getJwtToken(payload),
    };
  }

  getJwtToken(payload: PayloadJwtDto): string {
    const token = this.jwtService.sign(payload);
    return token;
  }

  async register(createAuthDto: CreateAuthDto) {
    const { password, email, ...rest } = createAuthDto;
    const emailLowerCase = email.toLowerCase();

    try {
      const existingUser = await this.prisma.auth.findUnique({
        where: {
          email: emailLowerCase,
        },
      });

      if (existingUser) {
        throw new Error("User already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const createdUser = await this.prisma.auth.create({
        data: {
          password: hashedPassword,
          email: emailLowerCase,
          ...rest,
        },
      });

      return createdUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findOne(id: number) {
    const userById = await this.prisma.auth.findFirst({
      where: { id },
      include: {
        Doctor: true,
      },
    });

    try {
      if (!userById) {
        throw new NotFoundException("User not found");
      }

      return userById;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, updateAuthDto: UpdateAuthDto) {
    await this.findOne(id);

    const updateUser = await this.prisma.auth.update({
      where: { id },
      data: updateAuthDto,
    });

    return {
      message: "User updated successfully",
      updateUser,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    const userDeleted = await this.prisma.auth.delete({
      where: { id },
    });

    return {
      message: "User deleted successfully",
      userDeleted,
    };
  }
}
