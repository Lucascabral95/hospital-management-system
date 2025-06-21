import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags } from "@nestjs/swagger";
import { OnlyAdmin } from "./auth/decorators/only-admin.decorator";
import { AuthGuard } from "@nestjs/passport";

@ApiTags("Seed")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@OnlyAdmin() user: string): string {
    return this.appService.getHello();
  }

  @Get("health")
  health() {
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
