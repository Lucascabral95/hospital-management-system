import { IsNumber, IsPositive, IsString } from "class-validator";

export class SelectPatientDto {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsString()
  name: string;

  @IsString()
  last_name: string;

  @IsString()
  dni: string;
}
