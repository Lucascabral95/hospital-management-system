import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto, AuthWithDoctorDto, CreateAuthDto, LoginDto, UpdateAuthDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { OnlyAdmin } from "./decorators/only-admin.decorator";
import { AdminAndDoctors } from "./decorators/get-user.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @UseGuards(AuthGuard("jwt"))
  @ApiResponse({ status: 201, type: AuthDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 409, description: "User already exists" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  register(@OnlyAdmin() user: string, @Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post("login")
  @ApiResponse({ status: 200, type: AuthDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get()
  @UseGuards(AuthGuard("jwt"))
  @ApiResponse({ status: 200, type: [AuthWithDoctorDto] })
  @ApiResponse({ status: 404, description: "Users not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findAll(@AdminAndDoctors() user: string, @Query() paginationDto: PaginationDto) {
    return this.authService.findAll(paginationDto);
  }

  @Get(":id")
  @UseGuards(AuthGuard("jwt"))
  @ApiResponse({ status: 200, type: AuthWithDoctorDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  findOne(@AdminAndDoctors() user: string, @Param("id", ParseIntPipe) id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard("jwt"))
  @ApiResponse({ status: 200, type: AuthDto })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  update(@OnlyAdmin() user: string, @Param("id") id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard("jwt"))
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  remove(@OnlyAdmin() user: string, @Param("id") id: string) {
    return this.authService.remove(+id);
  }
}
