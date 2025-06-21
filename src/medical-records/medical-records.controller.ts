import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from "@nestjs/common";
import { MedicalRecordsService } from "./medical-records.service";
import { CreateMedicalRecordDto } from "./dto/create-medical-record.dto";
import { UpdateMedicalRecordDto } from "./dto/update-medical-record.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetMedicalRecordDoctorPatientDto, GetMedicalRecordsDto } from "./dto";
import { AuthGuard } from "@nestjs/passport";
import { AdminAndDoctors } from "src/auth/decorators/get-user.decorator";
import { OnlyAdmin } from "src/auth/decorators/only-admin.decorator";

@ApiTags("Medical records")
@Controller("medical-records")
@UseGuards(AuthGuard("jwt"))
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @ApiResponse({ status: 201, type: GetMedicalRecordsDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Patient or Doctor not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  create(@AdminAndDoctors() user: string, @Body() createMedicalRecordDto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(createMedicalRecordDto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [GetMedicalRecordsDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical records not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAll(@AdminAndDoctors() user: string) {
    return this.medicalRecordsService.findAll();
  }

  @Get("patients-doctors")
  @ApiResponse({ status: 200, type: [GetMedicalRecordDoctorPatientDto] })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical records not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAllWithPatientsAndDoctors(@AdminAndDoctors() user: string, @Query() paginationDto: PaginationDto) {
    return this.medicalRecordsService.findAllWithPatientsAndDoctors(paginationDto);
  }

  @Get(":id/patient")
  @ApiResponse({ status: 200, type: [GetMedicalRecordDoctorPatientDto] })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical records not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findMedicalRecordsByPatientId(
    @AdminAndDoctors() user: string,
    @Param("id") id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.medicalRecordsService.findMedicalRecordsByPatientId(+id, paginationDto);
  }

  @Get(":id/doctor")
  @ApiResponse({ status: 200, type: [GetMedicalRecordDoctorPatientDto] })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical records not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findMedicalRecordsByDoctorId(
    @AdminAndDoctors() user: string,
    @Param("id") id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.medicalRecordsService.findMedicalRecordsByDoctorId(+id, paginationDto);
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: GetMedicalRecordsDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical record not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findOne(@AdminAndDoctors() user: string, @Param("id") id: string) {
    return this.medicalRecordsService.findOne(+id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, type: GetMedicalRecordsDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical record not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(@OnlyAdmin() user: string, @Param("id") id: string, @Body() updateMedicalRecordDto: UpdateMedicalRecordDto) {
    return this.medicalRecordsService.update(+id, updateMedicalRecordDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Medical record deleted successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical record not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  remove(@OnlyAdmin() user: string, @Param("id") id: string) {
    return this.medicalRecordsService.remove(+id);
  }
}
