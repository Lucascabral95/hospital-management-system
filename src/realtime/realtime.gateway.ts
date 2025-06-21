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
import { Logger, UsePipes, ValidationPipe } from "@nestjs/common";
import { CreateAppointmentSocketDto } from "./dto";
import { envs } from "src/config/envs";

@WebSocketGateway({
  cors: {
    origin: ["https://hospital-management-system-healthsync.netlify.app"],
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
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger("AppintmentsGateway");

  constructor(private readonly realtimeService: RealtimeService) {}
  handleConnection(client: any, ...args: any[]) {
    this.logger.log("Client connected", client.id);
  }

  handleDisconnect(client: any) {
    this.logger.log("Client disconnected", client.id);
  }

  @WebSocketServer() server: Server;

  @SubscribeMessage("createAppointment")
  async create(@MessageBody() createRealtimeDto: CreateAppointmentSocketDto) {
    const createdAppointment = await this.realtimeService.create(createRealtimeDto);
    this.server.emit("createdAppointments", createdAppointment);

    return createdAppointment;
  }

  @SubscribeMessage("getAppointments")
  async findAll(@ConnectedSocket() socket: Socket) {
    const results = await this.realtimeService.findAll();
    socket.emit("getAppointments", results);

    return results;
  }

  @SubscribeMessage("updateStatusInProgress")
  updateStatusInProgress(@MessageBody() id: number) {
    this.server.emit("updatedAppointmentStatusInProgress", id);

    return this.realtimeService.updateStatusInProgress(id);
  }

  @SubscribeMessage("updateStatusCompleted")
  updateStatusCompleted(@MessageBody() id: number) {
    this.server.emit("updatedAppointmentStatusCompleted", id);

    return this.realtimeService.updateStatusCompleted(id);
  }

  @SubscribeMessage("removeAppointment")
  remove(@MessageBody() id: number) {
    this.server.emit("deletedAppointment", id);

    return this.realtimeService.remove(id);
  }
}
