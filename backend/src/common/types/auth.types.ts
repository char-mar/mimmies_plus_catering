import type { UserRole } from "../constants/roles";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
