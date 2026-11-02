import type { Request, Response, NextFunction } from "express";

import { orderService } from "../service/order.service";
import {
  cancelOrderSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from "../dto/order.dto";
import { parseUuid, parseWith } from "../common/utils/validation";
import { UnauthorizedError } from "../errors/app-error";
import type { AuthUser } from "../common/types/auth.types";

function requireUser(req: Request): AuthUser {
  if (!req.user) {
    throw new UnauthorizedError("Authentication is required.");
  }

  return req.user;
}

export class OrderController {
  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = parseWith(createOrderSchema, req.body);
      const order = await orderService.create(requireUser(req), dto);

      res.status(201).json({
        success: true,
        message: "Order created successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  findAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = parseWith(listOrdersQuerySchema, req.query);
      const result = await orderService.findAll(requireUser(req), query);

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
      const order = await orderService.findById(
        requireUser(req),
        parseUuid(req.params.id, "Order id"),
      );

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = parseWith(cancelOrderSchema, req.body ?? {});
      const order = await orderService.cancel(
        requireUser(req),
        parseUuid(req.params.id, "Order id"),
        dto,
      );

      res.status(200).json({
        success: true,
        message: "Order cancelled successfully.",
        data: order,
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
      const dto = parseWith(updateOrderStatusSchema, req.body);
      const order = await orderService.updateStatus(
        requireUser(req).id,
        parseUuid(req.params.id, "Order id"),
        dto,
      );

      res.status(200).json({
        success: true,
        message: "Order status updated successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  initializePayment = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payment = await orderService.initializePayment(
        requireUser(req),
        parseUuid(req.params.id, "Order id"),
      );

      res.status(200).json({
        success: true,
        message: "Payment initialized successfully.",
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const orderController = new OrderController();
