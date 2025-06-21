import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PatientsModule } from "./patients/patients.module";
import { DoctorsModule } from "./doctors/doctors.module";
import { MedicalRecordsModule } from "./medical-records/medical-records.module";
import { PrescriptionsModule } from "./prescriptions/prescriptions.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { IntermentModule } from './interment/interment.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PatientsModule,
    DoctorsModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    AppointmentsModule,
    RealtimeModule,
    IntermentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
