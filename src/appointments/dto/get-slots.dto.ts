import { Type } from "class-transformer";
import { IsDateString, IsNumber, IsPositive } from "class-validator";

export class GetSlotsDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  doctorId: number;

  @IsDateString()
  date: string;
}
