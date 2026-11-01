import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";

import { AppError } from "../errors/app-error";
import {
  MAX_FILES_PER_REQUEST,
  MAX_IMAGE_SIZE_BYTES,
} from "../config/storage.config";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const maxFileSizeMb = MAX_IMAGE_SIZE_BYTES / (1024 * 1024);

    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: `Each image must be ${maxFileSizeMb} MB or smaller.`,
      LIMIT_FILE_COUNT: `You can upload at most ${MAX_FILES_PER_REQUEST} files per request.`,
      LIMIT_UNEXPECTED_FILE: `Unexpected file field "${error.field ?? ""}".`,
    };

    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

    res.status(status).json({
      success: false,
      message: messages[error.code] ?? error.message,
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
};
