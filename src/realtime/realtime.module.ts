import { Module } from "@nestjs/common";
import { RealtimeService } from "./realtime.service";
import { RealtimeGateway } from "./realtime.gateway";
import { WsJwtGuard } from "./guards/ws-jwt.guard";
import { AuthModule } from "src/auth/auth.module";
import { AppointmentsModule } from "src/appointments/appointments.module";
import { NotificationsModule } from "src/notifications/notifications.module";

@Module({
  imports: [AuthModule, AppointmentsModule, NotificationsModule],
  providers: [RealtimeGateway, RealtimeService, WsJwtGuard],
})
export class RealtimeModule {}
