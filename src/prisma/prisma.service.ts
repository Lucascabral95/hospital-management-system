import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { envs } from "src/config/envs";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger("PrismaService");

  constructor() {
    super({
      datasourceUrl: envs.databaseUrl,
      log: envs.nodeEnv === "development" ? ["warn", "error"] : ["error"],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Connected to database");
  }

  // Deliberadamente en onApplicationShutdown (no onModuleDestroy): Nest cierra el server HTTP y
  // dispara beforeApplicationShutdown en los gateways de socket ANTES de este hook, así que los
  // handlers en vuelo siguen teniendo una conexión a Prisma viva mientras se drenan.
  async onApplicationShutdown() {
    await this.$disconnect();
  }
}
