import { asc, count, eq, inArray } from "drizzle-orm";

import { db } from "../config/db";
import { categories, menu, menuVariants, menuImages } from "../db/schema";
import { MENU_IMAGE_URL_PREFIX } from "../config/storage.config";

import type { CreateMenuDto, UpdateMenuDto } from "../dto/menu.dto";
import type { MenuUploadFiles } from "../common/utils/menu-upload";

import { BadRequestError, NotFoundError } from "../errors/app-error";
import { LocalStorageService } from "../common/services/local-storage.service";

import { buildPagination, getPagination } from "../common/utils/pagination";

import type { PaginatedResponse } from "../common/types/pagination.types";

type Menu = typeof menu.$inferSelect;
type MenuVariant = typeof menuVariants.$inferSelect;
type MenuImage = typeof menuImages.$inferSelect;

type MenuWithVariants = Menu & {
  variants: (MenuVariant & { images: MenuImage[] })[];
  images: MenuImage[];
};

type MenuWithDetails = MenuWithVariants & {
  category: {
    id: string;
    name: string;
  } | null;
};

export class MenuService {
  private readonly storage = new LocalStorageService();

  async create(
    dto: CreateMenuDto,
    upload: MenuUploadFiles,
  ): Promise<MenuWithVariants> {
    const allFiles = [
      ...upload.menuImages,
      ...[...upload.variantImages.values()].flat(),
    ];

    try {
      return await db.transaction(async (tx) => {
        const [category] = await tx
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.id, dto.categoryId))
          .limit(1);

        if (!category) {
          throw new NotFoundError("Category not found.");
        }

        const [createdMenu] = await tx
          .insert(menu)
          .values({
            categoryId: dto.categoryId,
            name: dto.name,
            description: dto.description,
          })
          .returning();

        if (!createdMenu) {
          throw new Error("Failed to create menu item.");
        }

        const variants = dto.variants.length
          ? await tx
              .insert(menuVariants)
              .values(
                dto.variants.map((variant) => ({
                  menuId: createdMenu.id,
                  size: variant.size,
                  price: variant.price,
                })),
              )
              .returning()
          : [];

        const imageRows: (typeof menuImages.$inferInsert)[] = [
          ...upload.menuImages.map((file, index) => ({
            menuId: createdMenu.id,
            variantId: null,
            url: `${MENU_IMAGE_URL_PREFIX}/${file.filename}`,
            publicId: file.filename,
            altText: dto.name,
            isPrimary: index === 0,
            sortOrder: index,
          })),
          ...variants.flatMap((variant, variantIndex) =>
            (upload.variantImages.get(variantIndex) ?? []).map(
              (file, index) => ({
                menuId: null,
                variantId: variant.id,
                url: `${MENU_IMAGE_URL_PREFIX}/${file.filename}`,
                publicId: file.filename,
                altText: variant.size
                  ? `${dto.name} ${variant.size}`
                  : dto.name,
                isPrimary: index === 0,
                sortOrder: index,
              }),
            ),
          ),
        ];

        const createdImages = imageRows.length
          ? await tx.insert(menuImages).values(imageRows).returning()
          : [];

        return {
          ...createdMenu,
          variants: variants.map((variant) => ({
            ...variant,
            images: createdImages.filter(
              (image) => image.variantId === variant.id,
            ),
          })),
          images: createdImages.filter(
            (image) => image.menuId === createdMenu.id,
          ),
        };
      });
    } catch (error) {
      await this.storage.deleteMany(allFiles.map((file) => file.filename));
      throw error;
    }
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<MenuWithDetails>> {
    const pagination = getPagination(page, limit);

    const [totalResult] = await db.select({ total: count() }).from(menu);

    const total = totalResult?.total ?? 0;

    const menuItems = await db
      .select({
        menu: menu,
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(menu)
      .leftJoin(categories, eq(menu.categoryId, categories.id))
      .orderBy(asc(menu.name), asc(menu.id))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const menuIds = menuItems.map(({ menu }) => menu.id);

    const variants = menuIds.length
      ? await db
          .select()
          .from(menuVariants)
          .where(inArray(menuVariants.menuId, menuIds))
      : [];

    const variantIds = variants.map((variant) => variant.id);

    const variantImages = variantIds.length
      ? await db
          .select()
          .from(menuImages)
          .where(inArray(menuImages.variantId, variantIds))
      : [];

    const variantsMap = new Map<string, MenuVariant[]>();

    for (const variant of variants) {
      const existing = variantsMap.get(variant.menuId) ?? [];

      existing.push(variant);
      variantsMap.set(variant.menuId, existing);
    }

    const images = menuIds.length
      ? await db
          .select()
          .from(menuImages)
          .where(inArray(menuImages.menuId, menuIds))
      : [];

    const items: MenuWithDetails[] = menuItems.map(({ menu, category }) => ({
      ...menu,
      category,
      variants: (variantsMap.get(menu.id) ?? []).map((variant) => ({
        ...variant,
        images: variantImages.filter((image) => image.variantId === variant.id),
      })),
      images: images.filter((image) => image.menuId === menu.id),
    }));

    return {
      items,
      pagination: buildPagination(total, pagination.page, pagination.limit),
    };
  }

  async findById(id: string): Promise<MenuWithDetails> {
    const [row] = await db
      .select({
        menu,
        category: { id: categories.id, name: categories.name },
      })
      .from(menu)
      .leftJoin(categories, eq(menu.categoryId, categories.id))
      .where(eq(menu.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundError("Menu item not found.");
    }

    const variants = await db
      .select()
      .from(menuVariants)
      .where(eq(menuVariants.menuId, id));

    const variantIds = variants.map((variant) => variant.id);

    const images = await db
      .select()
      .from(menuImages)
      .where(eq(menuImages.menuId, id));

    const variantImages = variantIds.length
      ? await db
          .select()
          .from(menuImages)
          .where(inArray(menuImages.variantId, variantIds))
      : [];

    return {
      ...row.menu,
      category: row.category,
      variants: variants.map((variant) => ({
        ...variant,
        images: variantImages.filter((image) => image.variantId === variant.id),
      })),
      images,
    };
  }

  async update(id: string, dto: UpdateMenuDto): Promise<MenuWithVariants> {
    const result = await db.transaction(async (tx) => {
      // Variants removed by this update cascade-delete their image rows; keep
      // the filenames so the physical files can be removed after commit.
      let staleFilenames: string[] = [];

      const [existingMenu] = await tx
        .select()
        .from(menu)
        .where(eq(menu.id, id))
        .limit(1);

      if (!existingMenu) {
        throw new NotFoundError("Menu item not found.");
      }

      if (dto.categoryId) {
        const [category] = await tx
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.id, dto.categoryId))
          .limit(1);

        if (!category) {
          throw new NotFoundError("Category not found.");
        }
      }

      const updateData = {
        ...(dto.categoryId !== undefined && {
          categoryId: dto.categoryId,
        }),
        ...(dto.name !== undefined && {
          name: dto.name,
        }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
      };

      if (Object.keys(updateData).length > 0) {
        await tx.update(menu).set(updateData).where(eq(menu.id, id));
      }

      // Update variants in place so existing variant IDs (and their images)
      // survive. Only variants omitted from the payload are deleted.
      if (dto.variants !== undefined) {
        const existingVariants = await tx
          .select()
          .from(menuVariants)
          .where(eq(menuVariants.menuId, id));

        const existingIds = new Set(
          existingVariants.map((variant) => variant.id),
        );
        const keptIds = new Set<string>();

        for (const variant of dto.variants) {
          if (variant.id) {
            if (!existingIds.has(variant.id)) {
              throw new BadRequestError(
                `Variant ${variant.id} does not belong to this menu item.`,
              );
            }

            keptIds.add(variant.id);

            await tx
              .update(menuVariants)
              .set({ size: variant.size, price: variant.price })
              .where(eq(menuVariants.id, variant.id));
          } else {
            const inserted = await tx
              .insert(menuVariants)
              .values({
                menuId: id,
                size: variant.size,
                price: variant.price,
              })
              .returning({ id: menuVariants.id });

            const insertedVariant = inserted[0];

            if (!insertedVariant) {
              throw new Error("Failed to create menu variant.");
            }

            keptIds.add(insertedVariant.id);
          }
        }

        const removedIds = existingVariants
          .filter((variant) => !keptIds.has(variant.id))
          .map((variant) => variant.id);

        if (removedIds.length > 0) {
          const removedImages = await tx
            .select({ publicId: menuImages.publicId })
            .from(menuImages)
            .where(inArray(menuImages.variantId, removedIds));

          staleFilenames = removedImages.map((image) => image.publicId);

          await tx
            .delete(menuVariants)
            .where(inArray(menuVariants.id, removedIds));
        }
      }

      const [updatedMenu] = await tx
        .select()
        .from(menu)
        .where(eq(menu.id, id))
        .limit(1);

      if (!updatedMenu) {
        throw new NotFoundError("Menu item not found.");
      }

      const variants = await tx
        .select()
        .from(menuVariants)
        .where(eq(menuVariants.menuId, id));

      const variantIds = variants.map((variant) => variant.id);

      const images = await tx
        .select()
        .from(menuImages)
        .where(eq(menuImages.menuId, id));

      const variantImages = variantIds.length
        ? await tx
            .select()
            .from(menuImages)
            .where(inArray(menuImages.variantId, variantIds))
        : [];

      return {
        menu: {
          ...updatedMenu,
          variants: variants.map((variant) => ({
            ...variant,
            images: variantImages.filter(
              (image) => image.variantId === variant.id,
            ),
          })),
          images,
        },
        staleFilenames,
      };
    });

    await this.storage.deleteMany(result.staleFilenames);

    return result.menu;
  }

  async delete(id: string): Promise<void> {
    const [existingMenu] = await db
      .select({ id: menu.id })
      .from(menu)
      .where(eq(menu.id, id))
      .limit(1);

    if (!existingMenu) {
      throw new NotFoundError("Menu item not found.");
    }

    const variants = await db
      .select({ id: menuVariants.id })
      .from(menuVariants)
      .where(eq(menuVariants.menuId, id));

    const variantIds = variants.map((variant) => variant.id);

    const menuImageFiles = await db
      .select({ publicId: menuImages.publicId })
      .from(menuImages)
      .where(eq(menuImages.menuId, id));

    const variantImageFiles = variantIds.length
      ? await db
          .select({ publicId: menuImages.publicId })
          .from(menuImages)
          .where(inArray(menuImages.variantId, variantIds))
      : [];

    // Database cascades delete variants and image records.
    await db.delete(menu).where(eq(menu.id, id));

    await this.storage.deleteMany(
      [...menuImageFiles, ...variantImageFiles].map((image) => image.publicId),
    );
  }
}

export const menuService = new MenuService();
