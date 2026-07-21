import "dotenv/config";
import * as joi from "joi";
import { buildDatabaseUrl } from "./database-url";

interface EnvVars {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  SECRET_JWT: string;
  SECRET_JWT_REFRESH: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  PAGE: number;
  LIMIT: number;
  PORT_ORIGIN_WEBSOCKET: string;
  DATABASE_URL: string;
  DIRECT_URL?: string;
  COOKIE_DOMAIN?: string;
  DB_CONNECTION_LIMIT: number;
  DB_POOL_TIMEOUT: number;
  DB_CONNECT_TIMEOUT: number;
  DB_PGBOUNCER: boolean;
  SHUTDOWN_TIMEOUT_MS: number;
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;
  CACHE_TTL: number;
}

const envsSchama = joi
  .object({
    NODE_ENV: joi.string().valid("development", "test", "production").default("development"),
    PORT: joi.number().required(),
    SECRET_JWT: joi.string().required(),
    SECRET_JWT_REFRESH: joi.string().min(16).required().invalid(joi.ref("SECRET_JWT")),
    JWT_ACCESS_EXPIRES_IN: joi.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: joi.string().default("30d"),
    PAGE: joi.number().required(),
    LIMIT: joi.number().required(),
    PORT_ORIGIN_WEBSOCKET: joi.string().required(),
    DATABASE_URL: joi
      .string()
      .uri({ scheme: ["postgresql", "postgres"] })
      .required(),
    DIRECT_URL: joi
      .string()
      .uri({ scheme: ["postgresql", "postgres"] })
      .optional(),
    COOKIE_DOMAIN: joi.string().allow("").optional(),
    DB_CONNECTION_LIMIT: joi.number().default(10),
    DB_POOL_TIMEOUT: joi.number().default(20),
    DB_CONNECT_TIMEOUT: joi.number().default(15),
    DB_PGBOUNCER: joi.boolean().default(false),
    SHUTDOWN_TIMEOUT_MS: joi.number().default(15000),
    THROTTLE_TTL: joi.number().default(60000),
    THROTTLE_LIMIT: joi.number().default(200),
    CACHE_TTL: joi.number().default(30000),
  })
  .unknown(true);

const { error, value } = envsSchama.validate({
  ...process.env,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

const databaseUrl = buildDatabaseUrl(envVars.DATABASE_URL, {
  connectionLimit: envVars.DB_CONNECTION_LIMIT,
  poolTimeout: envVars.DB_POOL_TIMEOUT,
  connectTimeout: envVars.DB_CONNECT_TIMEOUT,
  pgbouncer: envVars.DB_PGBOUNCER,
});

export const envs = {
  nodeEnv: envVars.NODE_ENV,
  port: envVars.PORT,
  secretJwt: envVars.SECRET_JWT,
  secretJwtRefresh: envVars.SECRET_JWT_REFRESH,
  jwtAccessExpiresIn: envVars.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
  page: envVars.PAGE,
  limit: envVars.LIMIT,
  portOriginWebsocket: envVars.PORT_ORIGIN_WEBSOCKET,
  databaseUrl,
  directUrl: envVars.DIRECT_URL,
  cookieDomain: envVars.COOKIE_DOMAIN || undefined,
  shutdownTimeoutMs: envVars.SHUTDOWN_TIMEOUT_MS,
  throttleTtl: envVars.THROTTLE_TTL,
  throttleLimit: envVars.THROTTLE_LIMIT,
  cacheTtl: envVars.CACHE_TTL,
};
