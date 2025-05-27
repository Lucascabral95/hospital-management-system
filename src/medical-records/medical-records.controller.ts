import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { MedicalRecordsService } from "./medical-records.service";
import { CreateMedicalRecordDto } from "./dto/create-medical-record.dto";
import { UpdateMedicalRecordDto } from "./dto/update-medical-record.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetMedicalRecordDoctorPatientDto, GetMedicalRecordsDto } from "./dto";

@ApiTags("Medical records")
@Controller("medical-records")
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @ApiResponse({ status: 201, type: GetMedicalRecordsDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Patient or Doctor not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  create(@Body() createMedicalRecordDto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(createMedicalRecordDto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [GetMedicalRecordsDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical records not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAll() {
    return this.medicalRecordsService.findAll();
  }

  @Get("patients-doctors")
  @ApiResponse({ status: 200, type: [GetMedicalRecordDoctorPatientDto] })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical records not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAllWithPatientsAndDoctors(@Query() paginationDto: PaginationDto) {
    return this.medicalRecordsService.findAllWithPatientsAndDoctors(paginationDto);
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: GetMedicalRecordsDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical record not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findOne(@Param("id") id: string) {
    return this.medicalRecordsService.findOne(+id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, type: GetMedicalRecordsDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical record not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(@Param("id") id: string, @Body() updateMedicalRecordDto: UpdateMedicalRecordDto) {
    return this.medicalRecordsService.update(+id, updateMedicalRecordDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Medical record deleted successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical record not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  remove(@Param("id") id: string) {
    return this.medicalRecordsService.remove(+id);
  }
}
