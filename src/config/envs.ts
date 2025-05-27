import "dotenv/config";
import * as joi from "joi";

interface EnvVars {
  PORT: number;
  SECRET_JWT: string;
  PAGE: number;
  LIMIT: number;
}

const envsSchama = joi
  .object({
    PORT: joi.number().required(),
    SECRET_JWT: joi.string().required(),
    PAGE: joi.number().required(),
    LIMIT: joi.number().required(),
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
};
