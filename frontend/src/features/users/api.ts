import { apiRequest } from "@/lib/api";
import type { User, UserRole } from "@/features/auth/types";

import type { UsersResult } from "./types";

export async function listUsers({
  page,
  limit,
}: {
  page: number;
  limit: number;
}): Promise<UsersResult> {
  const response = await apiRequest<User[]>("/users", {
    query: { page, limit },
  });

  return {
    items: response.data,
    pagination: response.pagination ?? {
      page,
      limit,
      total: response.data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

export async function updateUserRole(
  id: string,
  role: UserRole,
): Promise<User> {
  const response = await apiRequest<User>(`/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  });

  return response.data;
}

export async function updateUserStatus(
  id: string,
  isActive: boolean,
): Promise<User> {
  const response = await apiRequest<User>(`/users/${id}/status`, {
    method: "PATCH",
    body: { isActive },
  });

  return response.data;
}
