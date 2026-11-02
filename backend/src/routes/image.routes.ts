import { Router } from "express";

import { imageController } from "../controller/image.controller";
import { uploadImages } from "../config/upload.config";
import { MAX_FILES_PER_REQUEST } from "../config/storage.config";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";

const router = Router();

// Upload multiple images for a menu item.
router.post(
  "/menu/:menuId",
  authenticate,
  authorize("ADMIN"),
  uploadImages.array("images", MAX_FILES_PER_REQUEST),
  imageController.uploadToMenu,
);

router.post(
  "/variant/:variantId",
  authenticate,
  authorize("ADMIN"),
  uploadImages.array("images", MAX_FILES_PER_REQUEST),
  imageController.uploadToVariant,
);

router.delete(
  "/:imageId",
  authenticate,
  authorize("ADMIN"),
  imageController.delete,
);

export default router;
