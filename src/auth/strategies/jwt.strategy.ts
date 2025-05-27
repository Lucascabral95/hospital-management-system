import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { envs } from "src/config/envs";
import { AuthService } from "../auth.service";
import { PayloadJwtDto } from "../dto";
import { RoleAccess } from "@prisma/client";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.secretJwt,
    });
  }

  async validate(payload: PayloadJwtDto): Promise<PayloadJwtDto> {
    const { id } = payload;

    const user = await this.authService.findOne(id);

    if (!user) throw new UnauthorizedException("Token not valid");

    if (user.role !== RoleAccess.DOCTOR) {
      throw new UnauthorizedException("Only doctors can access");
    }

    if (user.is_active === false) {
      throw new UnauthorizedException("User is inactive, talk with an admin");
    }

    return payload;
  }
}
