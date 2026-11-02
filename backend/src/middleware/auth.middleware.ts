import { UnauthorizedError } from "../errors/app-error";
import { verifyAccessToken } from "../common/utils/jwt";
import { userService } from "../service/user.service";
import type { RequestHandler } from "express";

const BEARER_PREFIX = "Bearer ";

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedError("Authentication is required.");
    }

    const token = header.slice(BEARER_PREFIX.length).trim();

    if (!token) {
      throw new UnauthorizedError("Authentication is required.");
    }

    const payload = verifyAccessToken(token);
    const user = await userService.findAuthUserById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedError(
        "Your session is no longer valid. Please sign in again.",
      );
    }

    // Tokens issued before the last password change are rejected.
    if (
      user.passwordChangedAt &&
      payload.iat * 1000 < user.passwordChangedAt.getTime()
    ) {
      throw new UnauthorizedError(
        "Your session is no longer valid. Please sign in again.",
      );
    }

    // Role is read from the database, so role changes apply immediately
    // instead of waiting for the access token to expire.
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
