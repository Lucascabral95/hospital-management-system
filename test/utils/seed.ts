import { INestApplication } from "@nestjs/common";
import { AppService } from "src/app.service";

export const SEED_PASSWORD = "Doctor_123456";

export const SEED_USERS = {
  admin: { email: "lucas23@email.com", password: SEED_PASSWORD },
  doctor: { email: "jaz_vega@email.com", password: SEED_PASSWORD },
};

export const SEED_PATIENT_DNI = "12345678A";

export async function seedDatabase(app: INestApplication): Promise<void> {
  await app.get(AppService).createSeed();
}
