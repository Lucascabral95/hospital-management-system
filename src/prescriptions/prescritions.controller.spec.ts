import { Test, TestingModule } from "@nestjs/testing";
import { PrescriptionsController } from "./prescriptions.controller";
import { PrescriptionsService } from "./prescriptions.service";
import { CreatePrescriptionDto } from "./dto/create-prescription.dto";
import { UpdatePrescriptionDto } from "./dto/update-prescription.dto";

describe("PrescriptionsController", () => {
  let controller: PrescriptionsController;
  let service: PrescriptionsService;

  const mockPrescriptionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrescriptionsController],
      providers: [
        {
          provide: PrescriptionsService,
          useValue: mockPrescriptionsService as unknown as PrescriptionsService,
        },
      ],
    }).compile();

    controller = module.get<PrescriptionsController>(PrescriptionsController);
    service = module.get<PrescriptionsService>(PrescriptionsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.create with correct params", async () => {
      const dto = { note: "Take twice a day" } as unknown as CreatePrescriptionDto;
      const mockUser = "user-id-123";
      const expectedResult = { id: 1, ...dto };

      mockPrescriptionsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAll", () => {
    it("should return an array of prescriptions", async () => {
      const mockUser = "user-id-123";
      const expectedResult = [{ id: 1 }, { id: 2 }];

      mockPrescriptionsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockUser);

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findOne", () => {
    it("should convert param id to number and call service", async () => {
      const mockUser = "user-id-123";
      const idParam = "5";
      const expectedResult = { id: 5, name: "Test" };

      mockPrescriptionsService.findOne.mockResolvedValue(expectedResult);

      await controller.findOne(mockUser, idParam);

      expect(service.findOne).toHaveBeenCalledWith(5);
    });
  });

  describe("update", () => {
    it("should call service.update with number id", async () => {
      const mockUser = "admin-id";
      const idParam = "5";
      const dto = { note: "Updated" } as UpdatePrescriptionDto;

      mockPrescriptionsService.update.mockResolvedValue({ id: 5, ...dto });

      await controller.update(mockUser, idParam, dto);

      expect(service.update).toHaveBeenCalledWith(5, dto);
    });
  });

  describe("remove", () => {
    it("should call service.remove with number id", async () => {
      const mockUser = "admin-id";
      const idParam = "10";

      mockPrescriptionsService.remove.mockResolvedValue({ deleted: true });

      await controller.remove(mockUser, idParam);

      expect(service.remove).toHaveBeenCalledWith(10);
    });
  });
});
