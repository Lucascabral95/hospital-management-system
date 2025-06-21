import { IsEnum, IsOptional } from "class-validator";

enum StatusAppointment {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ALL = "ALL",
}

export class FilterAppointmentsDto {
  @IsEnum(StatusAppointment)
  status?: StatusAppointment;
}
