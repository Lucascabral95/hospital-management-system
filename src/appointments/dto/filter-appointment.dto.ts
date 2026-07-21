import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";
import { envs } from "src/config/envs";

enum StatusAppointment {
  SCHEDULED = "SCHEDULED",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
  ALL = "ALL",
}

export class FilterAppointmentsDto {
  @IsEnum(StatusAppointment)
  @IsOptional()
  status?: StatusAppointment;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  page: number = envs.page;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  limit: number = envs.limit;
}
