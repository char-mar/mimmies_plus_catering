import { rateLimit } from "express-rate-limit";
import type { RequestHandler } from "express";

import { env } from "../config/env";
import { TooManyRequestsError } from "../errors/app-error";

interface RateLimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
  enabled?: boolean;
}

const TOO_MANY_ATTEMPTS_MESSAGE =
  "Too many attempts. Please wait a moment and try again.";

function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

export function createRateLimiter({
  windowMs,
  limit,
  message,
  enabled = env.RATE_LIMIT_ENABLED,
}: RateLimiterOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => !enabled,
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError(message));
    },
  });
}

const authWindowMs = minutesToMs(env.AUTH_RATE_LIMIT_WINDOW_MINUTES);

export const authRateLimiter: RequestHandler = createRateLimiter({
  windowMs: authWindowMs,
  limit: env.AUTH_RATE_LIMIT_MAX,
  message: TOO_MANY_ATTEMPTS_MESSAGE,
});

export const refreshRateLimiter: RequestHandler = createRateLimiter({
  windowMs: authWindowMs,
  limit: env.REFRESH_RATE_LIMIT_MAX,
  message: TOO_MANY_ATTEMPTS_MESSAGE,
});

export const sensitiveAuthRateLimiter: RequestHandler = createRateLimiter({
  windowMs: authWindowMs,
  limit: env.PASSWORD_RESET_RATE_LIMIT_MAX,
  message: TOO_MANY_ATTEMPTS_MESSAGE,
});
