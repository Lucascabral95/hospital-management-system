import { PartialType } from "@nestjs/mapped-types";
import { CreateAuthDto } from "./create-auth.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateAuthDto extends PartialType(CreateAuthDto) {
  @IsBoolean()
  @IsOptional()
  status: boolean;
}
