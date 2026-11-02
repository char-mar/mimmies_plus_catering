import { Router } from "express";

import { authController } from "../controller/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  authRateLimiter,
  refreshRateLimiter,
  sensitiveAuthRateLimiter,
} from "../middleware/rate-limit.middleware";

const router = Router();

router.post("/register", authRateLimiter, authController.register);
router.post("/login", authRateLimiter, authController.login);
router.post("/refresh", refreshRateLimiter, authController.refresh);
router.post("/logout", authController.logout);

router.get("/me", authenticate, authController.me);
router.patch("/change-password", authenticate, authController.changePassword);

router.post(
  "/verify-email/request",
  authenticate,
  sensitiveAuthRateLimiter,
  authController.requestEmailVerification,
);
router.post(
  "/verify-email/confirm",
  sensitiveAuthRateLimiter,
  authController.confirmEmailVerification,
);

router.post(
  "/forgot-password",
  sensitiveAuthRateLimiter,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  sensitiveAuthRateLimiter,
  authController.resetPassword,
);

export default router;
