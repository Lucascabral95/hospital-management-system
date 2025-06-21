import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsEmail, IsNumber, IsPositive, IsString, ValidateNested } from "class-validator";

export class Patients {
  @IsNumber()
  id: number;

  @IsString()
  dni: string;

  @IsString()
  name: string;

  @IsString()
  last_name: string;

  @IsDate()
  date_born: Date;

  @IsString()
  gender: string;

  @IsString()
  phone: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsBoolean()
  is_admitted: boolean;

  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zip_code: string;

  @IsString()
  country: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}

export class MedicalRecord {
  @IsNumber()
  id: number;

  @IsNumber()
  doctorId: number;

  @IsDate()
  date: Date;

  @IsString()
  reasonForVisit: string;

  @IsString()
  diagnosis: string;

  @IsString()
  treatment: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsNumber()
  patientsId: number;

  @ValidateNested()
  @Type(() => Patients)
  Patients: Patients;
}

export class GetPatientsOfDoctorByIDDto {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsString()
  specialty: string;

  @IsNumber()
  licenceNumber: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsNumber()
  authId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalRecord)
  medicalRecords: MedicalRecord[];
}
