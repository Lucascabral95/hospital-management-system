import { Test, TestingModule } from "@nestjs/testing";
import { IntermentController } from "./interment.controller";
import { IntermentService } from "./interment.service";
import { CreateIntermentDto, CreateDiagnosisDto } from "./dto/create-interment.dto";
import { UpdateIntermentDto } from "./dto/update-interment.dto";
import { PatchDiagnosisDto } from "./dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { Status } from "@prisma/client";

describe("IntermentController", () => {
  let controller: IntermentController;
  let service: IntermentService;

  const mockIntermentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getAllDiagnosis: jest.fn(),
    getDiagnosisById: jest.fn(),
    updateDiagnosisById: jest.fn(),
    addDiagnosisInInterment: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntermentController],
      providers: [
        {
          provide: IntermentService,
          useValue: mockIntermentService as unknown as IntermentService,
        },
      ],
    }).compile();

    controller = module.get<IntermentController>(IntermentController);
    service = module.get<IntermentService>(IntermentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.create with DTO", async () => {
      const dto: CreateIntermentDto = {} as any;
      const mockUser = "user-id";
      const expectedResult = { id: 1, ...dto };

      mockIntermentService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAll", () => {
    it("should call service.findAll with pagination DTO", async () => {
      const mockUser = "user-id";
      const paginationDto: PaginationDto = { limit: 10, page: 1 } as any;
      const expectedResult = [{ id: 1 }];

      mockIntermentService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockUser, paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("getAllDiagnosis", () => {
    it("should call service.getAllDiagnosis", async () => {
      const mockUser = "user-id";
      const expectedResult = [{ id: 1, diagnosis: "Test" }];

      mockIntermentService.getAllDiagnosis.mockResolvedValue(expectedResult);

      const result = await controller.getAllDiagnosis(mockUser);

      expect(service.getAllDiagnosis).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe("getDiagnosisById", () => {
    it("should call service.getDiagnosisById with id", async () => {
      const mockUser = "user-id";
      const idParam = "5";
      const expectedResult = { id: 5, diagnosis: "Test" };

      mockIntermentService.getDiagnosisById.mockResolvedValue(expectedResult);

      const result = await controller.getDiagnosisById(mockUser, idParam);

      expect(service.getDiagnosisById).toHaveBeenCalledWith(5);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("updateDiagnosisById", () => {
    it("should call service.updateDiagnosisById with id and DTO", async () => {
      const mockUser = "user-id";
      const diagnosisId = 3;
      const dto: PatchDiagnosisDto = {} as any;
      const expectedResult = { id: 3, ...dto };

      mockIntermentService.updateDiagnosisById.mockResolvedValue(expectedResult);

      const result = await controller.updateDiagnosisById(mockUser, diagnosisId, dto);

      expect(service.updateDiagnosisById).toHaveBeenCalledWith(3, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("addDiagnosisInInterment", () => {
    it("should call service.addDiagnosisInInterment with intermentId and DTO", async () => {
      const mockUser = "user-id";
      const intermentId = 7;
      const dto: CreateDiagnosisDto = {} as any;
      const expectedResult = { id: 7, diagnosis: dto };

      mockIntermentService.addDiagnosisInInterment.mockResolvedValue(expectedResult);

      const result = await controller.addDiagnosisInInterment(mockUser, intermentId, dto);

      expect(service.addDiagnosisInInterment).toHaveBeenCalledWith(7, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findOne", () => {
    it("should call service.findOne with numeric id", async () => {
      const mockUser = "user-id";
      const idParam = "6";
      const expectedResult = { id: 6 };

      mockIntermentService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockUser, idParam);

      expect(service.findOne).toHaveBeenCalledWith(6);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call service.update with id and DTO", async () => {
      const mockUser = "user-id";
      const idParam = "8";
      const dto: UpdateIntermentDto = {} as any;
      const expectedResult = { id: 8, ...dto };

      mockIntermentService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(mockUser, idParam, dto);

      expect(service.update).toHaveBeenCalledWith(8, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("updateStatus", () => {
    it("should call service.updateStatus with id and status", async () => {
      const mockUser = "user-id";
      const idParam = 9;
      const status: Status = "PENDING";
      const expectedResult = { id: 9, status };

      mockIntermentService.updateStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateStatus(mockUser, idParam, status);

      expect(service.updateStatus).toHaveBeenCalledWith(9, status);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("remove", () => {
    it("should call service.remove with numeric id", async () => {
      const mockUser = "user-id";
      const idParam = "10";

      mockIntermentService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(mockUser, idParam);

      expect(service.remove).toHaveBeenCalledWith(10);
      expect(result).toEqual({ deleted: true });
    });
  });
});
