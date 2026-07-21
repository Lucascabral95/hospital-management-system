import { IsBoolean, IsEmail, IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { RoleAccess } from "@prisma/client";

export class PayloadJwtDto {
  @IsNumber()
  id: number;

  @IsString()
  full_name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsEnum(RoleAccess)
  @IsNotEmpty()
  role: RoleAccess;

  @IsBoolean()
  is_active: boolean;

  @IsOptional()
  @IsIn(["access"])
  type?: "access";
}
