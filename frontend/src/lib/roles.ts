import type { UserRole } from "@/features/auth/types";

// Mirrors the backend hierarchy: a higher role satisfies every check a lower
// role satisfies, so SUPER_ADMIN can do everything an ADMIN can.
const ACCESS_LEVEL: Record<UserRole, number> = {
  CUSTOMER: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  CUSTOMER: "Customer",
};

export const ROLE_TONES: Record<UserRole, "brand" | "blue" | "stone"> = {
  SUPER_ADMIN: "brand",
  ADMIN: "blue",
  CUSTOMER: "stone",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: "Full access, including managing roles across the team.",
  ADMIN: "Manage the menu, orders and customer accounts.",
  CUSTOMER: "Browse the menu, place orders and track deliveries.",
};

export function hasRequiredRole(
  userRole: UserRole,
  allowedRoles: readonly UserRole[],
): boolean {
  if (allowedRoles.length === 0) {
    return true;
  }

  const requiredLevel = Math.min(
    ...allowedRoles.map((role) => ACCESS_LEVEL[role]),
  );

  return ACCESS_LEVEL[userRole] >= requiredLevel;
}
