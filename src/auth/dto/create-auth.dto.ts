import { IsEmail, IsEnum, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";
import { RoleAccess } from "../common/enums";

export class CreateAuthDto {
  @IsString()
  full_name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsEnum(RoleAccess)
  @IsNotEmpty()
  role: RoleAccess;
}
