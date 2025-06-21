import { PartialType } from "@nestjs/swagger";
import { CreateIntermentDto } from "./create-interment.dto";

export class UpdateIntermentDto extends PartialType(CreateIntermentDto) {}
