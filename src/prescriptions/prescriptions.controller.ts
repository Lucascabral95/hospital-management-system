import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { PrescriptionsService } from "./prescriptions.service";
import { CreatePrescriptionDto } from "./dto/create-prescription.dto";
import { UpdatePrescriptionDto } from "./dto/update-prescription.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetPrescriptionDto, GetPrescriptionWithMedicalRecordDto } from "./dto";

@ApiTags("Prescriptions")
@Controller("prescriptions")
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @ApiResponse({ status: 201, type: GetPrescriptionDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical record not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  create(@Body() createPrescriptionDto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(createPrescriptionDto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [GetPrescriptionWithMedicalRecordDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Prescriptions not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAll() {
    return this.prescriptionsService.findAll();
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: GetPrescriptionWithMedicalRecordDto })
  @ApiResponse({ status: 404, description: "Medical record not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findOne(@Param("id") id: string) {
    return this.prescriptionsService.findOne(+id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, type: GetPrescriptionDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Prescription not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  update(@Param("id") id: string, @Body() updatePrescriptionDto: UpdatePrescriptionDto) {
    return this.prescriptionsService.update(+id, updatePrescriptionDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Prescription deleted successfully" })
  @ApiResponse({ status: 404, description: "Prescription not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  remove(@Param("id") id: string) {
    return this.prescriptionsService.remove(+id);
  }
}
