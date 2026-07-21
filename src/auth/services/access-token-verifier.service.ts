import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "../auth.service";
import { AccessTokenPayload } from "../interfaces/token-payload.interface";

@Injectable()
export class AccessTokenVerifier {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async verifyAccess(raw: string): Promise<AccessTokenPayload> {
    let payload: AccessTokenPayload;
    try {
      payload = this.jwtService.verify<AccessTokenPayload>(raw);
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }

    const user = await this.authService.findOne(payload.id);
    if (!user) throw new UnauthorizedException("Token not valid");
    if (user.is_active === false) throw new UnauthorizedException("User is inactive, talk with an admin");

    return payload;
  }
}
