import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { envs } from "src/config/envs";
import { AuthService } from "../auth.service";
import { AccessTokenPayload } from "../interfaces/token-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.secretJwt,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AccessTokenPayload> {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }

    const { id } = payload;

    const user = await this.authService.findOne(id);

    if (!user) throw new UnauthorizedException("Token not valid");

    if (user.is_active === false) {
      throw new UnauthorizedException("User is inactive, talk with an admin");
    }

    return payload;
  }
}
