import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateMedicalRecordDto {
  @IsNumber()
  @IsPositive()
  doctorId: number;

  @IsNumber()
  patientsId: number;

  @IsString()
  reasonForVisit: string;

  @IsString()
  diagnosis: string;

  @IsString()
  @IsOptional()
  treatment: string;
}
