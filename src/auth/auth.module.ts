import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { envs } from "src/config/envs";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { PassportModule } from "@nestjs/passport";

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    PassportModule.register({
      defaultStrategy: "jwt",
    }),

    JwtModule.register({
      secret: envs.secretJwt,
      signOptions: { expiresIn: "720h" },
    }),
  ],
  exports: [AuthService, AuthModule, JwtStrategy, JwtModule, PassportModule, AuthModule],
})
export class AuthModule {}
