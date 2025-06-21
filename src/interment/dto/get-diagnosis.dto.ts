import { IsDate, IsEnum, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { Status } from "@prisma/client";

class GetDiagnosisDetailDto {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsNumber()
  @IsPositive()
  doctorId: number;

  @IsNumber()
  @IsPositive()
  patientId: number;

  @IsDate()
  admissionDate: Date;

  @IsDate()
  @IsOptional()
  dischargeDate?: Date;

  @IsEnum(Status)
  status: Status;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}

export class GetDiagnosisDto {
  @IsString()
  message: string;

  createdDiagnosis: GetDiagnosisDetailDto;
}
