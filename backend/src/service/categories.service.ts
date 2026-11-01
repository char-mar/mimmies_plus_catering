import { eq, asc } from "drizzle-orm";

import { db } from "../config/db";
import { categories } from "../db/schema";
import type { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";
import { ConflictError, NotFoundError } from "../errors/app-error";
import { slugify } from "../common/utils/slug";

type Category = typeof categories.$inferSelect;

function isPostgresError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23503"
  );
}

export class CategoryService {
  async create(dto: CreateCategoryDto): Promise<Category> {
    const name = dto.name.trim();
    const slug = slugify(dto.slug?.trim() || name);

    try {
      const [category] = await db
        .insert(categories)
        .values({ name, slug })
        .returning();

      if (!category) {
        throw new Error("Failed to retrieve the created category.");
      }

      return category;
    } catch (error: unknown) {
      if (isPostgresError(error, "23505")) {
        throw new ConflictError(
          "A category with this name or slug already exists.",
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<Category[]> {
    const result = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name));

    return result;
  }

  async findById(id: string): Promise<Category> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const existing = await this.findById(id);

    const name = dto.name === undefined ? undefined : dto.name.trim();

    const slug =
      dto.slug !== undefined
        ? slugify(dto.slug.trim())
        : name !== undefined
          ? slugify(name)
          : undefined;

    const values: Partial<typeof categories.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      values.name = name;
    }

    if (slug !== undefined) {
      values.slug = slug;
    }

    if (name === undefined && slug === undefined) {
      return existing;
    }

    try {
      const [updatedCategory] = await db
        .update(categories)
        .set(values)
        .where(eq(categories.id, id))
        .returning();

      if (!updatedCategory) {
        throw new NotFoundError("Category not found.");
      }

      return updatedCategory;
    } catch (error: unknown) {
      if (isPostgresError(error, "23505")) {
        throw new ConflictError(
          "A category with this name or slug already exists.",
        );
      }

      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);

    try {
      await db.delete(categories).where(eq(categories.id, id));
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictError(
          "This category cannot be deleted because it is being used by other records.",
        );
      }

      throw error;
    }
  }
}

export const categoryService = new CategoryService();
