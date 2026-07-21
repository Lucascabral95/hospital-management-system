import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CreateAuthDto, UpdateAuthDto, LoginDto } from "./dto";
import { AuthDto, AuthWithDoctorDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { REFRESH_COOKIE_NAME } from "./utils/refresh-cookie";

describe("AuthController", () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const buildReq = (overrides: Record<string, unknown> = {}) =>
    ({
      ip: "127.0.0.1",
      headers: { "user-agent": "jest" },
      cookies: {},
      ...overrides,
    }) as any;

  const buildRes = () => ({ cookie: jest.fn(), clearCookie: jest.fn() }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register", () => {
    it("should call service.register with DTO", async () => {
      const dto: CreateAuthDto = { username: "user", password: "pass" } as any;
      const expectedResult: AuthDto = { token: "token" } as any;
      const mockUser = "admin-id";

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(mockUser, dto);

      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("login", () => {
    it("should set the refresh cookie and return message/token/user, without the refresh token in the body", async () => {
      const dto: LoginDto = { email: "user@example.com", password: "pass" };
      const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60);
      mockAuthService.login.mockResolvedValue({
        message: "Login successful",
        token: "jwtToken",
        refreshToken: "refreshTok",
        refreshExpiresAt,
        user: { id: 1, full_name: "John", email: dto.email, role: "ADMIN", is_active: true },
      });

      const req = buildReq();
      const res = buildRes();

      const result = await controller.login(dto, req, res);

      expect(service.login).toHaveBeenCalledWith(dto, { ip: req.ip, userAgent: req.headers["user-agent"] });
      expect(res.cookie).toHaveBeenCalledWith(REFRESH_COOKIE_NAME, "refreshTok", expect.any(Object));
      expect(result).toEqual({
        message: "Login successful",
        token: "jwtToken",
        user: { id: 1, full_name: "John", email: dto.email, role: "ADMIN", is_active: true },
      });
      expect((result as any).refreshToken).toBeUndefined();
    });
  });

  describe("refresh", () => {
    it("should rotate using the cookie and set the new one", async () => {
      const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60);
      mockAuthService.refresh.mockResolvedValue({
        token: "newAccess",
        refreshToken: "newRefresh",
        refreshExpiresAt,
      });

      const req = buildReq({ cookies: { [REFRESH_COOKIE_NAME]: "oldRefresh" } });
      const res = buildRes();

      const result = await controller.refresh(req, res);

      expect(service.refresh).toHaveBeenCalledWith("oldRefresh", { ip: req.ip, userAgent: req.headers["user-agent"] });
      expect(res.cookie).toHaveBeenCalledWith(REFRESH_COOKIE_NAME, "newRefresh", expect.any(Object));
      expect(result).toEqual({ token: "newAccess" });
    });

    it("should clear the cookie and throw Unauthorized when there is no refresh cookie", async () => {
      const req = buildReq({ cookies: {} });
      const res = buildRes();

      await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException);
      expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_COOKIE_NAME, expect.any(Object));
      expect(service.refresh).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should revoke the refresh token and clear the cookie", async () => {
      const req = buildReq({ cookies: { [REFRESH_COOKIE_NAME]: "oldRefresh" } });
      const res = buildRes();

      const result = await controller.logout(req, res);

      expect(service.logout).toHaveBeenCalledWith("oldRefresh");
      expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_COOKIE_NAME, expect.any(Object));
      expect(result).toEqual({ message: "Logout successful" });
    });
  });

  describe("me", () => {
    it("should call service.me with the authenticated user id", async () => {
      const expectedResult = { id: 1, full_name: "John" };
      mockAuthService.me.mockResolvedValue(expectedResult);

      const result = await controller.me({ user: { id: 1 } });

      expect(service.me).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAll", () => {
    it("should call service.findAll with pagination DTO", async () => {
      const mockUser = "user-id";
      const paginationDto: PaginationDto = { page: 1, limit: 10 } as any;
      const expectedResult: AuthWithDoctorDto[] = [{ id: 1 }] as any;

      mockAuthService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockUser, paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findOne", () => {
    it("should call service.findOne with id", async () => {
      const mockUser = "user-id";
      const idParam = "5";
      const expectedResult: AuthWithDoctorDto = { id: 5 } as any;

      mockAuthService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockUser, idParam);

      expect(service.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call service.update with id and DTO", async () => {
      const mockUser = "user-id";
      const idParam = "3";
      const dto: UpdateAuthDto = { password: "newpass" } as any;
      const expectedResult: AuthDto = { token: "token" } as any;

      mockAuthService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(mockUser, idParam, dto);

      expect(service.update).toHaveBeenCalledWith(3, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("remove", () => {
    it("should call service.remove with id", async () => {
      const mockUser = "user-id";
      const idParam = "7";
      const expectedResult = "User deleted successfully";

      mockAuthService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(mockUser, idParam);

      expect(service.remove).toHaveBeenCalledWith(7);
      expect(result).toEqual(expectedResult);
    });
  });
});
