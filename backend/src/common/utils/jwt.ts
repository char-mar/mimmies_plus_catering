import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { z } from "zod";

import { env } from "../../config/env";
import { UnauthorizedError } from "../../errors/app-error";
import { userRoles } from "../constants/roles";
import type { UserRole } from "../constants/roles";

const TOKEN_ISSUER = "mimmies-plus-api";
const TOKEN_AUDIENCE = "mimmies-plus-web";
const ACCESS_TOKEN_ALGORITHM = "HS256";

const accessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  role: z.enum(userRoles),
  type: z.literal("access"),
  iat: z.number(),
  exp: z.number(),
});

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export interface AccessTokenClaims {
  sub: string;
  role: UserRole;
}

export function signAccessToken(claims: AccessTokenClaims): string {
  const options: SignOptions = {
    algorithm: ACCESS_TOKEN_ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as Exclude<
      SignOptions["expiresIn"],
      undefined
    >,
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  };

  return jwt.sign(
    { sub: claims.sub, role: claims.role, type: "access" },
    env.JWT_SECRET,
    options,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: [ACCESS_TOKEN_ALGORITHM],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });

    const parsed = accessTokenPayloadSchema.safeParse(decoded);

    if (!parsed.success) {
      throw new UnauthorizedError("Invalid access token.");
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError("Invalid or expired access token.");
  }
}
