import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

describe("AnalyticsController", () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    getOverview: jest.fn(),
    getInsights: jest.fn(),
    getNoShowRisk: jest.fn(),
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

  describe("getInsights", () => {
    it("should call service.getInsights with the requested day range", async () => {
      const expected = { kpis: {} };
      mockAnalyticsService.getInsights.mockResolvedValue(expected);

      const result = await controller.getInsights("admin", { days: 30 });

      expect(service.getInsights).toHaveBeenCalledWith(30);
      expect(result).toEqual(expected);
    });
  });

  describe("getNoShowRisk", () => {
    it("should call service.getNoShowRisk", async () => {
      const expected = [{ appointmentId: 1, riskLevel: "HIGH" }];
      mockAnalyticsService.getNoShowRisk.mockResolvedValue(expected);

      const result = await controller.getNoShowRisk("admin");

      expect(service.getNoShowRisk).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });
});
