import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ChefHat,
  Images,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LinkButton,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";
import { useCategories, useMenuItems } from "@/features/menu/hooks";
import type { MenuImage, MenuItem } from "@/features/menu/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatPrice } from "@/lib/format";
import { staggerContainer, staggerItem } from "@/lib/motion";

import { useDeleteMenuItem } from "./hooks";
import { MenuFormDialog } from "./MenuFormDialog";
import { MenuImagesDialog } from "./MenuImagesDialog";

const ALL_CATEGORIES = "all";

function primaryImage(item: MenuItem): MenuImage | null {
  const images = [
    ...item.images,
    ...item.variants.flatMap((variant) => variant.images),
  ];

  return images.find((image) => image.isPrimary) ?? images[0] ?? null;
}

function photoCount(item: MenuItem): number {
  return (
    item.images.length +
    item.variants.reduce(
      (total, variant) => total + variant.images.length,
      0,
    )
  );
}

function minimumPrice(item: MenuItem): number | null {
  const prices = item.variants
    .map((variant) => Number(variant.price))
    .filter(Number.isFinite);

  return prices.length > 0 ? Math.min(...prices) : null;
}

function Thumbnail({ item }: { item: MenuItem }) {
  const image = primaryImage(item);
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-100 text-brand-600">
      {image && !failed ? (
        <img
          src={image.url}
          alt={image.altText ?? item.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <ChefHat className="size-5" aria-hidden="true" />
      )}
    </div>
  );
}

type FormState = { mode: "create" } | { mode: "edit"; id: string };

