import { Test, TestingModule } from "@nestjs/testing";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "src/prisma/prisma.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  const mockPrismaService = {
    appointment: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    doctor: {
      findMany: jest.fn(),
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

  describe("getInsights", () => {
    it("should return cached result without querying prisma", async () => {
      const cached = { kpis: { total: { current: 1, previous: 0, deltaPct: 100 } } };
      mockCacheManager.get.mockResolvedValue(cached);

      const result = await service.getInsights(30);

      expect(result).toEqual(cached);
      expect(mockPrismaService.appointment.groupBy).not.toHaveBeenCalled();
    });

    it("should aggregate kpis, peak hours, doctor performance and no-show risk", async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.appointment.groupBy
        .mockResolvedValueOnce([
          { status: "COMPLETED", _count: { status: 8 } },
          { status: "NO_SHOW", _count: { status: 2 } },
        ])
        .mockResolvedValueOnce([{ status: "COMPLETED", _count: { status: 5 } }])
        .mockResolvedValueOnce([
          { doctorId: 1, status: "COMPLETED", _count: { status: 6 } },
          { doctorId: 1, status: "NO_SHOW", _count: { status: 2 } },
        ])
        .mockResolvedValueOnce([
          { patientsId: 7, status: "COMPLETED", _count: { status: 1 } },
          { patientsId: 7, status: "NO_SHOW", _count: { status: 2 } },
        ]);
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([{ avgLeadTimeDays: 2.5 }])
        .mockResolvedValueOnce([{ avgLeadTimeDays: 5 }])
        .mockResolvedValueOnce([{ dow: 1, hour: 9, count: 4 }]);
      mockPrismaService.doctor.findMany.mockResolvedValue([
        { id: 1, specialty: "Cardiology", auth: { full_name: "Dr. House" } },
      ]);
      mockPrismaService.appointment.findMany.mockResolvedValue([
        {
          id: 99,
          scheduledAt: new Date(),
          specialty: "Cardiology",
          patientsId: 7,
          patient: { id: 7, name: "Ana", last_name: "Gomez" },
          doctor: { id: 1, auth: { full_name: "Dr. House" } },
        },
      ]);

      const result: any = await service.getInsights(30);

      expect(result.kpis.total).toEqual({ current: 10, previous: 5, deltaPct: 100 });
      expect(result.kpis.noShowRate).toEqual({ current: 20, previous: 0, deltaPct: 100 });
      expect(result.kpis.completedRate).toEqual({ current: 80, previous: 100, deltaPct: -20 });
      expect(result.kpis.avgLeadTimeDays).toEqual({ current: 2.5, previous: 5, deltaPct: -50 });
      expect(result.peakHours).toEqual([{ dayOfWeek: 1, hour: 9, count: 4 }]);
      expect(result.doctorPerformance).toEqual([
        {
          doctorId: 1,
          doctorName: "Dr. House",
          specialty: "Cardiology",
          scheduled: 8,
          completed: 6,
          noShow: 2,
          cancelled: 0,
          completionRate: 75,
          noShowRate: 25,
        },
      ]);
      expect(result.noShowRisk).toHaveLength(1);
      expect(result.noShowRisk[0].appointmentId).toBe(99);
      expect(result.noShowRisk[0].patient).toEqual({ id: 7, name: "Ana", lastName: "Gomez" });
      expect(result.noShowRisk[0].stats).toEqual({ attended: 1, noShows: 2, noShowRate: 66.7 });
      expect(result.noShowRisk[0].riskLevel).toBe("HIGH");
      expect(mockCacheManager.set).toHaveBeenCalledWith("analytics:insights:30", result, 30000);
    });

    it("should handle empty windows with zeroed kpis", async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.appointment.groupBy.mockResolvedValue([]);
      mockPrismaService.$queryRaw.mockResolvedValue([]);
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      const result: any = await service.getInsights(7);

      expect(result.kpis.total).toEqual({ current: 0, previous: 0, deltaPct: 0 });
      expect(result.kpis.completedRate).toEqual({ current: 0, previous: 0, deltaPct: 0 });
      expect(result.kpis.avgLeadTimeDays).toEqual({ current: 0, previous: 0, deltaPct: 0 });
      expect(result.peakHours).toEqual([]);
      expect(result.doctorPerformance).toEqual([]);
      expect(result.noShowRisk).toEqual([]);
      expect(mockPrismaService.doctor.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getNoShowRisk", () => {
    it("should return cached result without querying prisma", async () => {
      const cached = [{ appointmentId: 1, riskLevel: "LOW" }];
      mockCacheManager.get.mockResolvedValue(cached);

      const result = await service.getNoShowRisk();

      expect(result).toEqual(cached);
      expect(mockPrismaService.appointment.findMany).not.toHaveBeenCalled();
    });

    it("should resolve every risk level from patient history", async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.appointment.findMany.mockResolvedValue([
        {
          id: 1,
          scheduledAt: new Date(),
          specialty: "Clinician",
          patientsId: 10,
          patient: { id: 10, name: "A", last_name: "High" },
          doctor: null,
        },
        {
          id: 2,
          scheduledAt: new Date(),
          specialty: "Clinician",
          patientsId: 11,
          patient: { id: 11, name: "B", last_name: "Medium" },
          doctor: null,
        },
        {
          id: 3,
          scheduledAt: new Date(),
          specialty: "Clinician",
          patientsId: 12,
          patient: { id: 12, name: "C", last_name: "Low" },
          doctor: null,
        },
        {
          id: 4,
          scheduledAt: new Date(),
          specialty: "Clinician",
          patientsId: 13,
          patient: { id: 13, name: "D", last_name: "New" },
          doctor: null,
        },
      ]);
      mockPrismaService.appointment.groupBy.mockResolvedValue([
        { patientsId: 10, status: "COMPLETED", _count: { status: 1 } },
        { patientsId: 10, status: "NO_SHOW", _count: { status: 2 } },
        { patientsId: 11, status: "COMPLETED", _count: { status: 3 } },
        { patientsId: 11, status: "NO_SHOW", _count: { status: 1 } },
        { patientsId: 12, status: "COMPLETED", _count: { status: 5 } },
      ]);

      const result: any = await service.getNoShowRisk();

      expect(result.map((item: any) => item.riskLevel)).toEqual(["HIGH", "MEDIUM", "LOW", "NO_HISTORY"]);
      expect(result[1].stats.noShowRate).toBe(25);
      expect(result[2].stats.noShowRate).toBe(0);
      expect(result[3].stats.noShowRate).toBeNull();
      expect(result[0].doctor).toBeNull();
      expect(mockCacheManager.set).toHaveBeenCalledWith("analytics:no-show-risk", result, 30000);
    });
  });
});
