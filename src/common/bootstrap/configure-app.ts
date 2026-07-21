import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { envs } from "src/config/envs";

// Compartido entre main.ts y los helpers de e2e para que la app de test sea idéntica a producción.
export function configureApp(app: INestApplication): void {
  // Sin esto, Express ve la request de Render como HTTP y descarta la cookie `secure`.
  (app as NestExpressApplication).set("trust proxy", 1);

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

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
}
