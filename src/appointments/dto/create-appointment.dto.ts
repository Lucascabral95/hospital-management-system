import { Specialty, Status } from "@prisma/client";
import { IsDate, IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";

export class CreateAppointmentDto {
  @IsNumber()
  @IsPositive()
  patientsId: number;

  @IsEnum(Specialty)
  @IsOptional()
  specialty?: Specialty;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsDate()
  @IsOptional()
  scheduledAt?: Date;
}
