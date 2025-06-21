import { Gender, Status } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { envs } from "src/config/envs";

export class PaginationDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  page: number = envs.page;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  @IsOptional()
  limit: number = envs.limit;

  @IsString()
  @IsOptional()
  sortedBy?: string;

  @IsString()
  @IsOptional()
  order?: string;

  @IsEnum(Gender)
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  gender?: Gender;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
