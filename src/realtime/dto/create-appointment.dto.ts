import { IsNumber, IsPositive } from "class-validator";

export class CreateAppointmentSocketDto {
  @IsNumber()
  @IsPositive()
  patientsId: number;
}
