import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { createTestApp, API_PREFIX } from "./utils/create-test-app";
import { seedDatabase, SEED_USERS } from "./utils/seed";
import { loginAs, extractSetCookie, signExpiredAccess, signRefreshShapedToken } from "./utils/auth";
import { REFRESH_COOKIE_NAME } from "src/auth/utils/refresh-cookie";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Auth (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await seedDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/login", () => {
    it("logs in, sets an httpOnly refresh cookie and never returns the password or the raw refresh token", async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/login`)
        .send(SEED_USERS.admin)
        .expect(201);

      expect(res.body).toEqual({
        message: "Login successful",
        token: expect.any(String),
        user: expect.objectContaining({ email: SEED_USERS.admin.email, role: "ADMIN" }),
      });
      expect(JSON.stringify(res.body)).not.toContain("password");
      expect(res.body).not.toHaveProperty("refreshToken");

      const cookie = extractSetCookie(res, REFRESH_COOKIE_NAME);
      expect(cookie).toBeDefined();
      const rawCookieHeader = ([] as string[]).concat(res.headers["set-cookie"] as any).join(";");
      expect(rawCookieHeader).toContain("HttpOnly");
      expect(rawCookieHeader).toContain(`Path=${API_PREFIX}/auth`);
    });

    it("rejects a wrong password with 400", async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/login`)
        .send({ email: SEED_USERS.admin.email, password: "wrong-password" })
        .expect(400);
    });

    it("rejects an unknown email with 404", async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/login`)
        .send({ email: "nobody@example.com", password: "whatever123" })
        .expect(404);
    });
  });

  describe("GET /auth (findAll)", () => {
    it("rejects requests without a token", async () => {
      await request(app.getHttpServer()).get(`${API_PREFIX}/auth`).expect(401);
    });

    it("allows ADMIN and DOCTOR, but only ADMIN can POST /auth", async () => {
      const admin = await loginAs(app, SEED_USERS.admin.email, SEED_USERS.admin.password);
      const doctor = await loginAs(app, SEED_USERS.doctor.email, SEED_USERS.doctor.password);

      await request(app.getHttpServer())
        .get(`${API_PREFIX}/auth`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`${API_PREFIX}/auth`)
        .set("Authorization", `Bearer ${doctor.accessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth`)
        .set("Authorization", `Bearer ${doctor.accessToken}`)
        .send({ full_name: "X", email: "x@example.com", password: "Str0ngPass!", role: "DOCTOR" })
        .expect(401);
    });
  });

  describe("POST /auth/refresh", () => {
    it("rotates the refresh token and issues a new access token", async () => {
      const { refreshCookie } = await loginAs(app, SEED_USERS.admin.email, SEED_USERS.admin.password);

      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/refresh`)
        .set("Cookie", refreshCookie)
        .expect(200);

      expect(res.body).toEqual({ token: expect.any(String) });
      const newCookie = extractSetCookie(res, REFRESH_COOKIE_NAME);
      expect(newCookie).toBeDefined();
      expect(newCookie).not.toEqual(refreshCookie);
    });

    it("returns 401 when there is no refresh cookie", async () => {
      await request(app.getHttpServer()).post(`${API_PREFIX}/auth/refresh`).expect(401);
    });

    it("detects reuse of an already-rotated refresh token and kills the whole family", async () => {
      const { refreshCookie: original } = await loginAs(app, SEED_USERS.admin.email, SEED_USERS.admin.password);

      const rotateRes = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/refresh`)
        .set("Cookie", original)
        .expect(200);
      const rotated = extractSetCookie(rotateRes, REFRESH_COOKIE_NAME)!;

      // Esperar más que la ventana de gracia (2s) para que replayar el token viejo cuente como reuso real.
      await sleep(2200);

      const reuseRes = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/refresh`)
        .set("Cookie", original)
        .expect(401);
      expect(reuseRes.body.message).toMatch(/reuse/i);

      // La familia entera queda revocada, incluyendo el token que sí era válido.
      await request(app.getHttpServer()).post(`${API_PREFIX}/auth/refresh`).set("Cookie", rotated).expect(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("clears the cookie and revokes the refresh token", async () => {
      const { refreshCookie } = await loginAs(app, SEED_USERS.admin.email, SEED_USERS.admin.password);

      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/logout`)
        .set("Cookie", refreshCookie)
        .expect(200);

      // express's res.clearCookie() invalida vía Expires=epoch, no agrega Max-Age=0.
      const clearedCookie = ([] as string[]).concat(res.headers["set-cookie"] as any).join(";");
      expect(clearedCookie).toContain("Expires=Thu, 01 Jan 1970");

      await request(app.getHttpServer()).post(`${API_PREFIX}/auth/refresh`).set("Cookie", refreshCookie).expect(401);
    });
  });

  describe("Token type enforcement", () => {
    it("rejects an expired access token with 401", async () => {
      const admin = await loginAs(app, SEED_USERS.admin.email, SEED_USERS.admin.password);
      const meRes = await request(app.getHttpServer())
        .get(`${API_PREFIX}/auth/me`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);

      const expired = signExpiredAccess(app, {
        id: meRes.body.id,
        full_name: "x",
        email: "x",
        role: "ADMIN",
        is_active: true,
      });

      await request(app.getHttpServer())
        .get(`${API_PREFIX}/auth/me`)
        .set("Authorization", `Bearer ${expired}`)
        .expect(401);
    });

    it("rejects a refresh-shaped token used as a Bearer access token", async () => {
      const refreshShaped = signRefreshShapedToken(1);

      await request(app.getHttpServer())
        .get(`${API_PREFIX}/auth`)
        .set("Authorization", `Bearer ${refreshShaped}`)
        .expect(401);
    });
  });

  describe("GET /auth/me", () => {
    it("returns the authenticated user without the password hash", async () => {
      const admin = await loginAs(app, SEED_USERS.admin.email, SEED_USERS.admin.password);

      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/auth/me`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(200);

      expect(res.body).toEqual(expect.objectContaining({ email: SEED_USERS.admin.email, role: "ADMIN" }));
      expect(res.body).not.toHaveProperty("password");
    });
  });
});
