import { Module } from "@nestjs/common";
import { DoctorsService } from "./doctors.service";
import { DoctorsController } from "./doctors.controller";
import { AuthModule } from "src/auth/auth.module";

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService],
  imports: [AuthModule],
  exports: [DoctorsModule, DoctorsService],
})
export class DoctorsModule {}
