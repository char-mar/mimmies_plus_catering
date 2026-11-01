import type { Request, Response, NextFunction } from "express";

import { menuService } from "../service/menu.service";
import { createMenuSchema, updateMenuSchema } from "../dto/menu.dto";
import type { CreateMenuDto } from "../dto/menu.dto";
import { BadRequestError } from "../errors/app-error";
import { LocalStorageService } from "../common/services/local-storage.service";
import {
  assertMenuUploadLimits,
  collectUploadedFiles,
  groupMenuUploadFiles,
} from "../common/utils/menu-upload";
import type { MenuUploadFiles } from "../common/utils/menu-upload";
import { parseUuid, parseWith } from "../common/utils/validation";

const storage = new LocalStorageService();

function parseMenuBody(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null) {
    return {};
  }

  const parsed = { ...(body as Record<string, unknown>) };

  if (typeof parsed.variants === "string") {
    try {
      parsed.variants = JSON.parse(parsed.variants);
    } catch {
      throw new BadRequestError("variants must be valid JSON.");
    }
  }

  return parsed;
}

const VARIANT_IMAGE_FIELD = /^variantImages\[\d+\]$/;

function rejectTextImageFields(body: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(body)) {
    const isImageField =
      key === "image" ||
      key === "images" ||
      key === "variantImage" ||
      key === "variantImages" ||
      VARIANT_IMAGE_FIELD.test(key);

    if (!isImageField || value === undefined || value === null) {
      continue;
    }

    if (typeof value === "string" && value.trim() === "") {
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    throw new BadRequestError(
      `"${key}" arrived as text, not as a file. In Postman set the body to form-data, change that row's type from Text to File, and use "images" (or "variantImages[0]" for a variant).`,
    );
  }
}

export class MenuController {
  create = async (
    req: Request<{}, {}, CreateMenuDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const files = collectUploadedFiles(req.files);

    let dto: CreateMenuDto;
    let upload: MenuUploadFiles;

    try {
      const body = parseMenuBody(req.body);
      rejectTextImageFields(body);
      dto = parseWith(createMenuSchema, body);
      upload = groupMenuUploadFiles(files);
      assertMenuUploadLimits(upload, dto.variants.length);

      if (files.length === 0) {
        console.warn(
          `[menu.create] No image files received. content-type="${req.headers["content-type"] ?? "none"}"`,
        );
      }
    } catch (error) {
      await storage.deleteMany(files.map((file) => file.filename));
      next(error);
      return;
    }

    try {
      const menu = await menuService.create(dto, upload);

      res.status(201).json({
        success: true,
        message: "Menu item created successfully.",
        imagesReceived: files.length,
        data: menu,
      });
    } catch (error) {
      next(error);
    }
  };

  findAll = async (
    req: Request<{}, {}, {}, { page?: string; limit?: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);

      const result = await menuService.findAll(page, limit);

      res.status(200).json({
        success: true,
        message: "Menu items retrieved successfully.",
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET MENU BY ID
  findById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const menu = await menuService.findById(
        parseUuid(req.params.id, "Menu id"),
      );

      res.status(200).json({
        success: true,
        message: "Menu item retrieved successfully.",
        data: menu,
      });
    } catch (error) {
      next(error);
    }
  };

  // UPDATE MENU
  update = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = parseUuid(req.params.id, "Menu id");
      const body = parseMenuBody(req.body);
      rejectTextImageFields(body);
      const dto = parseWith(updateMenuSchema, body);
      const menu = await menuService.update(id, dto);

      res.status(200).json({
        success: true,
        message: "Menu item updated successfully.",
        data: menu,
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE MENU
  delete = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await menuService.delete(parseUuid(req.params.id, "Menu id"));

      res.status(200).json({
        success: true,
        message: "Menu item deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const menuController = new MenuController();
