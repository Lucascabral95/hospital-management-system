import { IsNumber, IsString } from "class-validator";

export class CreateDoctorDto {
  @IsString()
  specialty: string;

  @IsNumber()
  licenceNumber: number;

  @IsNumber()
  authId: number;
}
