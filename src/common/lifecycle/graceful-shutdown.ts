import { INestApplication, Logger } from "@nestjs/common";
import { envs } from "src/config/envs";
import { setShuttingDown } from "./shutdown-state";

// enableShutdownHooks() por sí solo dispara los hooks de los providers, pero no avisa a los
// clientes conectados, no espera a que se drenen, ni pone un límite duro de tiempo. Esto cubre
// esas tres cosas.
export function registerGracefulShutdown(app: INestApplication): void {
  const logger = new Logger("GracefulShutdown");
  const httpServer = app.getHttpServer();
  httpServer.keepAliveTimeout = 61_000;
  httpServer.headersTimeout = 65_000;

  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.log(`Received ${signal}, starting graceful shutdown`);
    setShuttingDown(true);

    const forceExit = setTimeout(() => {
      logger.error(`Graceful shutdown timed out after ${envs.shutdownTimeoutMs}ms, forcing exit`);
      process.exit(1);
    }, envs.shutdownTimeoutMs);
    forceExit.unref();

    try {
      await app.close();
      clearTimeout(forceExit);
      process.exit(0);
    } catch (error) {
      logger.error("Error during graceful shutdown", error);
      process.exit(1);
    }
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}
