import { AppointmentStatus, Specialty } from "@prisma/client";
import { IsDate, IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";

export class GetAppointmentsDto {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsNumber()
  @IsPositive()
  patientsId: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  doctorId?: number | null;

  @IsEnum(Specialty)
  specialty: Specialty;

  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsDate()
  scheduledAt: Date;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}
