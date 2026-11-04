import { Router } from "express";

import { contactController } from "../controller/contact.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { contactRateLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

router.post("/", contactRateLimiter, contactController.create);
router.get("/", authenticate, authorize("ADMIN"), contactController.findAll);
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  contactController.updateStatus,
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  contactController.delete,
);

export default router;
