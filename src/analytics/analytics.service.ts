import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { PrismaService } from "src/prisma/prisma.service";

interface DayCountRow {
  day: Date;
  count: bigint | number;
}

const ANALYTICS_CACHE_PREFIX = "analytics:overview:";
const ANALYTICS_CACHE_TTL_MS = 30000;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getOverview(days: number) {
    const cacheKey = `${ANALYTICS_CACHE_PREFIX}${days}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const [
      appointmentsByStatus,
      appointmentsBySpecialty,
      appointmentsTimeSeriesRaw,
      intermentOccupancy,
      topDiagnosesRaw,
      admissionsRaw,
      dischargesRaw,
    ] = await Promise.all([
      this.prisma.appointment.groupBy({ by: ["status"], _count: { status: true } }),
      this.prisma.appointment.groupBy({ by: ["specialty"], _count: { specialty: true } }),
      this.prisma.$queryRaw<DayCountRow[]>`
        SELECT date_trunc('day', "scheduledAt") as day, count(*)::int as count
        FROM "Appointment"
        WHERE "scheduledAt" >= NOW() - make_interval(days => ${days}::integer)
        GROUP BY day
        ORDER BY day ASC
      `,
      this.prisma.interment.groupBy({ by: ["status"], _count: { status: true } }),
      this.prisma.diagnosis.groupBy({
        by: ["description"],
        _count: { description: true },
        orderBy: { _count: { description: "desc" } },
        take: 5,
      }),
      this.prisma.$queryRaw<DayCountRow[]>`
        SELECT date_trunc('day', "admissionDate") as day, count(*)::int as count
        FROM "Interment"
        WHERE "admissionDate" >= NOW() - make_interval(days => ${days}::integer)
        GROUP BY day
        ORDER BY day ASC
      `,
      this.prisma.$queryRaw<DayCountRow[]>`
        SELECT date_trunc('day', "dischargeDate") as day, count(*)::int as count
        FROM "Interment"
        WHERE "dischargeDate" IS NOT NULL AND "dischargeDate" >= NOW() - make_interval(days => ${days}::integer)
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    const dayRange = this.buildDayRange(days);

    const result = {
      appointmentsByStatus: appointmentsByStatus.map((row) => ({
        status: row.status,
        count: row._count.status,
      })),
      appointmentsBySpecialty: appointmentsBySpecialty.map((row) => ({
        specialty: row.specialty,
        count: row._count.specialty,
      })),
      appointmentsTimeSeries: this.mergeDayCounts(dayRange, appointmentsTimeSeriesRaw),
      intermentOccupancy: intermentOccupancy.map((row) => ({
        status: row.status,
        count: row._count.status,
      })),
      topDiagnoses: topDiagnosesRaw.map((row) => ({
        description: row.description,
        count: row._count.description,
      })),
      admissionsVsDischarges: this.mergeAdmissionsDischarges(dayRange, admissionsRaw, dischargesRaw),
    };

    await this.cacheManager.set(cacheKey, result, ANALYTICS_CACHE_TTL_MS);

    return result;
  }

  private buildDayRange(days: number): string[] {
    const range: string[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - i);
      range.push(date.toISOString().slice(0, 10));
    }

    return range;
  }

  private toDayKey(value: Date): string {
    return new Date(value).toISOString().slice(0, 10);
  }

  private mergeDayCounts(dayRange: string[], rows: DayCountRow[]) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(this.toDayKey(row.day), Number(row.count));
    }

    return dayRange.map((date) => ({ date, count: counts.get(date) ?? 0 }));
  }

  private mergeAdmissionsDischarges(dayRange: string[], admissions: DayCountRow[], discharges: DayCountRow[]) {
    const admissionsMap = new Map<string, number>();
    for (const row of admissions) {
      admissionsMap.set(this.toDayKey(row.day), Number(row.count));
    }

    const dischargesMap = new Map<string, number>();
    for (const row of discharges) {
      dischargesMap.set(this.toDayKey(row.day), Number(row.count));
    }

    return dayRange.map((date) => ({
      date,
      admissions: admissionsMap.get(date) ?? 0,
      discharges: dischargesMap.get(date) ?? 0,
    }));
  }
}
