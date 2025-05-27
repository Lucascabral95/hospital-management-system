import { Module } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { AppointmentsController } from "./appointments.controller";
import { PatientsModule } from "src/patients/patients.module";

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  imports: [PatientsModule],
  exports: [AppointmentsService, AppointmentsModule],
})
export class AppointmentsModule {}
