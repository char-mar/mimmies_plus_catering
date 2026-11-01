import { Router } from "express";
import { menuController } from "../controller/menu.controller";
import { uploadImages } from "../config/upload.config";

const router = Router();

router.post("/", uploadImages.any(), menuController.create);
router.get("/", menuController.findAll);
router.get("/:id", menuController.findById);
router.patch("/:id", menuController.update);
router.delete("/:id", menuController.delete);

export default router;
