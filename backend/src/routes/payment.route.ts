import { Router } from "express";

import { paymentController } from "../controller/payment.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/verify", authenticate, paymentController.verify);

export default router;
