import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "src/auth/auth.service";
import { PayloadJwtDto } from "src/auth/dto";
import { envs } from "src/config/envs";

@WebSocketGateway({
  namespace: "/notifications",
  cors: {
    origin: [envs.portOriginWebsocket, "https://hospital-management-system-healthsync.netlify.app"],
    credentials: true,
  },
  transports: ["websocket"],
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger("NotificationsGateway");

  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<PayloadJwtDto>(token);
      const user = await this.authService.findOne(payload.id);

      if (!user || user.is_active === false) {
        client.disconnect();
        return;
      }

      client.data.authId = payload.id;
      await client.join(`user:${payload.id}`);
    } catch {
      client.disconnect();
    }
  }

  emitToUser(authId: number, notification: unknown) {
    this.server.to(`user:${authId}`).emit("notification", notification);
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) return authToken;

    const header = client.handshake.headers?.authorization;
    if (header?.startsWith("Bearer ")) return header.slice(7);

    return undefined;
  }
}
