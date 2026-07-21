import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Cron, CronExpression } from "@nestjs/schedule";
import { createHash, randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { envs } from "src/config/envs";
import { RefreshTokenPayload } from "./interfaces/token-payload.interface";
import { RefreshToken } from "@prisma/client";

// Ventana en la que una segunda pestaña que llega justo después de una rotación
// recibe el token hijo en vez de disparar una revocación de familia por "reuso".
// Debe cubrir sólo la diferencia de latencia de red entre dos pestañas del mismo browser
// (típicamente <1s) — una ventana más larga amplía el margen para reproducir un token robado.
const REFRESH_REUSE_GRACE_MS = 2_000;

export interface RefreshMeta {
  ip?: string;
  userAgent?: string;
}

interface IssuedToken {
  authId: number;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger("RefreshTokenService");

  // Instancia propia: firma con SECRET_JWT_REFRESH, distinto del JwtService del contenedor (SECRET_JWT).
  private readonly refreshJwt = new JwtService({
    secret: envs.secretJwtRefresh,
    signOptions: { expiresIn: envs.jwtRefreshExpiresIn },
  });

  constructor(private readonly prisma: PrismaService) {}

  async issue(authId: number, meta: RefreshMeta = {}, familyId: string = randomUUID()): Promise<IssuedToken> {
    const jti = randomUUID();
    const token = this.refreshJwt.sign({ sub: authId, jti, familyId, type: "refresh" });
    const expiresAt = this.decodeExpiry(token);

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        authId,
        tokenHash: this.hash(token),
        familyId,
        expiresAt,
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    });

    return { authId, token, expiresAt };
  }

  async rotate(raw: string, meta: RefreshMeta = {}): Promise<IssuedToken> {
    const payload = this.verify(raw);

    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: this.hash(raw) } });
    if (!record) {
      throw new UnauthorizedException("Refresh token not found");
    }

    if (record.revokedAt) {
      return this.handleReuse(record);
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    const auth = await this.prisma.auth.findUnique({ where: { id: payload.sub } });
    if (!auth || auth.is_active === false) {
      await this.revokeFamily(record.familyId);
      throw new UnauthorizedException("User is inactive or not found");
    }

    return this.persistRotation(record, meta);
  }

  async revoke(raw: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(authId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { authId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpired(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }

  private verify(raw: string): RefreshTokenPayload {
    let payload: RefreshTokenPayload;
    try {
      payload = this.refreshJwt.verify<RefreshTokenPayload>(raw);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }

    return payload;
  }

  private async handleReuse(record: RefreshToken): Promise<IssuedToken> {
    const withinGrace = Date.now() - record.revokedAt!.getTime() < REFRESH_REUSE_GRACE_MS;
    const child = record.replacedById
      ? await this.prisma.refreshToken.findUnique({ where: { id: record.replacedById } })
      : null;

    if (withinGrace && child && !child.revokedAt) {
      // Dos pestañas refrescaron con la misma cookie casi al mismo tiempo: la que llegó
      // segunda ve el token ya rotado por la primera. En vez de matar la familia, la
      // rotamos de nuevo a partir del hijo vigente.
      return this.persistRotation(child, {});
    }

    this.logger.warn(`Refresh token reuse detected for family ${record.familyId}`);
    await this.revokeFamily(record.familyId);
    throw new UnauthorizedException("Refresh token reuse detected");
  }

  private async persistRotation(record: RefreshToken, meta: RefreshMeta): Promise<IssuedToken> {
    const jti = randomUUID();
    const token = this.refreshJwt.sign({ sub: record.authId, jti, familyId: record.familyId, type: "refresh" });
    const expiresAt = this.decodeExpiry(token);

    await this.prisma.$transaction([
      this.prisma.refreshToken.create({
        data: {
          id: jti,
          authId: record.authId,
          tokenHash: this.hash(token),
          familyId: record.familyId,
          expiresAt,
          userAgent: meta.userAgent,
          ip: meta.ip,
        },
      }),
      this.prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date(), replacedById: jti },
      }),
    ]);

    return { authId: record.authId, token, expiresAt };
  }

  private decodeExpiry(token: string): Date {
    const decoded = this.refreshJwt.decode(token) as { exp: number };
    return new Date(decoded.exp * 1000);
  }

  private hash(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
