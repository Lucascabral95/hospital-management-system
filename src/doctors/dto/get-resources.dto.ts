import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class GetResourcesDto {
  @ApiProperty()
  @IsNumber()
  totalDoctors: number;

  @ApiProperty()
  @IsNumber()
  totalPatients: number;

  @ApiProperty()
  @IsNumber()
  totalInterments: number;

  @ApiProperty()
  @IsNumber()
  totalAppointments: number;
}
