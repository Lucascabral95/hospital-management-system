import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import * as compression from "compression";
import helmet from "helmet";
import { envs } from "./config/envs";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Main of Hospital Management System");

  app.use(helmet());
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: [envs.portOriginWebsocket, "https://hospital-management-system-healthsync.netlify.app"],
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");

  app.enableShutdownHooks();

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
