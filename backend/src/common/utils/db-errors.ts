const UNIQUE_VIOLATION_CODE = "23505";
const MAX_CAUSE_DEPTH = 5;

function hasPostgresCode(error: unknown, code: string, depth = 0): boolean {
  if (depth > MAX_CAUSE_DEPTH) {
    return false;
  }

  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("code" in error && error.code === code) {
    return true;
  }

  return "cause" in error && hasPostgresCode(error.cause, code, depth + 1);
}

export function isUniqueViolation(error: unknown): boolean {
  return hasPostgresCode(error, UNIQUE_VIOLATION_CODE);
}
