import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from "@nestjs/common";
import { IntermentService } from "./interment.service";
import { CreateDiagnosisDto, CreateIntermentDto } from "./dto/create-interment.dto";
import { UpdateIntermentDto } from "./dto/update-interment.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { Status } from "@prisma/client";
import { GetDiagnosisDto, GetIntermentDto, PatchDiagnosisDto } from "./dto";
import { AuthGuard } from "@nestjs/passport";
import { AdminAndDoctors } from "src/auth/decorators/get-user.decorator";

@ApiTags("interment")
@Controller("interment")
@UseGuards(AuthGuard("jwt"))
export class IntermentController {
  constructor(private readonly intermentService: IntermentService) {}

  @Post()
  @ApiResponse({ status: 201, type: CreateIntermentDto })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  create(@AdminAndDoctors() user: string, @Body() createIntermentDto: CreateIntermentDto) {
    return this.intermentService.create(createIntermentDto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [GetIntermentDto] })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  findAll(@AdminAndDoctors() user: string, @Query() paginationDto: PaginationDto) {
    return this.intermentService.findAll(paginationDto);
  }

  @Get("diagnosis")
  @ApiResponse({ status: 200, type: [GetDiagnosisDto] })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  getAllDiagnosis(@AdminAndDoctors() user: string) {
    return this.intermentService.getAllDiagnosis();
  }

  @Get("diagnosis/:id")
  @ApiResponse({ status: 200, type: GetDiagnosisDto })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  getDiagnosisById(@AdminAndDoctors() user: string, @Param("id") id: string) {
    return this.intermentService.getDiagnosisById(+id);
  }

  @Patch("diagnosis/:id")
  @ApiResponse({ status: 200, type: PatchDiagnosisDto })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  updateDiagnosisById(
    @AdminAndDoctors() user: string,
    @Param("id") diagnosisId: number,
    @Body() updateDiagnosisDto: PatchDiagnosisDto,
  ) {
    return this.intermentService.updateDiagnosisById(+diagnosisId, updateDiagnosisDto);
  }

  @Post("diagnosis/:id")
  @ApiResponse({ status: 201, type: GetDiagnosisDto })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  addDiagnosisInInterment(
    @AdminAndDoctors() user: string,
    @Param("id") intermentId: number,
    @Body() createDiagnosisDto: CreateDiagnosisDto,
  ) {
    return this.intermentService.addDiagnosisInInterment(+intermentId, createDiagnosisDto);
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: GetIntermentDto })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  findOne(@AdminAndDoctors() user: string, @Param("id") id: string) {
    return this.intermentService.findOne(+id);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, type: UpdateIntermentDto })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  update(@AdminAndDoctors() user: string, @Param("id") id: string, @Body() updateIntermentDto: UpdateIntermentDto) {
    return this.intermentService.update(+id, updateIntermentDto);
  }

  @Patch(":id/:status")
  @ApiResponse({ status: 200, type: UpdateIntermentDto })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  updateStatus(@AdminAndDoctors() user: string, @Param("id") id: number, @Param("status") status: Status) {
    return this.intermentService.updateStatus(+id, status);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Interment deleted successfully" })
  @ApiResponse({ status: 400, description: `Interment with #id not found` })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  remove(@AdminAndDoctors() user: string, @Param("id") id: string) {
    return this.intermentService.remove(+id);
  }
}
