import { Router } from "express";

import { orderController } from "../controller/order.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";

const router = Router();

router.use(authenticate);

router.post("/", orderController.create);
router.get("/", orderController.findAll);
router.get("/:id", orderController.findById);
router.post("/:id/cancel", orderController.cancel);
router.post("/:id/payments/initialize", orderController.initializePayment);
router.patch("/:id/status", authorize("ADMIN"), orderController.updateStatus);

export default router;
