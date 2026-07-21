import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AuthDto, AuthWithDoctorDto, CreateAuthDto, LoginDto, UpdateAuthDto } from "./dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { OnlyAdmin } from "./decorators/only-admin.decorator";
import { AdminAndDoctors } from "./decorators/get-user.decorator";
import { REFRESH_COOKIE_NAME, refreshCookieOptions, clearRefreshCookieOptions } from "./utils/refresh-cookie";
import { RefreshMeta } from "./refresh-token.service";

function requestMeta(req: Request): RefreshMeta {
  return {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

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
  async login(@Body() loginDto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { message, token, user, refreshToken, refreshExpiresAt } = await this.authService.login(
      loginDto,
      requestMeta(req),
    );

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(refreshExpiresAt.getTime() - Date.now()));

    return { message, token, user };
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiResponse({ status: 200, description: "Issues a new access token, rotating the refresh token" })
  @ApiResponse({ status: 401, description: "Missing, invalid, expired or reused refresh token" })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawRefreshToken) {
      res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
      throw new UnauthorizedException("Missing refresh token");
    }

    const { token, refreshToken, refreshExpiresAt } = await this.authService.refresh(rawRefreshToken, requestMeta(req));

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(refreshExpiresAt.getTime() - Date.now()));

    return { token };
  }

  @Post("logout")
  @HttpCode(200)
  @ApiResponse({ status: 200, description: "Revokes the current refresh token and clears the cookie" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await this.authService.logout(rawRefreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
    return { message: "Logout successful" };
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiResponse({ status: 200, type: AuthDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  me(@Req() req: { user: { id: number } }) {
    return this.authService.me(req.user.id);
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
