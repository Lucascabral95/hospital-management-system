import * as path from "path";
import * as dotenv from "dotenv";

// override:true es crítico: src/config/envs.ts hace `import "dotenv/config"` en import-time y
// dotenv no pisa vars ya seteadas, así que sin esto un .env de dev cargado antes contaminaría los e2e.
dotenv.config({ path: path.join(__dirname, "..", ".env.test"), override: true });

if (!process.env.DATABASE_URL?.includes("hms_test")) {
  throw new Error(
    "DATABASE_URL para los tests e2e no apunta a la base hms_test. Abortando para no correr contra otra base.",
  );
}
