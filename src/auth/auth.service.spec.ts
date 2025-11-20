import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { CreateAuthDto, UpdateAuthDto, LoginDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    auth: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.spyOn(service["logger"], "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return paginated users", async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 } as any;
      const mockUsers = [{ id: 1, full_name: "John" }];

      mockPrismaService.auth.count.mockResolvedValue(15);
      mockPrismaService.auth.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll(paginationDto);

      expect(prisma.auth.count).toHaveBeenCalled();
      expect(prisma.auth.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { full_name: "desc" },
          include: { Doctor: true },
        }),
      );
      expect(result).toEqual({
        totalPages: 2,
        page: 1,
        total: 15,
        data: mockUsers,
      });
    });
  });

  describe("login", () => {
    it("should login user and return token", async () => {
      const dto: LoginDto = { email: "test@example.com", password: "pass123" };
      const user = {
        id: 1,
        full_name: "John",
        email: "test@example.com",
        password: "hashedpass",
        role: "ADMIN",
        is_active: true,
      };

      mockPrismaService.auth.findUnique.mockResolvedValue(user);
      (jest.spyOn(bcrypt, "compare") as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue("jwtToken");

      const result = await service.login(dto);

      expect(prisma.auth.findUnique).toHaveBeenCalledWith({ where: { email: dto.email.toLowerCase() } });
      expect(result).toEqual({
        message: "Login successful",
        token: "jwtToken",
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      mockPrismaService.auth.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: "noone@example.com", password: "pass" })).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if password invalid", async () => {
      const user = { password: "hashedpass" };
      mockPrismaService.auth.findUnique.mockResolvedValue(user);
      (jest.spyOn(bcrypt, "compare") as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: "test@example.com", password: "wrong" })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("register", () => {
    it("should register user successfully", async () => {
      const dto: CreateAuthDto = { email: "test@example.com", password: "pass123", full_name: "John" } as any;
      mockPrismaService.auth.findUnique.mockResolvedValue(null);
      (jest.spyOn(bcrypt, "hash") as jest.Mock).mockResolvedValue("hashedpass");
      mockPrismaService.auth.create.mockResolvedValue({ id: 1, ...dto, password: "hashedpass" });

      const result = await service.register(dto);

      expect(prisma.auth.findUnique).toHaveBeenCalledWith({ where: { email: dto.email.toLowerCase() } });
      expect(prisma.auth.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: dto.email.toLowerCase(),
            password: "hashedpass",
          }),
        }),
      );
      expect(result).toEqual(expect.objectContaining({ id: 1 }));
    });

    it("should throw BadRequestException if user exists", async () => {
      const dto: CreateAuthDto = { email: "test@example.com", password: "pass123" } as any;
      mockPrismaService.auth.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException on other errors", async () => {
      const dto: CreateAuthDto = { email: "test@example.com", password: "pass123" } as any;
      mockPrismaService.auth.findUnique.mockResolvedValue(null);
      (jest.spyOn(bcrypt, "hash") as jest.Mock).mockRejectedValue(new Error("Hash error"));

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("findOne", () => {
    it("should find user by id", async () => {
      const user = { id: 1, full_name: "John" };
      mockPrismaService.auth.findFirst.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(prisma.auth.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: { Doctor: true },
        }),
      );
      expect(result).toEqual(user);
    });

    it("should throw NotFoundException if user not found", async () => {
      mockPrismaService.auth.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(BadRequestException);
      await expect(service.findOne(999)).rejects.toThrow("User not found");
    });

    it("should throw BadRequestException on error", async () => {
      mockPrismaService.auth.findFirst.mockRejectedValue(new BadRequestException("DB error"));

      await expect(service.findOne(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe("update", () => {
    it("should update and return message", async () => {
      const dto: UpdateAuthDto = { full_name: "Updated" } as any;
      jest.spyOn(service, "findOne").mockResolvedValue({ id: 1 } as any);
      mockPrismaService.auth.update.mockResolvedValue({ id: 1, ...dto });

      const result = await service.update(1, dto);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(prisma.auth.update).toHaveBeenCalledWith({ where: { id: 1 }, data: dto });
      expect(result).toEqual({
        message: "User updated successfully",
        updateUser: { id: 1, ...dto },
      });
    });
  });

  describe("remove", () => {
    it("should delete and return message", async () => {
      jest.spyOn(service, "findOne").mockResolvedValue({ id: 1 } as any);
      mockPrismaService.auth.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(prisma.auth.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        message: "User deleted successfully",
        userDeleted: { id: 1 },
      });
    });
  });
});
