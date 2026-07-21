import { AppointmentStatus, Specialty } from "@prisma/client";

/**
 * Datos de demo deterministas (sin Math.random): se generan relativos a la fecha
 * en que se ejecuta el seed para que la analítica (ventanas de "últimos N días")
 * siempre tenga datos. Pacientes 5, 12, 23 y 31 son "reincidentes" en NO_SHOW
 * para que el riesgo de ausentismo muestre niveles ALTOS.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const DOCTOR_COUNT = 19; // ids 1..19
const PATIENT_COUNT = 40; // ids 1..40
const CHRONIC_NO_SHOW_PATIENTS = [5, 12, 23, 31];

const SPECIALTIES: Specialty[] = [
  Specialty.Clinician,
  Specialty.FamilyMedicine,
  Specialty.InternalMedicine,
  Specialty.Pediatrics,
  Specialty.Surgery,
  Specialty.Neurology,
  Specialty.Psychiatry,
  Specialty.Dermatology,
  Specialty.EmergencyMedicine,
  Specialty.Cardiology,
];

interface AppointmentSeed {
  patientsId: number;
  doctorId: number;
  specialty: Specialty;
  status: AppointmentStatus;
  scheduledAt: Date;
  createdAt: Date;
  durationMinutes: number;
}

function atHour(base: number, hour: number, minute: number): Date {
  const date = new Date(base);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function pastStatus(dayOffset: number, slot: number, patientsId: number): AppointmentStatus {
  if (CHRONIC_NO_SHOW_PATIENTS.includes(patientsId)) {
    return (dayOffset + slot) % 2 === 0 ? AppointmentStatus.NO_SHOW : AppointmentStatus.COMPLETED;
  }
  if ((dayOffset * 13 + slot * 7) % 9 === 0) return AppointmentStatus.NO_SHOW;
  if ((dayOffset * 17 + slot * 5) % 11 === 0) return AppointmentStatus.CANCELLED;
  return AppointmentStatus.COMPLETED;
}

function buildAppointments(): AppointmentSeed[] {
  const seeds: AppointmentSeed[] = [];
  const now = Date.now();

  // Pasado: 60 días de historia (2 a 5 turnos por día).
  for (let dayOffset = 60; dayOffset >= 1; dayOffset--) {
    const perDay = 2 + ((dayOffset * 7) % 4);
    for (let slot = 0; slot < perDay; slot++) {
      const patientsId = ((dayOffset * 11 + slot * 7) % PATIENT_COUNT) + 1;
      const scheduledAt = atHour(now - dayOffset * DAY_MS, 8 + ((dayOffset + slot * 3) % 9), (slot % 2) * 30);
      const createdAt = new Date(scheduledAt.getTime() - (1 + ((dayOffset + slot) % 10)) * DAY_MS);

      seeds.push({
        patientsId,
        doctorId: ((dayOffset * 3 + slot * 5) % DOCTOR_COUNT) + 1,
        specialty: SPECIALTIES[(dayOffset + slot) % SPECIALTIES.length],
        status: pastStatus(dayOffset, slot, patientsId),
        scheduledAt,
        createdAt,
        durationMinutes: 30,
      });
    }
  }

  // Hoy: algunos turnos activos para la mesa en vivo (tablero muestra status != COMPLETED).
  const todayStatuses = [AppointmentStatus.IN_PROGRESS, AppointmentStatus.IN_PROGRESS, AppointmentStatus.PENDING, AppointmentStatus.SCHEDULED];
  todayStatuses.forEach((status, index) => {
    const patientsId = ((index * 9) % PATIENT_COUNT) + 1;
    seeds.push({
      patientsId,
      doctorId: ((index * 4) % DOCTOR_COUNT) + 1,
      specialty: SPECIALTIES[index % SPECIALTIES.length],
      status,
      scheduledAt: atHour(now, 9 + index, (index % 2) * 30),
      createdAt: new Date(now - 3 * DAY_MS),
      durationMinutes: 30,
    });
  });

  // Futuro: próximos 10 días (1 a 3 turnos por día). Incluye pacientes reincidentes
  // en NO_SHOW para que el endpoint de riesgo marque HIGH.
  for (let dayOffset = 1; dayOffset <= 10; dayOffset++) {
    const perDay = 1 + ((dayOffset * 5) % 3);
    for (let slot = 0; slot < perDay; slot++) {
      const useChronic = (dayOffset + slot) % 3 === 0;
      const patientsId = useChronic
        ? CHRONIC_NO_SHOW_PATIENTS[(dayOffset + slot) % CHRONIC_NO_SHOW_PATIENTS.length]
        : ((dayOffset * 11 + slot * 7) % PATIENT_COUNT) + 1;

      seeds.push({
        patientsId,
        doctorId: ((dayOffset * 5 + slot * 3) % DOCTOR_COUNT) + 1,
        specialty: SPECIALTIES[(dayOffset + slot * 2) % SPECIALTIES.length],
        status: slot % 2 === 0 ? AppointmentStatus.SCHEDULED : AppointmentStatus.PENDING,
        scheduledAt: atHour(now + dayOffset * DAY_MS, 8 + ((dayOffset + slot * 4) % 9), (slot % 2) * 30),
        createdAt: new Date(now - (1 + ((dayOffset + slot) % 5)) * DAY_MS),
        durationMinutes: 30,
      });
    }
  }

  return seeds;
}

export const appointments: AppointmentSeed[] = buildAppointments();
