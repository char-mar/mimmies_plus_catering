import { Router } from "express";
import { categoryController } from "../controller/categories.controller";

const router = Router();

router.post("/", categoryController.create);
router.get("/", categoryController.findAll);
router.get("/:id", categoryController.findById);
router.patch("/:id", categoryController.update);
router.delete("/:id", categoryController.delete);

export default router;
