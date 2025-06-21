import "dotenv/config";
import * as joi from "joi";

interface EnvVars {
  PORT: number;
  SECRET_JWT: string;
  PAGE: number;
  LIMIT: number;
  PORT_ORIGIN_WEBSOCKET: string;
}

const envsSchama = joi
  .object({
    PORT: joi.number().required(),
    SECRET_JWT: joi.string().required(),
    PAGE: joi.number().required(),
    LIMIT: joi.number().required(),
    PORT_ORIGIN_WEBSOCKET: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchama.validate({
  ...process.env,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  secretJwt: envVars.SECRET_JWT,
  page: envVars.PAGE,
  limit: envVars.LIMIT,
  portOriginWebsocket: envVars.PORT_ORIGIN_WEBSOCKET,
};
