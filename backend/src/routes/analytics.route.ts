import { Router } from "express";

import { analyticsController } from "../controller/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";

const router = Router();

router.get("/", authenticate, authorize("ADMIN"), analyticsController.overview);

export default router;
