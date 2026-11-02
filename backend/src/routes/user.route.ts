import { Router } from "express";

import { userController } from "../controller/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";

const router = Router();

router.use(authenticate);

router.get("/", authorize("ADMIN"), userController.findAll);
router.get("/:id", authorize("ADMIN"), userController.findById);

router.patch("/:id/role", authorize("SUPER_ADMIN"), userController.updateRole);
router.patch("/:id/status", authorize("ADMIN"), userController.updateStatus);

export default router;
