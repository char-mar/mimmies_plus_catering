import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ChefHat,
  Pencil,
  Plus,
  RefreshCw,
  Tags,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { useCategories, useMenuItems } from "@/features/menu/hooks";
import type { Category } from "@/features/menu/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { staggerContainer, staggerItem } from "@/lib/motion";

import { CategoryFormDialog } from "./CategoryFormDialog";
import { useDeleteCategory } from "./hooks";

export function CategoriesPage() {
  const categoriesQuery = useCategories();
  const menuQuery = useMenuItems();
  const deleteCategory = useDeleteCategory();
  const [formCategory, setFormCategory] = useState<
    Category | null | undefined
  >();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  const dishCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of menuQuery.data ?? []) {
      counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    }

    return counts;
  }, [menuQuery.data]);

  const countsReady = menuQuery.isSuccess;

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organise the menu into groups guests can browse. A category can only be deleted once it no longer holds any dishes."
        actions={
          <>
            <LinkButton
              to="/admin/menu"
              variant="secondary"
              leftIcon={<ChefHat className="size-4" aria-hidden="true" />}
            >
              Manage menu
            </LinkButton>
            <Button
              onClick={() => setFormCategory(null)}
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
            >
              New category
            </Button>
          </>
        }
      />

      <Alert tone="info">
        Categories with dishes cannot be deleted here. Reassign those dishes to
        another category first so no menu data is lost.
      </Alert>

      {menuQuery.isError ? (
        <Alert tone="warning" title="Dish counts are unavailable">
          <div className="flex flex-wrap items-center gap-2">
            <span>{getErrorMessage(menuQuery.error)}</span>
            <button
              type="button"
              onClick={() => void menuQuery.refetch()}
              disabled={menuQuery.isFetching}
              className="font-semibold underline underline-offset-2 disabled:opacity-60"
            >
              {menuQuery.isFetching ? "Retrying…" : "Try again"}
            </button>
            <span>Deletion stays disabled until counts load.</span>
          </div>
        </Alert>
      ) : null}

      {categoriesQuery.isPending ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16">
            <Spinner />
            <p className="text-sm text-stone-500">Loading categories…</p>
          </div>
        </Card>
      ) : categoriesQuery.isError ? (
        <Card className="p-6">
          <Alert tone="error" title="Could not load categories">
            {getErrorMessage(categoriesQuery.error)}
          </Alert>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => void categoriesQuery.refetch()}
              leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
            >
              Try again
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {categories.length === 0 ? (
            <EmptyState
              icon={<Tags className="size-5" aria-hidden="true" />}
              title="No categories yet"
              description="Create a category first, then add dishes to it from the menu manager."
              action={
                <Button
                  size="sm"
                  onClick={() => setFormCategory(null)}
                  leftIcon={<Plus className="size-4" aria-hidden="true" />}
                >
                  Create a category
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.12em] text-stone-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Dishes
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Updated
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-semibold"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <motion.tbody
                  className="divide-y divide-stone-100"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {categories.map((category) => {
                    const dishCount = dishCounts.get(category.id) ?? 0;
                    const inUse = countsReady && dishCount > 0;

                    return (
                      <motion.tr
                        key={category.id}
                        variants={staggerItem}
                        className="transition-colors hover:bg-stone-50/70"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                              <Tags
                                className="size-4"
                                aria-hidden="true"
                              />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-stone-900">
                                {category.name}
                              </p>
                              <p className="truncate font-mono text-xs text-stone-500">
                                /{category.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <Badge tone={inUse ? "brand" : "stone"}>
                              <UtensilsCrossed
                                className="size-3"
                                aria-hidden="true"
                              />
                              {countsReady
                                ? `${dishCount} ${dishCount === 1 ? "dish" : "dishes"}`
                                : "Counting…"}
                            </Badge>
                            {inUse ? (
                              <span className="text-[11px] text-stone-400">
                                In use
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">
                          {formatDate(category.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setFormCategory(category)}
                              leftIcon={
                                <Pencil
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={!countsReady || inUse}
                              title={
                                !countsReady
                                  ? "Delete becomes available once dish counts load."
                                  : inUse
                                    ? "Move or delete this category's dishes first."
                                    : undefined
                              }
                              onClick={() => setDeleteTarget(category)}
                              leftIcon={
                                <Trash2
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {formCategory !== undefined ? (
        <CategoryFormDialog
          category={formCategory}
          onClose={() => setFormCategory(undefined)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete category"
        description={`Delete ${deleteTarget?.name ?? "this category"}? This cannot be undone.`}
        confirmLabel="Delete category"
        tone="danger"
        loading={deleteCategory.isPending}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleteCategory.isPending) {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
