import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsBoolean } from "class-validator";
import { AuthWithDoctorDto } from "src/auth/dto";
import { PatientsDto } from "src/patients/dto";

export class GetMedicalRecordDoctorPatientDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  doctorId: number;

  @ApiProperty()
  @IsDateString()
  date: string;

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
  createdAt: string;

  @ApiProperty()
  @IsDateString()
  updatedAt: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  patientsId: number;

  @ApiProperty({
    type: () => AuthWithDoctorDto,
  })
  Doctor: AuthWithDoctorDto;

  @ApiProperty({
    type: () => PatientsDto,
  })
  Patients: PatientsDto;
}
