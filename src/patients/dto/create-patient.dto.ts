import { Gender } from "@prisma/client";
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

export class CreatePatientDto {
  @IsString()
  dni: string;

  @IsString()
  name: string;

  @IsString()
  last_name: string;

  @IsString()
  date_born: string;

  @IsEnum(Gender)
  @IsString()
  gender: Gender;

  @IsString()
  phone: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsBoolean()
  @IsOptional()
  is_admitted: boolean;

  @IsString()
  @IsOptional()
  street: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  state: string;

  @IsString()
  @IsOptional()
  zip_code: string;

  @IsString()
  @IsOptional()
  country: string;
}
