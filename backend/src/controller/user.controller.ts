import type { Request, Response, NextFunction } from "express";

import { userService } from "../service/user.service";
import { refreshTokenService } from "../service/refresh-token.service";
import {
  listUsersQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "../dto/user.dto";
import { parseUuid, parseWith } from "../common/utils/validation";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/app-error";

export class UserController {
  findAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { page, limit } = parseWith(listUsersQuerySchema, req.query);
      const result = await userService.findAll(page, limit);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await userService.findById(
        parseUuid(req.params.id, "User id"),
      );

      if (!user) {
        throw new NotFoundError("User not found.");
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }

      const id = parseUuid(req.params.id, "User id");

      if (id === req.user.id) {
        throw new BadRequestError("You cannot change your own role.");
      }

      const { role } = parseWith(updateUserRoleSchema, req.body);
      const user = await userService.updateRole(id, role);

      res.status(200).json({
        success: true,
        message: "User role updated successfully.",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }

      const id = parseUuid(req.params.id, "User id");

      if (id === req.user.id) {
        throw new BadRequestError("You cannot change your own account status.");
      }

      const target = await userService.findById(id);

      if (!target) {
        throw new NotFoundError("User not found.");
      }

      if (req.user.role === "ADMIN" && target.role !== "CUSTOMER") {
        throw new ForbiddenError(
          "Admins can only manage customer accounts.",
        );
      }

      const { isActive } = parseWith(updateUserStatusSchema, req.body);
      const user = await userService.setActive(id, isActive);

      if (!isActive) {
        await refreshTokenService.revokeAllForUser(id);
      }

      res.status(200).json({
        success: true,
        message: `User ${isActive ? "activated" : "deactivated"} successfully.`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
