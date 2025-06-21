import { DiagnosisCategory } from "@prisma/client";
import { IsEnum, IsNumber, IsString } from "class-validator";

export class CreateDiagnosisSingleDto {
  @IsNumber()
  intermentId: number;

  @IsString()
  description: string;

  @IsString()
  code: string;

  @IsEnum(DiagnosisCategory)
  category: DiagnosisCategory;
}
