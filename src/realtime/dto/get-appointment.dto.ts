import { Specialty, Status } from "@prisma/client";
import { IsDate, IsEnum, IsNumber, IsPositive } from "class-validator";

export class GetAppointmentsDto {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsNumber()
  @IsPositive()
  patientsId: number;

  @IsEnum(Specialty)
  specialty: Specialty;

  @IsEnum(Status)
  status: Status;

  @IsDate()
  scheduledAt: Date;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}
