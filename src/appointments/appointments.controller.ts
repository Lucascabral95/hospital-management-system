import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto, UpdateAppointmentDto, GetAppointmentsDto, FilterAppointmentsDto } from "./dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Appointments")
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiResponse({ status: 201, type: GetAppointmentsDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Patient or doctor not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  @ApiResponse({ status: 409, description: "Appointment conflict" })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [GetAppointmentsDto] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Appointments not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAll(@Query() filterAppointmentDto: FilterAppointmentsDto) {
    return this.appointmentsService.findAll(filterAppointmentDto);
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: GetAppointmentsDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Appointment not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findOne(@Param("id") id: string) {
    return this.appointmentsService.findOne(+id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, type: GetAppointmentsDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Appointment not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  update(@Param("id") id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(+id, updateAppointmentDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Appointment deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Appointment not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  remove(@Param("id") id: string) {
    return this.appointmentsService.remove(+id);
  }
}
