import type { User } from "@/features/auth/types";
import type { PaginationMeta } from "@/lib/api";

export interface UsersResult {
  items: User[];
  pagination: PaginationMeta;
}
