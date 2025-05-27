import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { PatientsService } from "./patients.service";
import { CreatePatientDto, PatientsDto, UpdatePatientDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Patients")
@Controller("patients")
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [PatientsDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Patients not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.patientsService.findAll(paginationDto);
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: PatientsDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Patient not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findOne(@Param("id") id: number) {
    return this.patientsService.findOne(+id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, type: CreatePatientDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Patient not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  update(@Param("id") id: number, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(+id, updatePatientDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Patient deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Patient not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  remove(@Param("id") id: number) {
    return this.patientsService.remove(+id);
  }

  @Post("seed")
  seed() {
    return this.patientsService.seed();
  }
}
