import { IsInt, IsString, Matches, Max, Min } from "class-validator";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateAvailabilityDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(TIME_REGEX, { message: "startTime must be in HH:mm format" })
  startTime: string;

  @IsString()
  @Matches(TIME_REGEX, { message: "endTime must be in HH:mm format" })
  endTime: string;
}
