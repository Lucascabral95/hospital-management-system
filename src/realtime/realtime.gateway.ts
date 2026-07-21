import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { RealtimeService } from "./realtime.service";
import { Server, Socket } from "socket.io";
import { BeforeApplicationShutdown, Logger, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { CreateAppointmentSocketDto } from "./dto";
import { envs } from "src/config/envs";
import { WsJwtGuard } from "./guards/ws-jwt.guard";
import { AppointmentsService } from "src/appointments/appointments.service";
import { RescheduleAppointmentDto } from "src/appointments/dto";
import { NotificationsService } from "src/notifications/notifications.service";

@WebSocketGateway({
  cors: {
    origin: [envs.portOriginWebsocket, "https://hospital-management-system-healthsync.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket"],
  allowUpgrades: false,
  perMessageDeflate: false,
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, BeforeApplicationShutdown {
  private readonly logger = new Logger("AppintmentsGateway");

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly appointmentsService: AppointmentsService,
    private readonly notificationsService: NotificationsService,
  ) {}
  handleConnection(client: any, ...args: any[]) {
    this.logger.log("Client connected", client.id);
  }

  handleDisconnect(client: any) {
    this.logger.log("Client disconnected", client.id);
  }

  @WebSocketServer() server: Server;

  // Corre antes de que Nest cierre el server HTTP (y, con él, el de Socket.IO vía el IoAdapter),
  // así que todavía hay tiempo de avisar a los clientes y desconectarlos antes de que
  // PrismaService se desconecte en onApplicationShutdown.
  beforeApplicationShutdown() {
    if (!this.server) return;
    this.server.emit("server:shutdown");
    this.server.disconnectSockets(true);
  }

  // Public on purpose: the unauthenticated patient page (/appointments/patient) requests appointments this way.
  @SubscribeMessage("createAppointment")
  async create(@MessageBody() createRealtimeDto: CreateAppointmentSocketDto) {
    const createdAppointment = await this.realtimeService.create(createRealtimeDto);
    this.server.emit("createdAppointments", createdAppointment);

    if (createdAppointment.doctorId) {
      this.notificationsService
        .notifyDoctorOfAppointment(
          createdAppointment.doctorId,
          createdAppointment.id,
          "Nuevo turno agendado",
          `Se agendó un nuevo turno de ${createdAppointment.specialty} para el ${new Date(
            createdAppointment.scheduledAt,
          ).toLocaleString("es-AR")}.`,
        )
        .catch(() => this.logger.warn("Could not notify doctor of new appointment"));
    }

    return createdAppointment;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("getAppointments")
  async findAll(@ConnectedSocket() socket: Socket) {
    const results = await this.realtimeService.findAll();
    socket.emit("getAppointments", results);

    return results;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("updateStatusInProgress")
  async updateStatusInProgress(@MessageBody() id: number) {
    const updated = await this.realtimeService.updateStatusInProgress(id);
    this.server.emit("updatedAppointmentStatusInProgress", updated.id);

    return updated;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("updateStatusCompleted")
  async updateStatusCompleted(@MessageBody() id: number) {
    const updated = await this.realtimeService.updateStatusCompleted(id);
    this.server.emit("updatedAppointmentStatusCompleted", updated.id);

    return updated;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("removeAppointment")
  async remove(@MessageBody() id: number) {
    const result = await this.realtimeService.remove(id);
    this.server.emit("deletedAppointment", id);

    return result;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("cancelAppointment")
  async cancel(@MessageBody() id: number) {
    const updated = await this.appointmentsService.cancel(id);
    this.server.emit("cancelledAppointment", updated.id);

    return updated;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("rescheduleAppointment")
  async reschedule(@MessageBody() payload: { id: number } & RescheduleAppointmentDto) {
    const updated = await this.appointmentsService.reschedule(payload.id, payload.scheduledAt);
    this.server.emit("rescheduledAppointment", updated);

    return updated;
  }
}
