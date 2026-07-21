import { Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { AppService } from "./app.service";
import { ApiTags } from "@nestjs/swagger";
import { OnlyAdmin } from "./auth/decorators/only-admin.decorator";
import { AuthGuard } from "@nestjs/passport";
import { isShuttingDown } from "./common/lifecycle/shutdown-state";

@ApiTags("Seed")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@OnlyAdmin() user: string): string {
    return this.appService.getHello();
  }

  @Get("health")
  health(@Res({ passthrough: true }) res: Response) {
    if (isShuttingDown()) {
      res.status(503);
      return { status: "shutting_down", timestamp: new Date().toISOString() };
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Post("/create/seed/global")
  @UseGuards(AuthGuard("jwt"))
  seed(@OnlyAdmin() user: string) {
    return this.appService.createSeed();
  }
}
