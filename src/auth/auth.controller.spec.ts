import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CreateAuthDto, UpdateAuthDto, LoginDto } from "./dto";
import { AuthDto, AuthWithDoctorDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";

describe("AuthController", () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

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
    it("should call service.login with login DTO", async () => {
      const dto: LoginDto = { username: "user", password: "pass" } as any;
      const expectedResult: AuthDto = { token: "token" } as any;

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto);
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
