import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  GetAppointmentsDto,
  FilterAppointmentsDto,
  GetSlotsDto,
  RescheduleAppointmentDto,
} from "./dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Specialty } from "@prisma/client";

@ApiTags("Appointments")
@Controller("appointments")
@UseGuards(AuthGuard("jwt"))
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

  @Get("doctors")
  @ApiResponse({ status: 200, description: "Doctors available for a given specialty" })
  getDoctorsBySpecialty(@Query("specialty") specialty?: Specialty) {
    return this.appointmentsService.getDoctorsBySpecialty(specialty);
  }

  @Get("slots")
  @ApiResponse({ status: 200, description: "Free slots for a doctor on a given date" })
  getAvailableSlots(@Query() getSlotsDto: GetSlotsDto) {
    return this.appointmentsService.getAvailableSlots(getSlotsDto);
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

  @Patch(":id/cancel")
  @ApiResponse({ status: 200, type: GetAppointmentsDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Appointment not found" })
  cancel(@Param("id") id: string) {
    return this.appointmentsService.cancel(+id);
  }

  @Patch(":id/reschedule")
  @ApiResponse({ status: 200, type: GetAppointmentsDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Appointment not found" })
  @ApiResponse({ status: 400, description: "Slot no longer available" })
  reschedule(@Param("id") id: string, @Body() rescheduleAppointmentDto: RescheduleAppointmentDto) {
    return this.appointmentsService.reschedule(+id, rescheduleAppointmentDto.scheduledAt);
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
