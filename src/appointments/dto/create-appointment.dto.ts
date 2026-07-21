import { AppointmentStatus, Specialty } from "@prisma/client";
import { IsDate, IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";

export class CreateAppointmentDto {
  @IsNumber()
  @IsPositive()
  patientsId: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  doctorId?: number;

  @IsEnum(Specialty)
  @IsOptional()
  specialty?: Specialty;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsDate()
  @IsOptional()
  scheduledAt?: Date;
}
