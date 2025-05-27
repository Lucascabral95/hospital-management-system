import { Module } from "@nestjs/common";
import { PrescriptionsService } from "./prescriptions.service";
import { PrescriptionsController } from "./prescriptions.controller";
import { MedicalRecordsModule } from "src/medical-records/medical-records.module";

@Module({
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  imports: [MedicalRecordsModule, MedicalRecordsModule],
})
export class PrescriptionsModule {}
