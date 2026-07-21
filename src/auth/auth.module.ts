import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { envs } from "src/config/envs";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { RefreshTokenService } from "./refresh-token.service";
import { AccessTokenVerifier } from "./services/access-token-verifier.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenService, AccessTokenVerifier],
  imports: [
    PassportModule.register({
      defaultStrategy: "jwt",
    }),

    JwtModule.register({
      secret: envs.secretJwt,
      signOptions: { expiresIn: envs.jwtAccessExpiresIn },
    }),
  ],
  exports: [AuthService, JwtStrategy, JwtModule, PassportModule, RefreshTokenService, AccessTokenVerifier],
})
export class AuthModule {}
