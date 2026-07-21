import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

describe("AnalyticsController", () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    getOverview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: mockAnalyticsService }],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getOverview", () => {
    it("should call service.getOverview with the requested day range", async () => {
      const expected = { appointmentsByStatus: [] };
      mockAnalyticsService.getOverview.mockResolvedValue(expected);

      const result = await controller.getOverview("admin", { days: 30 });

      expect(service.getOverview).toHaveBeenCalledWith(30);
      expect(result).toEqual(expected);
    });
  });
});
