import type { Request, Response, NextFunction } from "express";

import { orderService } from "../service/order.service";
import { paymentService } from "../service/payment.service";
import { verifyPaymentSchema } from "../dto/order.dto";
import { listPaymentsQuerySchema } from "../dto/payment.dto";
import { parseWith } from "../common/utils/validation";
import {
  BadRequestError,
  UnauthorizedError,
} from "../errors/app-error";
import type { AuthUser } from "../common/types/auth.types";

function requireUser(req: Request): AuthUser {
  if (!req.user) {
    throw new UnauthorizedError("Authentication is required.");
  }

  return req.user;
}

export class PaymentController {
  findAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = parseWith(listPaymentsQuerySchema, req.query);
      const result = await paymentService.findAll(query);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  summary = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const summary = await paymentService.summary();

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  verify = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = parseWith(verifyPaymentSchema, req.body);
      const order = await orderService.verifyPayment(
        requireUser(req),
        dto.reference,
      );

      res.status(200).json({
        success: true,
        message: "Payment verified successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  paystackWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!Buffer.isBuffer(req.body)) {
        throw new BadRequestError("Expected a raw JSON body.");
      }

      const header = req.headers["x-paystack-signature"];
      const signature = Array.isArray(header) ? header[0] : header;

      await orderService.handlePaystackWebhook(req.body, signature);

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}

export const paymentController = new PaymentController();
