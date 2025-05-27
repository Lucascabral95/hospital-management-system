import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class GetPrescriptionDto {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsNumber()
  @IsPositive()
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

  @IsString()
  createdAt: Date;

  @IsString()
  updatedAt: Date;
}
