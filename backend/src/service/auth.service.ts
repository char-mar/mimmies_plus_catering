import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginUserDto,
  RegisterUserDto,
  ResetPasswordDto,
  UserResponseDto,
} from "../dto/user.dto";

import { env } from "../config/env";
import { userService } from "./user.service";
import { refreshTokenService } from "./refresh-token.service";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/app-error";
import {
  getDummyPasswordHash,
  hashPassword,
  verifyPassword,
} from "../common/utils/password";
import { signAccessToken } from "../common/utils/jwt";
import { generateOpaqueToken, hashOpaqueToken } from "../common/utils/token";
import { mailService } from "../common/services/mail.service";

export interface AuthSession {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const INVALID_VERIFICATION_LINK =
  "This verification link is invalid or has expired.";
const INVALID_RESET_LINK =
  "This password reset link is invalid or has expired.";

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export class AuthService {
  async register(dto: RegisterUserDto): Promise<AuthSession> {
    const passwordHash = await hashPassword(dto.password);

    // The database unique constraint is the source of truth; createUser maps
    // duplicate emails to a 409.
    const user = await userService.createUser({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: "CUSTOMER",
    });

    const session = await this.createSession(user);

    // A mail outage must not fail registration; the user can resend later.
    try {
      await this.sendEmailVerification(user.id);
    } catch (error) {
      console.error(
        "[auth.register] Failed to send verification email:",
        error,
      );
    }

    return session;
  }

  async login(dto: LoginUserDto): Promise<AuthSession> {
    const user = await userService.findByEmailForAuth(dto.email);

    if (!user) {
      // Hash anyway so missing accounts take roughly as long as wrong
      // passwords.
      await verifyPassword(dto.password, await getDummyPasswordHash());
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await verifyPassword(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    if (!user.isActive) {
      throw new ForbiddenError("This account has been disabled.");
    }

    if (env.REQUIRE_EMAIL_VERIFICATION && !user.isEmailVerified) {
      throw new ForbiddenError(
        "Please verify your email address before signing in.",
      );
    }

    const loggedInUser = await userService.recordLogin(user.id);

    return this.createSession(loggedInUser ?? userService.toResponse(user));
  }

  async refresh(rawToken: string): Promise<AuthSession> {
    const rotated = await refreshTokenService.rotate(rawToken);
    const user = await userService.findAuthUserById(rotated.userId);

    if (!user || !user.isActive) {
      await refreshTokenService.revokeAllForUser(rotated.userId);
      throw new UnauthorizedError(
        "Your session is no longer valid. Please sign in again.",
      );
    }

    return {
      user: userService.toResponse(user),
      accessToken: signAccessToken({ sub: user.id, role: user.role }),
      refreshToken: rotated.token,
      refreshTokenExpiresAt: rotated.expiresAt,
    };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (rawToken) {
      await refreshTokenService.revoke(rawToken);
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await userService.findAuthUserById(userId);

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const samePassword = await verifyPassword(dto.newPassword, user.password);

    if (samePassword) {
      throw new BadRequestError(
        "New password must be different from the current password.",
      );
    }

    await userService.updatePassword(
      user.id,
      await hashPassword(dto.newPassword),
    );

    // Force every device to sign in again with the new password.
    await refreshTokenService.revokeAllForUser(user.id);
  }

  async sendEmailVerification(userId: string): Promise<void> {
    const user = await userService.findAuthUserById(userId);

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (user.isEmailVerified) {
      return;
    }

    const token = generateOpaqueToken();

    await userService.setEmailVerificationToken(
      user.id,
      hashOpaqueToken(token),
      hoursFromNow(env.EMAIL_VERIFICATION_TTL_HOURS),
    );

    await mailService.sendEmailVerification(user.email, user.name, token);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await userService.consumeEmailVerificationToken(
      hashOpaqueToken(token),
    );

    if (!user) {
      throw new BadRequestError(INVALID_VERIFICATION_LINK);
    }
  }

  // Always resolves for an unknown or inactive account so the response does
  // not reveal whether an email is registered.
  async requestPasswordReset(dto: ForgotPasswordDto): Promise<void> {
    const user = await userService.findByEmailForAuth(dto.email);

    if (!user || !user.isActive) {
      return;
    }

    const token = generateOpaqueToken();

    await userService.setPasswordResetToken(
      user.id,
      hashOpaqueToken(token),
      minutesFromNow(env.PASSWORD_RESET_TTL_MINUTES),
    );

    try {
      await mailService.sendPasswordReset(user.email, user.name, token);
    } catch (error) {
      console.error(
        "[auth.requestPasswordReset] Failed to send reset email:",
        error,
      );
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await userService.consumePasswordResetToken(
      hashOpaqueToken(dto.token),
      await hashPassword(dto.password),
    );

    if (!user) {
      throw new BadRequestError(INVALID_RESET_LINK);
    }

    // A reset invalidates every existing session, including a stolen one.
    await refreshTokenService.revokeAllForUser(user.id);
  }

  private async createSession(user: UserResponseDto): Promise<AuthSession> {
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await refreshTokenService.issue(user.id);

    return {
      user,
      accessToken,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt,
    };
  }
}

export const authService = new AuthService();
