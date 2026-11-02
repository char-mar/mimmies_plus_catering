import { and, eq, isNull, lt } from "drizzle-orm";

import { db } from "../config/db";
import { env } from "../config/env";
import { refreshTokens } from "../db/schema";
import { UnauthorizedError } from "../errors/app-error";
import {
  generateOpaqueToken,
  hashOpaqueToken,
} from "../common/utils/token";

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

export interface RotatedRefreshToken extends IssuedRefreshToken {
  userId: string;
}

const INVALID_SESSION_MESSAGE =
  "Your session is no longer valid. Please sign in again.";

export class RefreshTokenService {
  private hash(token: string): string {
    return hashOpaqueToken(token);
  }

  private createToken(): { token: string; tokenHash: string; expiresAt: Date } {
    const token = generateOpaqueToken(64);

    return {
      token,
      tokenHash: this.hash(token),
      expiresAt: new Date(
        Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
      ),
    };
  }

  async issue(userId: string): Promise<IssuedRefreshToken> {
    const { token, tokenHash, expiresAt } = this.createToken();

    // Opportunistic cleanup so expired rows do not accumulate.
    await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
    await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt });

    return { token, expiresAt };
  }

  async rotate(rawToken: string): Promise<RotatedRefreshToken> {
    const tokenHash = this.hash(rawToken);

    const outcome = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: refreshTokens.id,
          userId: refreshTokens.userId,
          expiresAt: refreshTokens.expiresAt,
          revokedAt: refreshTokens.revokedAt,
        })
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, tokenHash))
        .limit(1);

      if (!existing) {
        return { kind: "invalid" as const };
      }

      if (existing.revokedAt) {
        await tx
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(refreshTokens.userId, existing.userId),
              isNull(refreshTokens.revokedAt),
            ),
          );

        return { kind: "reused" as const };
      }

      if (existing.expiresAt.getTime() <= Date.now()) {
        await tx.delete(refreshTokens).where(eq(refreshTokens.id, existing.id));
        return { kind: "expired" as const };
      }

      // Claim the token atomically so two concurrent refreshes cannot both
      // rotate the same token.
      const claimed = await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokens.id, existing.id),
            isNull(refreshTokens.revokedAt),
          ),
        )
        .returning({ id: refreshTokens.id });

      if (!claimed[0]) {
        await tx
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(refreshTokens.userId, existing.userId),
              isNull(refreshTokens.revokedAt),
            ),
          );

        return { kind: "reused" as const };
      }

      const { token, tokenHash: nextTokenHash, expiresAt } = this.createToken();

      await tx.insert(refreshTokens).values({
        userId: existing.userId,
        tokenHash: nextTokenHash,
        expiresAt,
      });

      return {
        kind: "ok" as const,
        userId: existing.userId,
        token,
        expiresAt,
      };
    });

    if (outcome.kind !== "ok") {
      throw new UnauthorizedError(INVALID_SESSION_MESSAGE);
    }

    return {
      userId: outcome.userId,
      token: outcome.token,
      expiresAt: outcome.expiresAt,
    };
  }

  async revoke(rawToken: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, this.hash(rawToken)));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
      );
  }
}

export const refreshTokenService = new RefreshTokenService();
