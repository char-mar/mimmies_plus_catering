import { apiRequest } from "@/lib/api";
import type { MenuImage, MenuItem } from "@/features/menu/types";

import type { CreateMenuItemInput, MenuDetailsInput } from "./types";

export async function createMenuItem(
  input: CreateMenuItemInput,
): Promise<MenuItem> {
  const form = new FormData();

  form.append("categoryId", input.categoryId);
  form.append("name", input.name);

  if (input.description) {
    form.append("description", input.description);
  }

  form.append(
    "variants",
    JSON.stringify(
      input.variants.map((variant) => ({
        size: variant.size,
        price: variant.price,
      })),
    ),
  );

  for (const file of input.menuImages) {
    form.append("images", file);
  }

  input.variantImages.forEach((files, index) => {
    for (const file of files) {
      form.append(`variantImages[${index}]`, file);
    }
  });

  const response = await apiRequest<MenuItem>("/menu", {
    method: "POST",
    body: form,
  });

  return response.data;
}

export async function updateMenuItem(
  id: string,
  input: MenuDetailsInput,
): Promise<void> {
  await apiRequest<unknown>(`/menu/${id}`, {
    method: "PATCH",
    body: {
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? "",
      variants: input.variants.map((variant) => ({
        ...(variant.id ? { id: variant.id } : {}),
        size: variant.size,
        price: variant.price,
      })),
    },
  });
}

export async function deleteMenuItem(id: string): Promise<void> {
  await apiRequest<unknown>(`/menu/${id}`, { method: "DELETE" });
}

export async function uploadMenuImages(
  menuId: string,
  files: File[],
): Promise<MenuImage[]> {
  const form = new FormData();

  for (const file of files) {
    form.append("images", file);
  }

  const response = await apiRequest<MenuImage[]>(`/images/menu/${menuId}`, {
    method: "POST",
    body: form,
  });

  return response.data;
}

export async function uploadVariantImages(
  variantId: string,
  files: File[],
): Promise<MenuImage[]> {
  const form = new FormData();

  for (const file of files) {
    form.append("images", file);
  }

  const response = await apiRequest<MenuImage[]>(`/images/variant/${variantId}`, {
    method: "POST",
    body: form,
  });

  return response.data;
}

export async function deleteMenuImage(imageId: string): Promise<void> {
  await apiRequest<unknown>(`/images/${imageId}`, { method: "DELETE" });
}
