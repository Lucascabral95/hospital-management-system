import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PatientsModule } from "./patients/patients.module";
import { DoctorsModule } from "./doctors/doctors.module";
import { MedicalRecordsModule } from "./medical-records/medical-records.module";
import { PrescriptionsModule } from "./prescriptions/prescriptions.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { IntermentModule } from "./interment/interment.module";
import { PrismaModule } from "./prisma/prisma.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { envs } from "./config/envs";

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: envs.throttleTtl,
        limit: envs.throttleLimit,
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: envs.cacheTtl,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    PatientsModule,
    DoctorsModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    AppointmentsModule,
    RealtimeModule,
    IntermentModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
