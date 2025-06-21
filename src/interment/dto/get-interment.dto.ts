import { Status, DiagnosisCategory } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class GetDiagnosisDto {
  @IsNumber()
  id: number;

  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsEnum(DiagnosisCategory)
  category: DiagnosisCategory;

  @IsDateString()
  date: Date;
}

export class GetIntermentDto {
  @IsNumber()
  id: number;

  @IsInt()
  doctorId: number;

  @IsInt()
  patientId: number;

  @IsDateString()
  admissionDate: Date;

  @IsDateString()
  @IsOptional()
  dischargeDate?: Date;

  @IsEnum(Status)
  status: Status;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GetDiagnosisDto)
  @IsOptional()
  diagnosis?: GetDiagnosisDto[];
}
