import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePrescriptionDto {
  @IsNumber()
  @IsOptional()
  medicalRecordId: number;

  @IsString()
  @IsOptional()
  medication: string;

  @IsString()
  @IsOptional()
  dosage: string;

  @IsString()
  @IsOptional()
  duration: string;
}
