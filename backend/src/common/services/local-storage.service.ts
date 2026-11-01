import fs from "node:fs/promises";
import path from "node:path";

import { MENU_IMAGE_DIRECTORY } from "../../config/storage.config";

export class LocalStorageService {
  private readonly uploadDirectory = MENU_IMAGE_DIRECTORY;

  async delete(filename: string): Promise<void> {
    // Prevent directory traversal.
    if (!filename || path.basename(filename) !== filename) {
      throw new Error("Invalid filename.");
    }

    const filePath = path.join(this.uploadDirectory, filename);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore files that have already been deleted.
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }

      throw error;
    }
  }

  // Cleanup should be best-effort: one missing or locked file must not prevent
  // the remaining files from being removed.
  async deleteMany(filenames: string[]): Promise<void> {
    const results = await Promise.allSettled(
      filenames.map((filename) => this.delete(filename)),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Failed to delete uploaded file:", result.reason);
      }
    }
  }
}
