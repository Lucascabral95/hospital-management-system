import { Module } from "@nestjs/common";
import { MedicalRecordsService } from "./medical-records.service";
import { MedicalRecordsController } from "./medical-records.controller";
import { DoctorsModule } from "src/doctors/doctors.module";
import { PatientsModule } from "src/patients/patients.module";
import { AuthModule } from "src/auth/auth.module";

@Module({
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
  imports: [DoctorsModule, PatientsModule, AuthModule],
  exports: [MedicalRecordsService, MedicalRecordsModule],
})
export class MedicalRecordsModule {}
