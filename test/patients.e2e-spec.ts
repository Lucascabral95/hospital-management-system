import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { createTestApp, clearCache, API_PREFIX } from "./utils/create-test-app";
import { seedDatabase, SEED_USERS, SEED_PATIENT_DNI } from "./utils/seed";
import { loginAs } from "./utils/auth";

describe("Patients (e2e)", () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await seedDatabase(app);
    const admin = await loginAs(app, SEED_USERS.admin.email, SEED_USERS.admin.password);
    adminToken = admin.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /patients/dni/:dni is public on purpose (the unauthenticated patient page uses it)", async () => {
    const res = await request(app.getHttpServer()).get(`${API_PREFIX}/patients/dni/${SEED_PATIENT_DNI}`).expect(200);

    expect(res.body).toEqual(expect.objectContaining({ dni: SEED_PATIENT_DNI }));
  });

  it("GET /patients/dni/:dni returns 404 for an unknown dni", async () => {
    await request(app.getHttpServer()).get(`${API_PREFIX}/patients/dni/does-not-exist`).expect(400);
  });

  it("GET /patients requires authentication", async () => {
    await request(app.getHttpServer()).get(`${API_PREFIX}/patients`).expect(401);
  });

  it("GET /patients works for an authenticated ADMIN", async () => {
    const res = await request(app.getHttpServer())
      .get(`${API_PREFIX}/patients`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({ data: expect.any(Array), total: expect.any(Number), page: expect.any(Number) }),
    );
  });

  it("rejects unknown body fields due to forbidNonWhitelisted", async () => {
    await request(app.getHttpServer())
      .post(`${API_PREFIX}/patients`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        dni: "99999999Z",
        name: "New",
        last_name: "Patient",
        date_born: "2000-01-01",
        gender: "MALE",
        phone: "111222333",
        email: "new.patient@example.com",
        thisFieldDoesNotExist: "should be rejected",
      })
      .expect(400);
  });

  it("creates a patient and invalidates the cached /patients/select list", async () => {
    await clearCache(app);

    const before = await request(app.getHttpServer())
      .get(`${API_PREFIX}/patients/select`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dni = `e2e-${Date.now()}`;
    await request(app.getHttpServer())
      .post(`${API_PREFIX}/patients`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        dni,
        name: "New",
        last_name: "Patient",
        date_born: "2000-01-01",
        gender: "MALE",
        phone: "111222333",
        email: "new.patient@example.com",
      })
      .expect(201);

    const after = await request(app.getHttpServer())
      .get(`${API_PREFIX}/patients/select`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(after.body.length).toBe(before.body.length + 1);
    expect(after.body.some((p: { dni: string }) => p.dni === dni)).toBe(true);
  });
});
