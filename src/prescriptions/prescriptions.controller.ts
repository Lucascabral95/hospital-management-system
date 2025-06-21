import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { PrescriptionsService } from "./prescriptions.service";
import { CreatePrescriptionDto } from "./dto/create-prescription.dto";
import { UpdatePrescriptionDto } from "./dto/update-prescription.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetPrescriptionDto, GetPrescriptionWithMedicalRecordDto } from "./dto";
import { AdminAndDoctors } from "src/auth/decorators/get-user.decorator";
import { AuthGuard } from "@nestjs/passport";
import { OnlyAdmin } from "src/auth/decorators/only-admin.decorator";

@ApiTags("Prescriptions")
@Controller("prescriptions")
@UseGuards(AuthGuard("jwt"))
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @ApiResponse({ status: 201, type: GetPrescriptionDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Medical record not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  create(@AdminAndDoctors() user: string, @Body() createPrescriptionDto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(createPrescriptionDto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [GetPrescriptionWithMedicalRecordDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Prescriptions not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAll(@AdminAndDoctors() user: string) {
    return this.prescriptionsService.findAll();
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: GetPrescriptionWithMedicalRecordDto })
  @ApiResponse({ status: 404, description: "Medical record not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findOne(@AdminAndDoctors() user: string, @Param("id") id: string) {
    return this.prescriptionsService.findOne(+id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, type: GetPrescriptionDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Prescription not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  update(@OnlyAdmin() user: string, @Param("id") id: string, @Body() updatePrescriptionDto: UpdatePrescriptionDto) {
    return this.prescriptionsService.update(+id, updatePrescriptionDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Prescription deleted successfully" })
  @ApiResponse({ status: 404, description: "Prescription not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  remove(@OnlyAdmin() user: string, @Param("id") id: string) {
    return this.prescriptionsService.remove(+id);
  }
}
