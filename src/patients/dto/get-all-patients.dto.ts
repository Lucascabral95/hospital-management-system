import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsPositive, IsString } from "class-validator";

enum Gender {
  Female = "FEMALE",
  Male = "MALE",
}

export class GetAllPatientsDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty()
  @IsString()
  dni: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  last_name: string;

  @ApiProperty()
  @IsString()
  date_born: string;

  @ApiProperty()
  @IsString()
  gender: Gender;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsBoolean()
  is_admitted: boolean;

  @ApiProperty()
  @IsString()
  createdAt: Date;

  @ApiProperty()
  @IsString()
  updatedAt: Date;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  street: string;

  @ApiProperty()
  @IsString()
  zip_code: string;
}
