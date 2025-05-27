import { PartialType } from "@nestjs/mapped-types";
import { CreateAppointmentSocketDto } from "./create-appointment.dto";
import { Status } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateAppointmentSocketDto extends PartialType(CreateAppointmentSocketDto) {
  id: number;

  @IsEnum(Status)
  status: Status;
}
