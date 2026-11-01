import { BadRequestError } from "../../errors/app-error";
import {
  MAX_IMAGES_PER_MENU,
  MAX_IMAGES_PER_VARIANT,
} from "../../config/storage.config";

// Menu-level files use the "images" field.
// Variant files use "variantImages[<variant index>]", where the index matches
// the position of the variant in the `variants` JSON array.
const VARIANT_IMAGE_FIELD = /^variantImages\[(\d+)\]$/;

export interface MenuUploadFiles {
  menuImages: Express.Multer.File[];
  variantImages: Map<number, Express.Multer.File[]>;
}

export function collectUploadedFiles(
  files:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined,
): Express.Multer.File[] {
  if (!files) {
    return [];
  }

  return Array.isArray(files) ? files : Object.values(files).flat();
}

export function groupMenuUploadFiles(
  files: Express.Multer.File[],
): MenuUploadFiles {
  const menuImages: Express.Multer.File[] = [];
  const variantImages = new Map<number, Express.Multer.File[]>();

  for (const file of files) {
    if (file.fieldname === "images") {
      menuImages.push(file);
      continue;
    }

    const index = Number(VARIANT_IMAGE_FIELD.exec(file.fieldname)?.[1]);

    if (!Number.isSafeInteger(index) || index < 0) {
      throw new BadRequestError(
        `Unexpected file field "${file.fieldname}". Use "images" for menu images or "variantImages[index]" for variant images.`,
      );
    }

    const existing = variantImages.get(index) ?? [];
    existing.push(file);
    variantImages.set(index, existing);
  }

  return { menuImages, variantImages };
}

export function assertMenuUploadLimits(
  upload: MenuUploadFiles,
  variantCount: number,
): void {
  if (upload.menuImages.length > MAX_IMAGES_PER_MENU) {
    throw new BadRequestError(
      `A menu item can have at most ${MAX_IMAGES_PER_MENU} images.`,
    );
  }

  for (const [index, files] of upload.variantImages) {
    if (index >= variantCount) {
      throw new BadRequestError(
        `"variantImages[${index}]" does not match any variant. Add a variant at index ${index} or use the correct index.`,
      );
    }

    if (files.length > MAX_IMAGES_PER_VARIANT) {
      throw new BadRequestError(
        `A variant can have at most ${MAX_IMAGES_PER_VARIANT} images.`,
      );
    }
  }
}
