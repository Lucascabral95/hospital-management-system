import { Test, TestingModule } from "@nestjs/testing";
import { PatientsController } from "./patients.controller";
import { PatientsService } from "./patients.service";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { QueryNameLastNameDto } from "../common/dto/search-patients.dto";

describe("PatientsController", () => {
  let controller: PatientsController;
  let service: PatientsService;

  const mockPatientsService = {
    create: jest.fn(),
    findAllSelect: jest.fn(),
    findAll: jest.fn(),
    findAllPatientsWithoutPagination: jest.fn(),
    findByDni: jest.fn(),
    getMedicalRecordsByPatientId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    seed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        {
          provide: PatientsService,
          useValue: mockPatientsService as unknown as PatientsService,
        },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.create with dto", async () => {
      const dto: CreatePatientDto = { name: "John", lastName: "Doe" } as any;
      const mockUser = "admin-id";
      const expectedResult = { id: 1, ...dto };

      mockPatientsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAllSelect", () => {
    it("should return all patients for select", async () => {
      const mockUser = "user-id";
      const expectedResult = [{ id: 1, name: "John" }];

      mockPatientsService.findAllSelect.mockResolvedValue(expectedResult);

      const result = await controller.findAllSelect(mockUser);

      expect(service.findAllSelect).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAll", () => {
    it("should call service with pagination params", async () => {
      const mockUser = "user-id";
      const paginationDto: PaginationDto = { limit: 10, offset: 0 } as any;
      const expectedResult = { data: [], total: 0 };

      mockPatientsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockUser, paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAllPatientsWithoutPagination", () => {
    it("should call service with search query", async () => {
      const mockUser = "user-id";
      const queryDto: QueryNameLastNameDto = { patient: "John" } as any;
      const expectedResult = [{ id: 1, name: "John" }];

      mockPatientsService.findAllPatientsWithoutPagination.mockResolvedValue(expectedResult);

      const result = await controller.findAllPatientsWithoutPagination(mockUser, queryDto);

      expect(service.findAllPatientsWithoutPagination).toHaveBeenCalledWith("John");
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByDni", () => {
    it("should call service.findByDni with dni string", async () => {
      const dni = "12345678";
      const expectedResult = { id: 1, dni: "12345678" };

      mockPatientsService.findByDni.mockResolvedValue(expectedResult);

      const result = await controller.findByDni(dni);

      expect(service.findByDni).toHaveBeenCalledWith(dni);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("getMedicalRecordsByPatientId", () => {
    it("should convert id to number and call service", async () => {
      const mockUser = "user-id";
      const idParam = 5;
      const expectedResult = [{ id: 1, patientId: 5 }];

      mockPatientsService.getMedicalRecordsByPatientId.mockResolvedValue(expectedResult);

      const result = await controller.getMedicalRecordsByPatientId(mockUser, idParam);

      expect(service.getMedicalRecordsByPatientId).toHaveBeenCalledWith(5);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findOne", () => {
    it("should convert id to number and call service", async () => {
      const mockUser = "user-id";
      const idParam = 3;
      const expectedResult = { id: 3, name: "Test" };

      mockPatientsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockUser, idParam);

      expect(service.findOne).toHaveBeenCalledWith(3);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call service.update with id and dto", async () => {
      const mockUser = "admin-id";
      const idParam = 2;
      const dto: UpdatePatientDto = { name: "Updated" } as any;
      const expectedResult = { id: 2, ...dto };

      mockPatientsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(mockUser, idParam, dto);

      expect(service.update).toHaveBeenCalledWith(2, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("remove", () => {
    it("should call service.remove with number id", async () => {
      const mockUser = "admin-id";
      const idParam = 10;

      mockPatientsService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(mockUser, idParam);

      expect(service.remove).toHaveBeenCalledWith(10);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe("seed", () => {
    it("should call service.seed", async () => {
      const mockUser = "admin-id";
      const expectedResult = { message: "Seed completed" };

      mockPatientsService.seed.mockResolvedValue(expectedResult);

      const result = await controller.seed(mockUser);

      expect(service.seed).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
});
