import type { RequestHandler } from "express";

import type { UserRole } from "../common/constants/roles";
import { ForbiddenError, UnauthorizedError } from "../errors/app-error";

// Higher number means more access. SUPER_ADMIN automatically satisfies every
// role check that ADMIN satisfies.
const ACCESS_LEVEL: Record<UserRole, number> = {
  CUSTOMER: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
};

export function authorize(...roles: UserRole[]): RequestHandler {
  const requiredLevel = Math.min(...roles.map((role) => ACCESS_LEVEL[role]));

  return (req, _res, next) => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication is required."));
      return;
    }

    if (ACCESS_LEVEL[req.user.role] < requiredLevel) {
      next(
        new ForbiddenError(
          "You do not have permission to perform this action.",
        ),
      );
      return;
    }

    next();
  };
}
