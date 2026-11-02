export const userRoles = ["SUPER_ADMIN", "ADMIN", "CUSTOMER"] as const;

export type UserRole = (typeof userRoles)[number];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface User extends AuthUser {
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionData {
  user: User;
  accessToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}
