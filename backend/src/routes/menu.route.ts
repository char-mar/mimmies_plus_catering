import { Router } from "express";
import { menuController } from "../controller/menu.controller";
import { uploadImages } from "../config/upload.config";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  uploadImages.any(),
  menuController.create,
);
router.get("/", menuController.findAll);
router.get("/:id", menuController.findById);
router.patch("/:id", authenticate, authorize("ADMIN"), menuController.update);
router.delete("/:id", authenticate, authorize("ADMIN"), menuController.delete);

export default router;
