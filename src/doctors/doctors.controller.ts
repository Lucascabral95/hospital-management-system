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
  UseGuards,
} from "@nestjs/common";
import { DoctorsService } from "./doctors.service";
import { CreateDoctorDto } from "./dto/create-doctor.dto";
import { UpdateDoctorDto } from "./dto/update-doctor.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetDoctorDto, GetResourcesDto } from "./dto";
import { GetPatientsOfDoctorByIDDto } from "./dto/get-patients-of-doctor-by-id.dto";
import { AuthGuard } from "@nestjs/passport";
import { AdminAndDoctors } from "src/auth/decorators/get-user.decorator";

@ApiTags("Doctors")
@Controller("doctors")
@UseGuards(AuthGuard("jwt"))
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @ApiResponse({ status: 201, type: GetDoctorDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Auth not found" })
  @ApiResponse({ status: 409, description: "Licence number already exists" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  create(@AdminAndDoctors() user: string, @Body() createDoctorDto: CreateDoctorDto) {
    try {
      const creationDoctor = this.doctorsService.create(createDoctorDto);

      return creationDoctor;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get("select")
  findAllSelect(@AdminAndDoctors() user: string) {
    return this.doctorsService.findAllSelect();
  }

  @Get()
  @ApiResponse({ status: 200, type: [GetDoctorDto] })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Doctors not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAll(@AdminAndDoctors() user: string, @Query() paginationDto: PaginationDto) {
    return this.doctorsService.findAll(paginationDto);
  }

  @Get(":id/patients")
  @ApiResponse({ status: 200, type: GetPatientsOfDoctorByIDDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Doctor not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findPatientsOfDoctorById(@AdminAndDoctors() user: string, @Param("id") doctorId: number) {
    return this.doctorsService.findPatientsOfDoctorById(+doctorId);
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: GetDoctorDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Doctor not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findOne(@AdminAndDoctors() user: string, @Param("id") id: string) {
    return this.doctorsService.findOne(+id);
  }

  @Get("dashboard/resources")
  @ApiResponse({ status: 200, description: "Total resources", type: GetResourcesDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  totalResource(@AdminAndDoctors() user: string) {
    return this.doctorsService.totalResource();
  }

  @Patch(":id")
  @ApiResponse({ status: 200, type: GetDoctorDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Doctor not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  update(@AdminAndDoctors() user: string, @Param("id") id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(+id, updateDoctorDto);
  }

  @Delete(":id")
  @ApiResponse({ status: 200, description: "Doctor deleted successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Doctor not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  remove(@AdminAndDoctors() user: string, @Param("id") id: string) {
    return this.doctorsService.remove(+id);
  }
}
