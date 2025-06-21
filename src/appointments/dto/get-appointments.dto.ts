import { ApiProperty } from "@nestjs/swagger";
import { Specialty } from "@prisma/client";
import { IsDate, IsEnum, IsNumber, IsPositive, IsString } from "class-validator";

class Patients {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  dni: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  last_name: string;

  @ApiProperty()
  @IsString()
  date_born: string;

  @ApiProperty()
  @IsString()
  gender: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsDate()
  createdAt: Date;
}

export class GetAppointmentsDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  patientsId: number;

  @ApiProperty({ enum: Specialty })
  @IsEnum(Specialty)
  specialty: Specialty;

  @ApiProperty()
  @IsDate()
  scheduledAt: Date;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  updatedAt: Date;

  @ApiProperty({ type: () => Patients })
  patient: Patients;
}
