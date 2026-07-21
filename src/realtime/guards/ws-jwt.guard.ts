import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { AccessTokenVerifier } from "src/auth/services/access-token-verifier.service";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly accessTokenVerifier: AccessTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException("Missing authentication token");
    }

    try {
      const payload = await this.accessTokenVerifier.verifyAccess(token);
      client.data.user = payload;
    } catch (error) {
      throw new WsException(error instanceof UnauthorizedException ? error.message : "Invalid or expired token");
    }

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
