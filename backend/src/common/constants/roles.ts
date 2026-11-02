export const userRoles = ["SUPER_ADMIN", "ADMIN", "CUSTOMER"] as const;

export type UserRole = (typeof userRoles)[number];

export const managementRoles: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export function isManagementRole(role: UserRole): boolean {
  return managementRoles.includes(role);
}
