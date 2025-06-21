import { DiagnosisCategory } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class PatchDiagnosisDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiagnosisCategory)
  @IsOptional()
  category?: DiagnosisCategory;
}
