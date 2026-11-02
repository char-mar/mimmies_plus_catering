export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_MENU_IMAGES = 10;
export const MAX_VARIANT_IMAGES = 10;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export function validateImageFiles(
  files: File[],
  currentCount: number,
  max: number,
): string | null {
  if (currentCount + files.length > max) {
    return `You can upload at most ${max} photos here. Remove some first.`;
  }

  const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type));

  if (invalidType) {
    return `${invalidType.name} is not a supported image. Use JPEG, PNG, WebP, or AVIF.`;
  }

  const oversized = files.find((file) => file.size > MAX_IMAGE_BYTES);

  if (oversized) {
    return `${oversized.name} is larger than 5 MB.`;
  }

  return null;
}
