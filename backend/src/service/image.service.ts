import { asc, count, eq } from "drizzle-orm";

import { db } from "../config/db";
import { menu, menuVariants, menuImages } from "../db/schema";
import {
  MAX_IMAGES_PER_MENU,
  MAX_IMAGES_PER_VARIANT,
  MENU_IMAGE_URL_PREFIX,
} from "../config/storage.config";

import { BadRequestError, NotFoundError } from "../errors/app-error";
import { LocalStorageService } from "../common/services/local-storage.service";

export class ImageService {
  private readonly storage = new LocalStorageService();

  async uploadToMenu(menuId: string, files: Express.Multer.File[]) {
    const [existingMenu] = await db
      .select({ id: menu.id })
      .from(menu)
      .where(eq(menu.id, menuId))
      .limit(1);

    if (!existingMenu) {
      await this.cleanupFiles(files);
      throw new NotFoundError("Menu item not found.");
    }

    const [imageCount] = await db
      .select({ total: count() })
      .from(menuImages)
      .where(eq(menuImages.menuId, menuId));

    const existingCount = imageCount?.total ?? 0;

    if (existingCount + files.length > MAX_IMAGES_PER_MENU) {
      await this.cleanupFiles(files);
      throw new BadRequestError(
        `A menu item can have at most ${MAX_IMAGES_PER_MENU} images.`,
      );
    }

    try {
      return await db
        .insert(menuImages)
        .values(
          files.map((file, index) => ({
            menuId,
            variantId: null,
            url: `${MENU_IMAGE_URL_PREFIX}/${file.filename}`,
            publicId: file.filename,
            altText: file.originalname,
            isPrimary: existingCount === 0 && index === 0,
            sortOrder: existingCount + index,
          })),
        )
        .returning();
    } catch (error) {
      await this.cleanupFiles(files);
      throw error;
    }
  }

  async uploadToVariant(variantId: string, files: Express.Multer.File[]) {
    const [existingVariant] = await db
      .select({ id: menuVariants.id })
      .from(menuVariants)
      .where(eq(menuVariants.id, variantId))
      .limit(1);

    if (!existingVariant) {
      await this.cleanupFiles(files);
      throw new NotFoundError("Menu variant not found.");
    }

    const [imageCount] = await db
      .select({ total: count() })
      .from(menuImages)
      .where(eq(menuImages.variantId, variantId));

    const existingCount = imageCount?.total ?? 0;

    if (existingCount + files.length > MAX_IMAGES_PER_VARIANT) {
      await this.cleanupFiles(files);
      throw new BadRequestError(
        `A variant can have at most ${MAX_IMAGES_PER_VARIANT} images.`,
      );
    }

    try {
      return await db
        .insert(menuImages)
        .values(
          files.map((file, index) => ({
            menuId: null,
            variantId,
            url: `${MENU_IMAGE_URL_PREFIX}/${file.filename}`,
            publicId: file.filename,
            altText: file.originalname,
            isPrimary: existingCount === 0 && index === 0,
            sortOrder: existingCount + index,
          })),
        )
        .returning();
    } catch (error) {
      await this.cleanupFiles(files);
      throw error;
    }
  }

  async delete(imageId: string): Promise<void> {
    const [image] = await db
      .select()
      .from(menuImages)
      .where(eq(menuImages.id, imageId))
      .limit(1);

    if (!image) {
      throw new NotFoundError("Image not found.");
    }

    await db.delete(menuImages).where(eq(menuImages.id, imageId));
    await this.storage.delete(image.publicId);

    if (!image.isPrimary) {
      return;
    }

    // Promote the next image for the same owner so every owner keeps a primary.
    const ownerCondition = image.menuId
      ? eq(menuImages.menuId, image.menuId)
      : eq(menuImages.variantId, image.variantId as string);

    const [nextImage] = await db
      .select({ id: menuImages.id })
      .from(menuImages)
      .where(ownerCondition)
      .orderBy(asc(menuImages.sortOrder), asc(menuImages.createdAt))
      .limit(1);

    if (nextImage) {
      await db
        .update(menuImages)
        .set({ isPrimary: true })
        .where(eq(menuImages.id, nextImage.id));
    }
  }

  private async cleanupFiles(files: Express.Multer.File[]): Promise<void> {
    await this.storage.deleteMany(files.map((file) => file.filename));
  }
}

export const imageService = new ImageService();
