import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getErrorMessage } from "@/lib/errors";
import { categoryKeys, menuKeys } from "@/lib/query-keys";

import * as menuApi from "./api";
import type { CreateMenuItemInput, MenuDetailsInput } from "./types";

function imageCountLabel(count: number): string {
  return `${count} ${count === 1 ? "photo" : "photos"}`;
}

function useInvalidateCatalog() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: menuKeys.all });
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
  };
}

export function useCreateMenuItem() {
  const invalidateCatalog = useInvalidateCatalog();

  return useMutation({
    mutationFn: (input: CreateMenuItemInput) => menuApi.createMenuItem(input),
    onSuccess: (item) => {
      toast.success(`${item.name} was added to the menu.`);
      invalidateCatalog();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateMenuItem() {
  const invalidateCatalog = useInvalidateCatalog();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MenuDetailsInput }) =>
      menuApi.updateMenuItem(id, input),
    onSuccess: (_result, { input }) => {
      toast.success(`${input.name} was updated.`);
      invalidateCatalog();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteMenuItem() {
  const invalidateCatalog = useInvalidateCatalog();

  return useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      menuApi.deleteMenuItem(id),
    onSuccess: (_result, { name }) => {
      toast.success(`${name} was deleted.`);
      invalidateCatalog();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUploadMenuImages() {
  const invalidateCatalog = useInvalidateCatalog();

  return useMutation({
    mutationFn: ({ menuId, files }: { menuId: string; files: File[] }) =>
      menuApi.uploadMenuImages(menuId, files),
    onSuccess: (images) => {
      toast.success(`${imageCountLabel(images.length)} uploaded.`);
      invalidateCatalog();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUploadVariantImages() {
  const invalidateCatalog = useInvalidateCatalog();

  return useMutation({
    mutationFn: ({ variantId, files }: { variantId: string; files: File[] }) =>
      menuApi.uploadVariantImages(variantId, files),
    onSuccess: (images) => {
      toast.success(`${imageCountLabel(images.length)} uploaded.`);
      invalidateCatalog();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteMenuImage() {
  const invalidateCatalog = useInvalidateCatalog();

  return useMutation({
    mutationFn: ({ imageId }: { imageId: string }) =>
      menuApi.deleteMenuImage(imageId),
    onSuccess: () => {
      toast.success("Photo deleted.");
      invalidateCatalog();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
