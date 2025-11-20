import { Test, TestingModule } from "@nestjs/testing";
import { DoctorsController } from "./doctors.controller";
import { DoctorsService } from "./doctors.service";
import { CreateDoctorDto } from "./dto/create-doctor.dto";
import { UpdateDoctorDto } from "./dto/update-doctor.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { GetPatientsOfDoctorByIDDto } from "./dto/get-patients-of-doctor-by-id.dto";

describe("DoctorsController", () => {
  let controller: DoctorsController;
  let service: DoctorsService;

  const mockDoctorsService = {
    create: jest.fn(),
    findAllSelect: jest.fn(),
    findAll: jest.fn(),
    findPatientsOfDoctorById: jest.fn(),
    findOne: jest.fn(),
    totalResource: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorsController],
      providers: [
        {
          provide: DoctorsService,
          useValue: mockDoctorsService,
        },
      ],
    }).compile();

    controller = module.get<DoctorsController>(DoctorsController);
    service = module.get<DoctorsService>(DoctorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.create", async () => {
      const dto: CreateDoctorDto = { authId: 1, specialty: "Cardiology" } as any;
      const expectedResult = { id: 1, ...dto };
      const mockUser = "user-id";

      mockDoctorsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAllSelect", () => {
    it("should call service.findAllSelect", async () => {
      const mockUser = "user-id";
      const expectedResult = [{ id: 1, specialty: "Cardiology", auth: { id: 1, full_name: "Dr. A" } }];

      mockDoctorsService.findAllSelect.mockResolvedValue(expectedResult);

      const result = await controller.findAllSelect(mockUser);

      expect(service.findAllSelect).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAll", () => {
    it("should call service.findAll with pagination", async () => {
      const mockUser = "user-id";
      const paginationDto: PaginationDto = { page: 1, limit: 10 } as any;
      const expectedResult = { totalPage: 1, page: 1, total: 5, data: [] };

      mockDoctorsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockUser, paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findPatientsOfDoctorById", () => {
    it("should call service.findPatientsOfDoctorById", async () => {
      const mockUser = "user-id";
      const doctorId = 3;
      const expectedResult: GetPatientsOfDoctorByIDDto = {
        id: 3,
        specialty: "Cardiología",
        licenceNumber: 12345,
        createdAt: new Date(),
        updatedAt: new Date(),
        authId: 1,
        medicalRecords: [],
      };
      mockDoctorsService.findPatientsOfDoctorById.mockResolvedValue(expectedResult);

      const result = await controller.findPatientsOfDoctorById(mockUser, doctorId);

      expect(service.findPatientsOfDoctorById).toHaveBeenCalledWith(3);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findOne", () => {
    it("should call service.findOne", async () => {
      const mockUser = "user-id";
      const idParam = "5";
      const expectedResult = { id: 5 };

      mockDoctorsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockUser, idParam);

      expect(service.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("totalResource", () => {
    it("should call service.totalResource", async () => {
      const mockUser = "user-id";
      const expectedResult = {
        totalDoctors: 10,
        totalPatients: 100,
        totalInterments: 5,
        totalAppointments: 20,
      };

      mockDoctorsService.totalResource.mockResolvedValue(expectedResult);

      const result = await controller.totalResource(mockUser);

      expect(service.totalResource).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call service.update", async () => {
      const mockUser = "user-id";
      const idParam = "7";
      const dto: UpdateDoctorDto = { specialty: "Neurology" } as any;
      const expectedResult = { message: "Doctor updated successfully", updatedDoctor: { id: 7, ...dto } };

      mockDoctorsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(mockUser, idParam, dto);

      expect(service.update).toHaveBeenCalledWith(7, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("remove", () => {
    it("should call service.remove", async () => {
      const mockUser = "user-id";
      const idParam = "8";
      const expectedResult = { message: "Doctor deleted successfully", deletedDoctor: { id: 8 } };

      mockDoctorsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(mockUser, idParam);

      expect(service.remove).toHaveBeenCalledWith(8);
      expect(result).toEqual(expectedResult);
    });
  });
});
