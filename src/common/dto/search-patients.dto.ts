import { IsOptional, IsString } from "class-validator";

export class QueryNameLastNameDto {
  @IsString()
  @IsOptional()
  patient: string;
}
