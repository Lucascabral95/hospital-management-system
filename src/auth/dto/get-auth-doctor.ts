import { ApiProperty } from "@nestjs/swagger";
import { RoleAccess } from "@prisma/client";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AuthDto } from "./auth-dto";

export class AuthWithDoctorDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  full_name: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsEnum(RoleAccess)
  @IsNotEmpty()
  role: RoleAccess;

  @ApiProperty()
  @IsBoolean()
  is_active: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  createdAt?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  updatedAt?: string;

  @ApiProperty({ type: [AuthDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthDto)
  Doctor: AuthDto[];
}
