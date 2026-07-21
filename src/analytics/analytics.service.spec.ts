import { Test, TestingModule } from "@nestjs/testing";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "src/prisma/prisma.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  const mockPrismaService = {
    appointment: {
      groupBy: jest.fn(),
    },
    interment: {
      groupBy: jest.fn(),
    },
    diagnosis: {
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getOverview", () => {
    it("should return cached result without querying prisma", async () => {
      const cached = { appointmentsByStatus: [] };
      mockCacheManager.get.mockResolvedValue(cached);

      const result = await service.getOverview(14);

      expect(result).toEqual(cached);
      expect(mockPrismaService.appointment.groupBy).not.toHaveBeenCalled();
    });

    it("should aggregate analytics from prisma and cache the result", async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.appointment.groupBy.mockResolvedValueOnce([
        { status: "COMPLETED", _count: { status: 5 } },
      ]);
      mockPrismaService.appointment.groupBy.mockResolvedValueOnce([
        { specialty: "Cardiology", _count: { specialty: 3 } },
      ]);
      mockPrismaService.interment.groupBy.mockResolvedValue([{ status: "IN_PROGRESS", _count: { status: 2 } }]);
      mockPrismaService.diagnosis.groupBy.mockResolvedValue([
        { description: "Flu", _count: { description: 4 } },
      ]);

      const today = new Date().toISOString().slice(0, 10);
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([{ day: new Date(), count: 7 }])
        .mockResolvedValueOnce([{ day: new Date(), count: 2 }])
        .mockResolvedValueOnce([{ day: new Date(), count: 1 }]);

      const result: any = await service.getOverview(3);

      expect(result.appointmentsByStatus).toEqual([{ status: "COMPLETED", count: 5 }]);
      expect(result.appointmentsBySpecialty).toEqual([{ specialty: "Cardiology", count: 3 }]);
      expect(result.intermentOccupancy).toEqual([{ status: "IN_PROGRESS", count: 2 }]);
      expect(result.topDiagnoses).toEqual([{ description: "Flu", count: 4 }]);
      expect(result.appointmentsTimeSeries).toHaveLength(3);
      expect(result.appointmentsTimeSeries.find((d: any) => d.date === today)?.count).toBe(7);
      expect(result.admissionsVsDischarges).toHaveLength(3);
      expect(result.admissionsVsDischarges.find((d: any) => d.date === today)).toEqual({
        date: today,
        admissions: 2,
        discharges: 1,
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith("analytics:overview:3", result, 30000);
    });

    it("should fill missing days with zero counts", async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.appointment.groupBy.mockResolvedValue([]);
      mockPrismaService.interment.groupBy.mockResolvedValue([]);
      mockPrismaService.diagnosis.groupBy.mockResolvedValue([]);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result: any = await service.getOverview(5);

      expect(result.appointmentsTimeSeries).toHaveLength(5);
      expect(result.appointmentsTimeSeries.every((d: any) => d.count === 0)).toBe(true);
      expect(result.admissionsVsDischarges.every((d: any) => d.admissions === 0 && d.discharges === 0)).toBe(true);
    });
  });
});
