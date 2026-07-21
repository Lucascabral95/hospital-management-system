import { CookieOptions } from "express";
import { envs } from "src/config/envs";

export const REFRESH_COOKIE_NAME = "refresh_token";
export const REFRESH_COOKIE_PATH = "/api/v1/auth";

export function refreshCookieOptions(maxAgeMs: number): CookieOptions {
  const isProd = envs.nodeEnv === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeMs,
    ...(envs.cookieDomain ? { domain: envs.cookieDomain } : {}),
  };
}

export function clearRefreshCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...rest } = refreshCookieOptions(0);
  return rest;
}
