import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { GetMedicalRecordsDto } from "src/medical-records/dto";

export class GetPrescriptionWithMedicalRecordDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  medicalRecordId: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  medication: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  dosage: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  duration: string;

  @ApiProperty()
  @IsString()
  createdAt: Date;

  @ApiProperty()
  @IsString()
  updatedAt: Date;

  @ApiProperty({ type: () => GetMedicalRecordsDto })
  MedicalRecord: GetMedicalRecordsDto;
}
