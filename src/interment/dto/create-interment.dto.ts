import { DiagnosisCategory, Status } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";

export class CreateDiagnosisDto {
  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsEnum(DiagnosisCategory)
  category: DiagnosisCategory;
}

export class CreateIntermentDto {
  @IsInt()
  @IsPositive()
  doctorId: number;

  @IsInt()
  @IsPositive()
  patientId: number;

  @IsDateString()
  @IsOptional()
  dischargeDate?: Date;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDiagnosisDto)
  @IsOptional()
  diagnosis?: CreateDiagnosisDto[];
}
