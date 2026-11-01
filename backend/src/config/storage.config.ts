import path from "node:path";

export const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");

export const MENU_IMAGE_DIRECTORY = path.join(UPLOAD_ROOT, "menus");
export const MENU_IMAGE_URL_PREFIX = "/uploads/menus";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 20;
export const MAX_IMAGES_PER_MENU = 10;
export const MAX_IMAGES_PER_VARIANT = 10;
