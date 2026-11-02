import { apiRequest } from "@/lib/api";
import type { Category } from "@/features/menu/types";

export interface CategoryInput {
  name: string;
  slug?: string;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const response = await apiRequest<Category>("/categories", {
    method: "POST",
    body: input,
  });

  return response.data;
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<Category> {
  const response = await apiRequest<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest<null>(`/categories/${id}`, { method: "DELETE" });
}
