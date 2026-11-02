import express, { Router } from "express";

import { paymentController } from "../controller/payment.controller";

const router = Router();

// Paystack signs the exact bytes it sends, so this route must bypass the
// global JSON parser and receive a raw Buffer.
router.post(
  "/paystack",
  express.raw({ type: "application/json", limit: "200kb" }),
  paymentController.paystackWebhook,
);

export default router;
