import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { AppModule } from "src/app.module";
import { configureApp } from "src/common/bootstrap/configure-app";

export const API_PREFIX = "/api/v1";

interface CreateTestAppOptions {
  // El ThrottlerGuard global es 200/60s; los tests de rate-limit necesitan el real, el resto lo pisa.
  realThrottler?: boolean;
}

export async function createTestApp(options: CreateTestAppOptions = {}): Promise<INestApplication> {
  const moduleBuilder = Test.createTestingModule({ imports: [AppModule] });

  if (!options.realThrottler) {
    moduleBuilder.overrideGuard(ThrottlerGuard).useValue({ canActivate: () => true });
  }

  const moduleFixture: TestingModule = await moduleBuilder.compile();
  const app = moduleFixture.createNestApplication();

  // Mismo helper que main.ts: evita que la app de test se desincronice de producción.
  configureApp(app);

  await app.init();
  return app;
}

// El CacheModule es global (ttl configurable) y algunos services cachean a mano (PatientsService,
// DoctorsService) — sin esto, un test puede leer una respuesta cacheada por el test anterior.
export async function clearCache(app: INestApplication): Promise<void> {
  const cache = app.get<Cache>(CACHE_MANAGER);
  await cache.clear();
}
