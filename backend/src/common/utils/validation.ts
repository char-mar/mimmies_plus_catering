import { z } from "zod";
import type { ZodType } from "zod";

import { BadRequestError } from "../../errors/app-error";

export function parseWith<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const field = issue.path.join(".");
        return field ? `${field}: ${issue.message}` : issue.message;
      })
      .join("; ");

    throw new BadRequestError(message);
  }

  return result.data;
}

export function parseUuid(value: string, name = "id"): string {
  const result = z.uuid().safeParse(value);

  if (!result.success) {
    throw new BadRequestError(`${name} must be a valid UUID.`);
  }

  return result.data;
}
