import { apiRequest } from "@/lib/api";

import type { Category, MenuItem } from "./types";

// The backend caps page size at 100 and exposes no search or category filter,
// so the page loads every item once and filters client-side.
const MENU_PAGE_SIZE = 100;

export async function listCategories(): Promise<Category[]> {
  const response = await apiRequest<Category[]>("/categories", {
    auth: false,
  });

  return response.data;
}

export async function getMenuItem(id: string): Promise<MenuItem> {
  const response = await apiRequest<MenuItem>(`/menu/${id}`, {
    auth: false,
  });

  return response.data;
}

export async function listMenuItems(): Promise<MenuItem[]> {
  const items: MenuItem[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await apiRequest<MenuItem[]>("/menu", {
      query: { page, limit: MENU_PAGE_SIZE },
      auth: false,
    });

    items.push(...response.data);
    totalPages = response.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return items;
}