export function MenuManagementPage() {
  const categoriesQuery = useCategories();
  const menuQuery = useMenuItems();
  const deleteMenuItem = useDeleteMenuItem();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [imagesItemId, setImagesItemId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const deferredSearch = useDeferredValue(search);

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const items = useMemo(() => menuQuery.data ?? [], [menuQuery.data]);

  const filteredItems = useMemo(() => {
    const tokens = deferredSearch
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return items.filter((item) => {
      if (
        activeCategory !== ALL_CATEGORIES &&
        item.categoryId !== activeCategory
      ) {
        return false;
      }

      if (tokens.length === 0) {
        return true;
      }

      const haystack = [
        item.name,
        item.description ?? "",
        item.category?.name ?? "",
        ...item.variants.map((variant) => variant.size ?? ""),
      ]
        .join(" ")
        .toLowerCase();

      return tokens.every((token) => haystack.includes(token));
    });
  }, [activeCategory, deferredSearch, items]);

  const editingItem =
    formState?.mode === "edit"
      ? (items.find((item) => item.id === formState.id) ?? null)
      : null;

  const imagesItem = imagesItemId
    ? (items.find((item) => item.id === imagesItemId) ?? null)
    : null;

  const hasFilters =
    search.trim().length > 0 || activeCategory !== ALL_CATEGORIES;

  const clearFilters = () => {
    setSearch("");
    setActiveCategory(ALL_CATEGORIES);
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    deleteMenuItem.mutate(
      { id: deleteTarget.id, name: deleteTarget.name },
      { onSuccess: () => setDeleteTarget(null) },
    );
  };

  const categoriesEmpty =
    categoriesQuery.isSuccess && categories.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu"
        description="Create dishes, set variant prices, and control the photos guests see on the public menu."
        actions={
          <>
            <LinkButton
              to="/admin/categories"
              variant="secondary"
              leftIcon={<Tags className="size-4" aria-hidden="true" />}
            >
              Categories
            </LinkButton>
            <Button
              onClick={() => setFormState({ mode: "create" })}
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
            >
              Add dish
            </Button>
          </>
        }
      />

      {categoriesQuery.isError ? (
        <Alert tone="warning" title="Categories are unavailable">
          <div className="flex flex-wrap items-center gap-2">
            <span>{getErrorMessage(categoriesQuery.error)}</span>
            <button
              type="button"
              onClick={() => void categoriesQuery.refetch()}
              disabled={categoriesQuery.isFetching}
              className="font-semibold underline underline-offset-2 disabled:opacity-60"
            >
              {categoriesQuery.isFetching ? "Retrying…" : "Try again"}
            </button>
          </div>
        </Alert>
      ) : categoriesEmpty ? (
        <Alert tone="warning" title="No categories yet">
          Every dish belongs to a category.{" "}
          <Link
            to="/admin/categories"
            className="font-semibold underline underline-offset-2"
          >
            Create a category
          </Link>{" "}
          before adding dishes.
        </Alert>
      ) : null}

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Search dishes"
              value={search}
              placeholder="Name, description, size, or category…"
              leftIcon={<Search className="size-4" aria-hidden="true" />}
              rightSlot={
                search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="flex size-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null
              }
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="sm:w-56">
            <Select
              label="Category"
              value={activeCategory}
              onChange={(event) => setActiveCategory(event.target.value)}
            >
              <option value={ALL_CATEGORIES}>All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="secondary"
            onClick={() => void menuQuery.refetch()}
            loading={menuQuery.isFetching && !menuQuery.isPending}
            aria-label="Refresh menu"
            title="Refresh menu"
            leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
          <p className="text-xs text-stone-500">
            {menuQuery.isPending
              ? "Loading dishes…"
              : hasFilters
                ? `${filteredItems.length} of ${items.length} ${
                    items.length === 1 ? "dish" : "dishes"
                  }`
                : `${items.length} ${items.length === 1 ? "dish" : "dishes"}`}
          </p>
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              leftIcon={<X className="size-3.5" aria-hidden="true" />}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      {menuQuery.isPending ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16">
            <Spinner />
            <p className="text-sm text-stone-500">Loading menu…</p>
          </div>
        </Card>
      ) : menuQuery.isError ? (
        <Card className="p-6">
          <Alert tone="error" title="Could not load the menu">
            {getErrorMessage(menuQuery.error)}
          </Alert>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => void menuQuery.refetch()}
              leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
            >
              Try again
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {items.length === 0 ? (
            <EmptyState
              icon={<ChefHat className="size-5" aria-hidden="true" />}
              title="No dishes on the menu"
              description="Add your first dish with its sizes, prices, and photos."
              action={
                <Button
                  size="sm"
                  onClick={() => setFormState({ mode: "create" })}
                  leftIcon={<Plus className="size-4" aria-hidden="true" />}
                >
                  Add a dish
                </Button>
              }
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={<Search className="size-5" aria-hidden="true" />}
              title="No dishes match"
              description="Try a different name, size, or category — or clear the filters."
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.12em] text-stone-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Dish
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Photos
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Added
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
                  {filteredItems.map((item) => {
                    const price = minimumPrice(item);
                    const photos = photoCount(item);

                    return (
                      <motion.tr
                        key={item.id}
                        variants={staggerItem}
                        className="transition-colors hover:bg-stone-50/70"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Thumbnail item={item} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-stone-900">
                                {item.name}
                              </p>
                              {item.description ? (
                                <p className="line-clamp-1 text-xs text-stone-500">
                                  {item.description}
                                </p>
                              ) : (
                                <p className="text-xs text-stone-400">
                                  No description
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.category ? (
                            <Badge tone="brand">
                              <Tags
                                className="size-3"
                                aria-hidden="true"
                              />
                              {item.category.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-stone-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {price === null ? (
                            <span className="text-xs text-stone-400">
                              No variants
                            </span>
                          ) : (
                            <div>
                              <p className="font-medium text-stone-900">
                                {formatPrice(price)}
                              </p>
                              <p className="text-[11px] text-stone-400">
                                {item.variants.length}{" "}
                                {item.variants.length === 1
                                  ? "option"
                                  : "options"}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={photos > 0 ? "green" : "amber"}>
                            <Images
                              className="size-3"
                              aria-hidden="true"
                            />
                            {photos}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setFormState({ mode: "edit", id: item.id })
                              }
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
                              variant="secondary"
                              size="sm"
                              onClick={() => setImagesItemId(item.id)}
                              leftIcon={
                                <Images
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              }
                            >
                              Photos
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteTarget(item)}
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

      {formState?.mode === "create" ? (
        <MenuFormDialog onClose={() => setFormState(null)} />
      ) : null}

      {formState?.mode === "edit" && editingItem ? (
        <MenuFormDialog
          key={editingItem.id}
          item={editingItem}
          onClose={() => setFormState(null)}
        />
      ) : null}

      {imagesItem ? (
        <MenuImagesDialog
          item={imagesItem}
          onClose={() => setImagesItemId(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete dish"
        description={`Delete ${deleteTarget?.name ?? "this dish"}? Its variants and photos will be removed permanently.`}
        confirmLabel="Delete dish"
        tone="danger"
        loading={deleteMenuItem.isPending}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleteMenuItem.isPending) {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
