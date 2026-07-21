import * as path from "path";
import * as dotenv from "dotenv";
import { execSync } from "child_process";

const backendRoot = path.join(__dirname, "..");

export default async function globalSetup(): Promise<void> {
  dotenv.config({ path: path.join(backendRoot, ".env.test"), override: true });

  if (!process.env.DATABASE_URL?.includes("hms_test")) {
    throw new Error("Refusing to run e2e migrations against a database that isn't hms_test");
  }

  if (process.env.E2E_START_DB === "1") {
    execSync("docker compose -f docker-compose.test.yml up -d --wait", {
      cwd: backendRoot,
      stdio: "inherit",
    });
  }

  execSync("npx prisma migrate deploy", {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
}
