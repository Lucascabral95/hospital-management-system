import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { BeforeApplicationShutdown, Logger } from "@nestjs/common";
import { AccessTokenVerifier } from "src/auth/services/access-token-verifier.service";
import { envs } from "src/config/envs";

@WebSocketGateway({
  namespace: "/notifications",
  cors: {
    origin: [envs.portOriginWebsocket, "https://hospital-management-system-healthsync.netlify.app"],
    credentials: true,
  },
  transports: ["websocket"],
})
export class NotificationsGateway implements OnGatewayConnection, BeforeApplicationShutdown {
  private readonly logger = new Logger("NotificationsGateway");

  @WebSocketServer() server: Server;

  constructor(private readonly accessTokenVerifier: AccessTokenVerifier) {}

  // Nest ya cierra el server de Socket.IO subyacente como parte de su propio ciclo de shutdown
  // (vía el IoAdapter); acá sólo avisamos a los clientes y los desconectamos antes de que eso pase.
  beforeApplicationShutdown() {
    if (!this.server) return;
    this.server.emit("server:shutdown");
    this.server.disconnectSockets(true);
  }

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.accessTokenVerifier.verifyAccess(token);
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
