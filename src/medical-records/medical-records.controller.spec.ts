import { Test, TestingModule } from "@nestjs/testing";
import { MedicalRecordsController } from "./medical-records.controller";
import { MedicalRecordsService } from "./medical-records.service";
import { CreateMedicalRecordDto } from "./dto/create-medical-record.dto";
import { UpdateMedicalRecordDto } from "./dto/update-medical-record.dto";
import { PaginationDto } from "../common/dto/pagination.dto";

describe("MedicalRecordsController", () => {
  let controller: MedicalRecordsController;
  let service: MedicalRecordsService;

  const mockMedicalRecordsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllWithPatientsAndDoctors: jest.fn(),
    findMedicalRecordsByPatientId: jest.fn(),
    findMedicalRecordsByDoctorId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalRecordsController],
      providers: [
        {
          provide: MedicalRecordsService,
          useValue: mockMedicalRecordsService as unknown as MedicalRecordsService,
        },
      ],
    }).compile();

    controller = module.get<MedicalRecordsController>(MedicalRecordsController);
    service = module.get<MedicalRecordsService>(MedicalRecordsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.create with dto", async () => {
      const dto: CreateMedicalRecordDto = { doctorId: 1, patientsId: 2, diagnosis: "Test" } as any;
      const mockUser = "user-id";
      const expectedResult = { id: 1, ...dto };

      mockMedicalRecordsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAll", () => {
    it("should call service.findAll", async () => {
      const mockUser = "user-id";
      const expectedResult = [{ id: 1 }];

      mockMedicalRecordsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockUser);

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAllWithPatientsAndDoctors", () => {
    it("should call service with paginationDto", async () => {
      const mockUser = "user-id";
      const paginationDto: PaginationDto = { page: 1, limit: 10 } as any;
      const expectedResult = { data: [], totalPage: 1 };

      mockMedicalRecordsService.findAllWithPatientsAndDoctors.mockResolvedValue(expectedResult);

      const result = await controller.findAllWithPatientsAndDoctors(mockUser, paginationDto);

      expect(service.findAllWithPatientsAndDoctors).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findMedicalRecordsByPatientId", () => {
    it("should call service with id and paginationDto", async () => {
      const mockUser = "user-id";
      const idParam = 5;
      const paginationDto: PaginationDto = { page: 1 } as any;
      const expectedResult = [{ id: 1, patientsId: 5 }];

      mockMedicalRecordsService.findMedicalRecordsByPatientId.mockResolvedValue(expectedResult);

      const result = await controller.findMedicalRecordsByPatientId(mockUser, idParam, paginationDto);

      expect(service.findMedicalRecordsByPatientId).toHaveBeenCalledWith(5, paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findMedicalRecordsByDoctorId", () => {
    it("should call service with id and paginationDto", async () => {
      const mockUser = "user-id";
      const idParam = 3;
      const paginationDto: PaginationDto = { page: 1 } as any;
      const expectedResult = [{ id: 1, doctorId: 3 }];

      mockMedicalRecordsService.findMedicalRecordsByDoctorId.mockResolvedValue(expectedResult);

      const result = await controller.findMedicalRecordsByDoctorId(mockUser, idParam, paginationDto);

      expect(service.findMedicalRecordsByDoctorId).toHaveBeenCalledWith(3, paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findOne", () => {
    it("should call service.findOne with number id", async () => {
      const mockUser = "user-id";
      const idParam = "2";
      const expectedResult = { id: 2 };

      mockMedicalRecordsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockUser, idParam);

      expect(service.findOne).toHaveBeenCalledWith(2);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call service.update with correct id and dto", async () => {
      const mockUser = "admin-id";
      const idParam = "1";
      const dto: UpdateMedicalRecordDto = { diagnosis: "Updated" } as any;
      const expectedResult = { id: 1, diagnosis: "Updated" };

      mockMedicalRecordsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(mockUser, idParam, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("remove", () => {
    it("should call service.remove with correct id", async () => {
      const mockUser = "admin-id";
      const idParam = "5";

      mockMedicalRecordsService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(mockUser, idParam);

      expect(service.remove).toHaveBeenCalledWith(5);
      expect(result).toEqual({ deleted: true });
    });
  });
});
