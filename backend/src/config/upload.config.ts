import multer from "multer";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

import { BadRequestError } from "../errors/app-error";
import {
  MAX_FILES_PER_REQUEST,
  MAX_IMAGE_SIZE_BYTES,
  MENU_IMAGE_DIRECTORY,
} from "./storage.config";

// Create directory automatically if it doesn't exist.
fs.mkdirSync(MENU_IMAGE_DIRECTORY, { recursive: true });

// Derive the stored extension from the detected MIME type instead of trusting
// the client-provided filename extension.
const allowedMimeTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, MENU_IMAGE_DIRECTORY);
  },

  filename: (_req, file, callback) => {
    const extension = allowedMimeTypes[file.mimetype];

    if (!extension) {
      callback(new BadRequestError("Unsupported image type."), "");
      return;
    }

    callback(null, `${randomUUID()}${extension}`);
  },
});

export const uploadImages = multer({
  storage,

  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: MAX_FILES_PER_REQUEST,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes[file.mimetype]) {
      callback(
        new BadRequestError(
          "Only JPEG, PNG, WebP and AVIF images are allowed.",
        ),
      );
      return;
    }

    callback(null, true);
  },
});
