import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { DoctorsService } from "./doctors.service";
import { CreateDoctorDto } from "./dto/create-doctor.dto";
import { UpdateDoctorDto } from "./dto/update-doctor.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetDoctorDto } from "./dto";

@ApiTags("Doctors")
@Controller("doctors")
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @ApiResponse({ status: 201, type: GetDoctorDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Auth not found" })
  @ApiResponse({ status: 409, description: "Licence number already exists" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  create(@Body() createDoctorDto: CreateDoctorDto) {
    try {
      const creationDoctor = this.doctorsService.create(createDoctorDto);

      return creationDoctor;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiResponse({ status: 200, type: [GetDoctorDto] })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Doctors not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.doctorsService.findAll(paginationDto);
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: GetDoctorDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Doctor not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findOne(@Param("id") id: string) {
    return this.doctorsService.findOne(+id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, type: GetDoctorDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Doctor not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(@Param("id") id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(+id, updateDoctorDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Doctor deleted successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Doctor not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  remove(@Param("id") id: string) {
    return this.doctorsService.remove(+id);
  }
}
