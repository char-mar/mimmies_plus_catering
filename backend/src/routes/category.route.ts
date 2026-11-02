import { Router } from "express";
import { categoryController } from "../controller/categories.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";

const router = Router();

router.post("/", authenticate, authorize("ADMIN"), categoryController.create);
router.get("/", categoryController.findAll);
router.get("/:id", categoryController.findById);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  categoryController.update,
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  categoryController.delete,
);

export default router;
