import { Router } from "express";

import { paymentController } from "../controller/payment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";

const router = Router();

router.get("/", authenticate, authorize("ADMIN"), paymentController.findAll);
router.get(
  "/summary",
  authenticate,
  authorize("ADMIN"),
  paymentController.summary,
);

router.post("/verify", authenticate, paymentController.verify);

export default router;
