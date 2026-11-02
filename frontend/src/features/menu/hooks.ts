import { useQuery } from "@tanstack/react-query";

import { categoryKeys, menuKeys } from "@/lib/query-keys";

import * as menuApi from "./api";

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: menuApi.listCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMenuItems() {
  return useQuery({
    queryKey: menuKeys.list(),
    queryFn: menuApi.listMenuItems,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMenuItem(id: string | undefined) {
  return useQuery({
    queryKey: menuKeys.detail(id ?? ""),
    queryFn: () => {
      if (!id) {
        throw new Error("A menu item id is required.");
      }

      return menuApi.getMenuItem(id);
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
