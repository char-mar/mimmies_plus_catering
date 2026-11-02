import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getErrorMessage } from "@/lib/errors";
import { categoryKeys, menuKeys } from "@/lib/query-keys";

import * as categoriesApi from "./api";
import type { CategoryInput } from "./api";

function useInvalidateCatalog() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    void queryClient.invalidateQueries({ queryKey: menuKeys.all });
  };
}

export function useCreateCategory() {
  const invalidateCatalog = useInvalidateCatalog();

  return useMutation({
    mutationFn: (input: CategoryInput) => categoriesApi.createCategory(input),
    onSuccess: (category) => {
      toast.success(`${category.name} was created.`);
      invalidateCatalog();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateCategory() {
  const invalidateCatalog = useInvalidateCatalog();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
      categoriesApi.updateCategory(id, input),
    onSuccess: (category) => {
      toast.success(`${category.name} was updated.`);
      invalidateCatalog();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteCategory() {
  const invalidateCatalog = useInvalidateCatalog();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted.");
      invalidateCatalog();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
