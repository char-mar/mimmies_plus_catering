import { and, asc, count, desc, eq, gt } from "drizzle-orm";

import { db } from "../config/db";
import { users } from "../db/tables/users";
import type { UserRole } from "../common/constants/roles";
import type { UserResponseDto } from "../dto/user.dto";
import { ConflictError, NotFoundError } from "../errors/app-error";
import { buildPagination, getPagination } from "../common/utils/pagination";
import type { PaginatedResponse } from "../common/types/pagination.types";

type UserRecord = typeof users.$inferSelect;

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export class UserService {
  toResponse(user: UserRecord): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async emailExists(email: string): Promise<boolean> {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return !!user;
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.findAuthUserById(id);

    return user ? this.toResponse(user) : null;
  }

  async findAuthUserById(id: string): Promise<UserRecord | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  async findByEmailForAuth(email: string): Promise<UserRecord | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async createUser(data: CreateUserInput): Promise<UserResponseDto> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          name: data.name,
          email: data.email,
          password: data.passwordHash,
          role: data.role ?? "CUSTOMER",
        })
        .returning();

      if (!user) {
        throw new Error("Failed to create user.");
      }

      return this.toResponse(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("An account with this email already exists.");
      }

      throw error;
    }
  }

  async recordLogin(id: string): Promise<UserResponseDto | null> {
    const [user] = await db
      .update(users)
      .set({ lastLogin: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return user ? this.toResponse(user) : null;
  }

  async updatePassword(id: string, password: string): Promise<void> {
    const [user] = await db
      .update(users)
      .set({
        password,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!user) {
      throw new NotFoundError("User not found.");
    }
  }

  async setEmailVerificationToken(
    id: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    const [user] = await db
      .update(users)
      .set({
        emailVerificationToken: tokenHash,
        emailVerificationTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!user) {
      throw new NotFoundError("User not found.");
    }
  }

  async consumeEmailVerificationToken(
    tokenHash: string,
  ): Promise<UserRecord | null> {
    const [user] = await db
      .update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.emailVerificationToken, tokenHash),
          gt(users.emailVerificationTokenExpiresAt, new Date()),
        ),
      )
      .returning();

    return user ?? null;
  }

  async setPasswordResetToken(
    id: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    const [user] = await db
      .update(users)
      .set({
        passwordResetToken: tokenHash,
        passwordResetTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!user) {
      throw new NotFoundError("User not found.");
    }
  }

  async consumePasswordResetToken(
    tokenHash: string,
    password: string,
  ): Promise<{ id: string } | null> {
    const [user] = await db
      .update(users)
      .set({
        password,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.passwordResetToken, tokenHash),
          gt(users.passwordResetTokenExpiresAt, new Date()),
          eq(users.isActive, true),
        ),
      )
      .returning({ id: users.id });

    return user ?? null;
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const pagination = getPagination(page, limit);

    const [totalResult] = await db.select({ total: count() }).from(users);
    const total = totalResult?.total ?? 0;

    const rows = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt), asc(users.id))
      .limit(pagination.limit)
      .offset(pagination.offset);

    return {
      items: rows.map((user) => this.toResponse(user)),
      pagination: buildPagination(total, pagination.page, pagination.limit),
    };
  }

  async updateRole(id: string, role: UserRole): Promise<UserResponseDto> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return this.toResponse(user);
  }

  async setActive(id: string, isActive: boolean): Promise<UserResponseDto> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return this.toResponse(user);
  }
}

export const userService = new UserService();
