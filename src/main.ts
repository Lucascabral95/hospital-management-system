import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";
import { envs } from "./config/envs";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { configureApp } from "./common/bootstrap/configure-app";
import { registerGracefulShutdown } from "./common/lifecycle/graceful-shutdown";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger("Main of Hospital Management System");

  configureApp(app);

  // registerGracefulShutdown ya escucha SIGTERM/SIGINT y llama a app.close() (que dispara los
  // lifecycle hooks igual que enableShutdownHooks) — sumar enableShutdownHooks() acá duplicaba
  // el listener de señal y Nest terminaba re-matando el proceso con el disposition por defecto
  // (exit 143) antes de que nuestro `process.exit(0)` corriera.
  registerGracefulShutdown(app);

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Hospital Information System API")
      .setDescription(
        "Esta API proporciona los recursos y operaciones necesarios para gestionar de manera eficiente la informacion hospitalaria, incluyendo pacientes, personal medico, citas, historiales medicos, prescripciones y otros procesos clave del entorno hospitalario.",
      )
      .setVersion("1.0")
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, documentFactory);
  }

  logger.log(`Application running on port ${envs.port}`);
  await app.listen(envs.port);
}
bootstrap();
