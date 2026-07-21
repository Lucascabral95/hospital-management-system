import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as request from "supertest";
import { API_PREFIX } from "./create-test-app";
import { REFRESH_COOKIE_NAME } from "src/auth/utils/refresh-cookie";

export interface LoggedInSession {
  accessToken: string;
  refreshCookie: string;
}

export function extractSetCookie(res: request.Response, name: string): string | undefined {
  const raw = res.headers["set-cookie"];
  if (!raw) return undefined;
  const cookies: string[] = Array.isArray(raw) ? raw : [raw];
  const match = cookies.find((c) => c.startsWith(`${name}=`));
  return match?.split(";")[0];
}

export async function loginAs(app: INestApplication, email: string, password: string): Promise<LoggedInSession> {
  const res = await request(app.getHttpServer()).post(`${API_PREFIX}/auth/login`).send({ email, password }).expect(201);

  const refreshCookie = extractSetCookie(res, REFRESH_COOKIE_NAME);
  if (!refreshCookie) throw new Error("Login response did not set the refresh cookie");

  return { accessToken: res.body.token, refreshCookie };
}

export function signExpiredAccess(app: INestApplication, payload: Record<string, unknown>): string {
  const jwtService = app.get(JwtService);
  return jwtService.sign({ ...payload, type: "access" }, { expiresIn: "-10s" });
}

// Firma un token con forma de refresh (secreto y claims de refresh) para probar que los endpoints
// protegidos por JwtStrategy lo rechazan aunque se mande como Bearer.
export function signRefreshShapedToken(authId: number): string {
  const jwtService = new JwtService({ secret: process.env.SECRET_JWT_REFRESH });
  return jwtService.sign({ sub: authId, jti: "test-jti", familyId: "test-family", type: "refresh" });
}
