import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { envs } from "./config/envs";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Main of Hospital Management System");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");

  const config = new DocumentBuilder()
    .setTitle("Hospital Information System API")
    .setDescription(
      "Esta API proporciona los recursos y operaciones necesarios para gestionar de manera eficiente la informacion hospitalaria, incluyendo pacientes, personal medico, citas, historiales medicos, prescripciones y otros procesos clave del entorno hospitalario.",
    )
    .setVersion("1.0")
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  logger.log(`Application running on port ${envs.port}`);
  await app.listen(envs.port);
}
bootstrap();
