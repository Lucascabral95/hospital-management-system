import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";
import { AuthService } from "src/auth/auth.service";
import { PayloadJwtDto } from "src/auth/dto";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException("Missing authentication token");
    }

    let payload: PayloadJwtDto;
    try {
      payload = this.jwtService.verify<PayloadJwtDto>(token);
    } catch {
      throw new WsException("Invalid or expired token");
    }

    const user = await this.authService.findOne(payload.id).catch(() => null);

    if (!user || user.is_active === false) {
      throw new WsException("User is inactive or not found");
    }

    client.data.user = payload;
    return true;
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) return authToken;

    const header = client.handshake.headers?.authorization;
    if (header?.startsWith("Bearer ")) return header.slice(7);

    return undefined;
  }
}
