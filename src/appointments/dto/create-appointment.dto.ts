import { IsNumber, IsPositive } from "class-validator";

export class CreateAppointmentDto {
  @IsNumber()
  @IsPositive()
  patientsId: number;
}
