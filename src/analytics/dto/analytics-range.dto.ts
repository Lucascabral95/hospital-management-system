import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class AnalyticsRangeDto {
  @IsInt()
  @Min(1)
  @Max(90)
  @Type(() => Number)
  @IsOptional()
  days: number = 14;
}
