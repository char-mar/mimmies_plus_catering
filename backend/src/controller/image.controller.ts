import type { Request, Response, NextFunction } from "express";

import { imageService } from "../service/image.service";
import { BadRequestError } from "../errors/app-error";
import { LocalStorageService } from "../common/services/local-storage.service";
import { collectUploadedFiles } from "../common/utils/menu-upload";
import { parseUuid } from "../common/utils/validation";

const storage = new LocalStorageService();

export class ImageController {
  uploadToMenu = async (
    req: Request<{ menuId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const files = collectUploadedFiles(req.files);

    try {
      const menuId = parseUuid(req.params.menuId, "Menu id");

      if (files.length === 0) {
        throw new BadRequestError("Please upload at least one image.");
      }

      const images = await imageService.uploadToMenu(menuId, files);

      res.status(201).json({
        success: true,
        message: "Menu images uploaded successfully.",
        imagesReceived: files.length,
        data: images,
      });
    } catch (error) {
      await storage.deleteMany(files.map((file) => file.filename));
      next(error);
    }
  };

  uploadToVariant = async (
    req: Request<{ variantId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const files = collectUploadedFiles(req.files);

    try {
      const variantId = parseUuid(req.params.variantId, "Variant id");

      if (files.length === 0) {
        throw new BadRequestError("Please upload at least one image.");
      }

      const images = await imageService.uploadToVariant(variantId, files);

      res.status(201).json({
        success: true,
        message: "Variant images uploaded successfully.",
        imagesReceived: files.length,
        data: images,
      });
    } catch (error) {
      await storage.deleteMany(files.map((file) => file.filename));
      next(error);
    }
  };

  delete = async (
    req: Request<{ imageId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await imageService.delete(parseUuid(req.params.imageId, "Image id"));

      res.status(200).json({
        success: true,
        message: "Image deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const imageController = new ImageController();
