import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { PrismaService } from "src/prisma/prisma.service";

interface DayCountRow {
  day: Date;
  count: bigint | number;
}

interface AvgLeadTimeRow {
  avgLeadTimeDays: number | null;
}

interface PeakHourRow {
  dow: number;
  hour: number;
  count: bigint | number;
}

type NoShowRiskLevel = "HIGH" | "MEDIUM" | "LOW" | "NO_HISTORY";

const ANALYTICS_CACHE_PREFIX = "analytics:overview:";
const INSIGHTS_CACHE_PREFIX = "analytics:insights:";
const NO_SHOW_RISK_CACHE_KEY = "analytics:no-show-risk";
const ANALYTICS_CACHE_TTL_MS = 30000;
const NO_SHOW_RISK_UPCOMING_DAYS = 7;
const NO_SHOW_RISK_MAX_ITEMS = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

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

  async getInsights(days: number) {
    const cacheKey = `${INSIGHTS_CACHE_PREFIX}${days}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const currentStart = new Date(now.getTime() - days * DAY_MS);
    const previousStart = new Date(now.getTime() - 2 * days * DAY_MS);

    const [
      currentStatusRows,
      previousStatusRows,
      currentLeadTimeRows,
      previousLeadTimeRows,
      peakHoursRaw,
      doctorStatusRows,
    ] = await Promise.all([
      this.prisma.appointment.groupBy({
        by: ["status"],
        where: { scheduledAt: { gte: currentStart, lte: now } },
        _count: { status: true },
      }),
      this.prisma.appointment.groupBy({
        by: ["status"],
        where: { scheduledAt: { gte: previousStart, lt: currentStart } },
        _count: { status: true },
      }),
      this.prisma.$queryRaw<AvgLeadTimeRow[]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("scheduledAt" - "createdAt")) / 86400.0)::float as "avgLeadTimeDays"
        FROM "Appointment"
        WHERE "scheduledAt" >= ${currentStart} AND "scheduledAt" <= ${now}
      `,
      this.prisma.$queryRaw<AvgLeadTimeRow[]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("scheduledAt" - "createdAt")) / 86400.0)::float as "avgLeadTimeDays"
        FROM "Appointment"
        WHERE "scheduledAt" >= ${previousStart} AND "scheduledAt" < ${currentStart}
      `,
      this.prisma.$queryRaw<PeakHourRow[]>`
        SELECT EXTRACT(DOW FROM "scheduledAt")::int as dow, EXTRACT(HOUR FROM "scheduledAt")::int as hour, count(*)::int as count
        FROM "Appointment"
        WHERE "scheduledAt" >= ${currentStart} AND "scheduledAt" <= ${now}
        GROUP BY dow, hour
      `,
      this.prisma.appointment.groupBy({
        by: ["doctorId", "status"],
        where: { scheduledAt: { gte: currentStart, lte: now }, doctorId: { not: null } },
        _count: { status: true },
      }),
    ]);

    const current = this.buildWindowCounts(currentStatusRows);
    const previous = this.buildWindowCounts(previousStatusRows);
    const currentAvgLead = currentLeadTimeRows[0]?.avgLeadTimeDays ?? null;
    const previousAvgLead = previousLeadTimeRows[0]?.avgLeadTimeDays ?? null;

    const kpis = {
      total: this.buildKpi(current.total, previous.total),
      completedRate: this.buildKpi(
        this.rate(current.completed, current.total),
        this.rate(previous.completed, previous.total),
      ),
      cancelledRate: this.buildKpi(
        this.rate(current.cancelled, current.total),
        this.rate(previous.cancelled, previous.total),
      ),
      noShowRate: this.buildKpi(this.rate(current.noShow, current.total), this.rate(previous.noShow, previous.total)),
      avgLeadTimeDays: this.buildKpi(currentAvgLead ?? 0, previousAvgLead ?? 0),
    };

    const peakHours = peakHoursRaw.map((row) => ({
      dayOfWeek: Number(row.dow),
      hour: Number(row.hour),
      count: Number(row.count),
    }));

    const doctorPerformance = await this.buildDoctorPerformance(doctorStatusRows);
    const noShowRisk = await this.buildNoShowRisk();

    const result = { kpis, peakHours, doctorPerformance, noShowRisk };

    await this.cacheManager.set(cacheKey, result, ANALYTICS_CACHE_TTL_MS);

    return result;
  }

  async getNoShowRisk() {
    const cached = await this.cacheManager.get(NO_SHOW_RISK_CACHE_KEY);
    if (cached) return cached;

    const result = await this.buildNoShowRisk();

    await this.cacheManager.set(NO_SHOW_RISK_CACHE_KEY, result, ANALYTICS_CACHE_TTL_MS);

    return result;
  }

  private buildWindowCounts(rows: { status: string; _count: { status: number } }[]) {
    const counts = { total: 0, completed: 0, cancelled: 0, noShow: 0 };
    for (const row of rows) {
      const count = row._count.status;
      counts.total += count;
      if (row.status === "COMPLETED") counts.completed += count;
      if (row.status === "CANCELLED") counts.cancelled += count;
      if (row.status === "NO_SHOW") counts.noShow += count;
    }
    return counts;
  }

  private rate(part: number, total: number): number {
    if (total === 0) return 0;
    return (part / total) * 100;
  }

  private buildKpi(current: number, previous: number) {
    let deltaPct = 0;
    if (previous !== 0) {
      deltaPct = ((current - previous) / previous) * 100;
    } else if (current !== 0) {
      deltaPct = 100;
    }

    return {
      current: this.round1(current),
      previous: this.round1(previous),
      deltaPct: this.round1(deltaPct),
    };
  }

  private round1(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private async buildDoctorPerformance(
    rows: { doctorId: number | null; status: string; _count: { status: number } }[],
  ) {
    const doctorIds = [...new Set(rows.map((row) => row.doctorId).filter((id): id is number => id !== null))];
    if (doctorIds.length === 0) return [];

    const doctors = await this.prisma.doctor.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, specialty: true, auth: { select: { full_name: true } } },
    });
    const doctorsById = new Map(doctors.map((doctor) => [doctor.id, doctor]));

    const performanceByDoctor = new Map<
      number,
      { scheduled: number; completed: number; noShow: number; cancelled: number }
    >();

    for (const row of rows) {
      if (row.doctorId === null) continue;
      const entry = performanceByDoctor.get(row.doctorId) ?? { scheduled: 0, completed: 0, noShow: 0, cancelled: 0 };
      const count = row._count.status;
      entry.scheduled += count;
      if (row.status === "COMPLETED") entry.completed += count;
      if (row.status === "NO_SHOW") entry.noShow += count;
      if (row.status === "CANCELLED") entry.cancelled += count;
      performanceByDoctor.set(row.doctorId, entry);
    }

    return [...performanceByDoctor.entries()]
      .map(([doctorId, entry]) => {
        const doctor = doctorsById.get(doctorId);
        return {
          doctorId,
          doctorName: doctor?.auth.full_name ?? "Desconocido",
          specialty: doctor?.specialty ?? "-",
          scheduled: entry.scheduled,
          completed: entry.completed,
          noShow: entry.noShow,
          cancelled: entry.cancelled,
          completionRate: this.round1(this.rate(entry.completed, entry.scheduled)),
          noShowRate: this.round1(this.rate(entry.noShow, entry.scheduled)),
        };
      })
      .sort((a, b) => b.scheduled - a.scheduled);
  }

  private async buildNoShowRisk() {
    const now = new Date();
    const upcomingEnd = new Date(now.getTime() + NO_SHOW_RISK_UPCOMING_DAYS * DAY_MS);

    const upcomingAppointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: now, lte: upcomingEnd },
        status: { in: ["PENDING", "SCHEDULED"] },
      },
      select: {
        id: true,
        scheduledAt: true,
        specialty: true,
        patientsId: true,
        patient: { select: { id: true, name: true, last_name: true } },
        doctor: { select: { id: true, auth: { select: { full_name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
      take: NO_SHOW_RISK_MAX_ITEMS,
    });

    const patientIds = [...new Set(upcomingAppointments.map((appointment) => appointment.patientsId))];
    const historyRows =
      patientIds.length === 0
        ? []
        : await this.prisma.appointment.groupBy({
            by: ["patientsId", "status"],
            where: { patientsId: { in: patientIds }, status: { in: ["COMPLETED", "NO_SHOW"] } },
            _count: { status: true },
          });

    const historyByPatient = new Map<number, { attended: number; noShows: number }>();
    for (const row of historyRows) {
      const entry = historyByPatient.get(row.patientsId) ?? { attended: 0, noShows: 0 };
      if (row.status === "COMPLETED") entry.attended += row._count.status;
      if (row.status === "NO_SHOW") entry.noShows += row._count.status;
      historyByPatient.set(row.patientsId, entry);
    }

    return upcomingAppointments.map((appointment) => {
      const history = historyByPatient.get(appointment.patientsId) ?? { attended: 0, noShows: 0 };
      const base = history.attended + history.noShows;
      const noShowRate = base === 0 ? null : this.round1((history.noShows / base) * 100);

      return {
        appointmentId: appointment.id,
        scheduledAt: appointment.scheduledAt,
        specialty: appointment.specialty,
        patient: {
          id: appointment.patient.id,
          name: appointment.patient.name,
          lastName: appointment.patient.last_name,
        },
        doctor: appointment.doctor ? { id: appointment.doctor.id, name: appointment.doctor.auth.full_name } : null,
        stats: { attended: history.attended, noShows: history.noShows, noShowRate },
        riskLevel: this.resolveRiskLevel(base, noShowRate),
      };
    });
  }

  private resolveRiskLevel(base: number, noShowRate: number | null): NoShowRiskLevel {
    if (base === 0 || noShowRate === null) return "NO_HISTORY";
    if (base >= 2 && noShowRate >= 40) return "HIGH";
    if (noShowRate >= 20) return "MEDIUM";
    return "LOW";
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
