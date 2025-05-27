import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsPositive, IsString } from "class-validator";

export class GetDoctorDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty()
  @IsString()
  specialty: string;

  @ApiProperty()
  @IsString()
  licenceNumber: string;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  updatedAt: Date;
}
