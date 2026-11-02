import type { Request, Response, NextFunction } from "express";

import { authService } from "../service/auth.service";
import { userService } from "../service/user.service";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginUserSchema,
  registerUserSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../dto/user.dto";
import { parseWith } from "../common/utils/validation";
import {
  REFRESH_TOKEN_COOKIE,
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../common/utils/auth-cookie";
import { UnauthorizedError } from "../errors/app-error";

function getRefreshToken(req: Request): string | undefined {
  const token = (req.cookies as Record<string, unknown> | undefined)?.[
    REFRESH_TOKEN_COOKIE
  ];

  return typeof token === "string" && token.length > 0 ? token : undefined;
}

export class AuthController {
  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = parseWith(registerUserSchema, req.body);
      const session = await authService.register(dto);

      setRefreshTokenCookie(
        res,
        session.refreshToken,
        session.refreshTokenExpiresAt,
      );

      res.status(201).json({
        success: true,
        message: "Account created successfully.",
        data: {
          user: session.user,
          accessToken: session.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = parseWith(loginUserSchema, req.body);
      const session = await authService.login(dto);

      setRefreshTokenCookie(
        res,
        session.refreshToken,
        session.refreshTokenExpiresAt,
      );

      res.status(200).json({
        success: true,
        message: "Signed in successfully.",
        data: {
          user: session.user,
          accessToken: session.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const token = getRefreshToken(req);

    try {
      if (!token) {
        throw new UnauthorizedError("Refresh token is required.");
      }

      const session = await authService.refresh(token);

      setRefreshTokenCookie(
        res,
        session.refreshToken,
        session.refreshTokenExpiresAt,
      );

      res.status(200).json({
        success: true,
        message: "Session refreshed successfully.",
        data: {
          user: session.user,
          accessToken: session.accessToken,
        },
      });
    } catch (error) {
      clearRefreshTokenCookie(res);
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await authService.logout(getRefreshToken(req));
      clearRefreshTokenCookie(res);

      res.status(200).json({
        success: true,
        message: "Signed out successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }

      const user = await userService.findById(req.user.id);

      if (!user) {
        throw new UnauthorizedError(
          "Your session is no longer valid. Please sign in again.",
        );
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }

      const dto = parseWith(changePasswordSchema, req.body);
      await authService.changePassword(req.user.id, dto);
      clearRefreshTokenCookie(res);

      res.status(200).json({
        success: true,
        message: "Password updated successfully. Please sign in again.",
      });
    } catch (error) {
      next(error);
    }
  };

  requestEmailVerification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }

      await authService.sendEmailVerification(req.user.id);

      res.status(200).json({
        success: true,
        message: "If your email still needs verification, a link has been sent.",
      });
    } catch (error) {
      next(error);
    }
  };

  confirmEmailVerification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = parseWith(verifyEmailSchema, req.body);
      await authService.verifyEmail(dto.token);

      res.status(200).json({
        success: true,
        message: "Email address verified successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = parseWith(forgotPasswordSchema, req.body);
      await authService.requestPasswordReset(dto);

      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = parseWith(resetPasswordSchema, req.body);
      await authService.resetPassword(dto);
      clearRefreshTokenCookie(res);

      res.status(200).json({
        success: true,
        message: "Password reset successfully. Please sign in again.",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
