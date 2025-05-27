import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class GetMedicalRecordsDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  id: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  doctorId: number;

  @ApiProperty()
  @IsDateString()
  date: Date;

  @ApiProperty()
  @IsString()
  reasonForVisit: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  diagnosis: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  treatment: string;

  @ApiProperty()
  @IsDateString()
  createdAt: Date;

  @ApiProperty()
  @IsDateString()
  updatedAt: Date;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  patientsId: number;
}
