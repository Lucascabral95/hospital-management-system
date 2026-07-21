import * as path from "path";
import { execSync } from "child_process";

const backendRoot = path.join(__dirname, "..");

export default async function globalTeardown(): Promise<void> {
  if (process.env.E2E_START_DB === "1") {
    execSync("docker compose -f docker-compose.test.yml down -v", {
      cwd: backendRoot,
      stdio: "inherit",
    });
  }
}
