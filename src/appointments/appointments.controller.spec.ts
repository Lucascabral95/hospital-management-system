import { Test, TestingModule } from "@nestjs/testing";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { GetAppointmentsDto } from "./dto/get-appointments.dto";
import { FilterAppointmentsDto, UpdateAppointmentDto } from "./dto";

describe("AppointmentsController", () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;

  const mockAppointmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: mockAppointmentsService,
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.create with DTO", async () => {
      const dto: CreateAppointmentDto = {} as any;
      const expectedResult: GetAppointmentsDto = { id: 1 /* ... */ } as any;

      mockAppointmentsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAll", () => {
    it("should call service.findAll with filter DTO", async () => {
      const filterDto: FilterAppointmentsDto = {} as any;
      const expectedResult: GetAppointmentsDto[] = [{ id: 1 } as any];

      mockAppointmentsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findOne", () => {
    it("should call service.findOne with id number", async () => {
      const idParam = "5";
      const expectedResult: GetAppointmentsDto = { id: 5 } as any;

      mockAppointmentsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(idParam);

      expect(service.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("update", () => {
    it("should call service.update with id and DTO", async () => {
      const idParam = "3";
      const dto: UpdateAppointmentDto = {} as any;
      const expectedResult: GetAppointmentsDto = { id: 3 /* ... */ } as any;

      mockAppointmentsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(idParam, dto);

      expect(service.update).toHaveBeenCalledWith(3, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("remove", () => {
    it("should call service.remove with id number", async () => {
      const idParam = "7";
      const expectedResult = "Appointment deleted successfully";

      mockAppointmentsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(idParam);

      expect(service.remove).toHaveBeenCalledWith(7);
      expect(result).toEqual(expectedResult);
    });
  });
});
