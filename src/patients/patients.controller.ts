import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from "@nestjs/common";
import { PatientsService } from "./patients.service";
import { CreatePatientDto, PatientsDto, UpdatePatientDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AdminAndDoctors } from "src/auth/decorators/get-user.decorator";
import { OnlyAdmin } from "src/auth/decorators/only-admin.decorator";
import { GetAllPatientsDto } from "./dto/get-all-patients.dto";
import { QueryNameLastNameDto } from "src/common/dto/search-patients.dto";

@ApiTags("Patients")
@Controller("patients")
@UseGuards(AuthGuard("jwt"))
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiResponse({ status: 201, type: PatientsDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  create(@OnlyAdmin() user: string, @Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get("select")
  @ApiResponse({ status: 200, type: [PatientsDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Patients not found" })
  findAllSelect(@AdminAndDoctors() user: string) {
    return this.patientsService.findAllSelect();
  }

  @Get()
  @ApiResponse({ status: 200, type: [PatientsDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Patients not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAll(@AdminAndDoctors() user: string, @Query() paginationDto: PaginationDto) {
    return this.patientsService.findAll(paginationDto);
  }

  @Get("search")
  @ApiResponse({ status: 200, type: [GetAllPatientsDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Patients not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAllPatientsWithoutPagination(@AdminAndDoctors() user: string, @Query() patient: QueryNameLastNameDto) {
    return this.patientsService.findAllPatientsWithoutPagination(patient.patient);
  }

  @Get("dni/:dni")
  findByDni(@Param("dni") dni: string) {
    return this.patientsService.findByDni(dni);
  }

  @Get(":id/medical-records")
  getMedicalRecordsByPatientId(@AdminAndDoctors() user: string, @Param("id") id: number) {
    return this.patientsService.getMedicalRecordsByPatientId(+id);
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: PatientsDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Patient not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findOne(@AdminAndDoctors() user: string, @Param("id") id: number) {
    return this.patientsService.findOne(+id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, type: CreatePatientDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Patient not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  update(@OnlyAdmin() user: string, @Param("id") id: number, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(+id, updatePatientDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Patient deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Patient not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  remove(@OnlyAdmin() user: string, @Param("id") id: number) {
    return this.patientsService.remove(+id);
  }

  @Post("seed")
  seed(@OnlyAdmin() user: string) {
    return this.patientsService.seed();
  }
}
