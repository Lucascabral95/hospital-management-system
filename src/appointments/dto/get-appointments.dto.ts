import { ApiProperty } from "@nestjs/swagger";
import { Specialty } from "@prisma/client";
import { IsDate, IsEnum, IsNumber, IsPositive } from "class-validator";

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
}
