import { Router } from "express";

import { imageController } from "../controller/image.controller";
import { uploadImages } from "../config/upload.config";
import { MAX_FILES_PER_REQUEST } from "../config/storage.config";

const router = Router();

// Upload multiple images for a menu item.
router.post(
  "/menu/:menuId",
  uploadImages.array("images", MAX_FILES_PER_REQUEST),
  imageController.uploadToMenu,
);

// Upload multiple images for a menu variant.
router.post(
  "/variant/:variantId",
  uploadImages.array("images", MAX_FILES_PER_REQUEST),
  imageController.uploadToVariant,
);

router.delete("/:imageId", imageController.delete);

export default router;
