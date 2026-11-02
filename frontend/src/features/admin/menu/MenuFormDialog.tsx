import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

import { Modal } from "@/components/Modal";
import {
  Alert,
  Button,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { useCategories } from "@/features/menu/hooks";
import type { MenuItem, MenuVariant } from "@/features/menu/types";
import { formatPrice } from "@/lib/format";

import { useCreateMenuItem, useUpdateMenuItem } from "./hooks";
import { ImagePicker } from "./ImagePicker";
import { MAX_MENU_IMAGES, MAX_VARIANT_IMAGES } from "./image-files";
import type { CreateMenuItemInput, MenuVariantInput } from "./types";

interface VariantDraft {
  key: string;
  id?: string;
  size: string;
  price: string;
  files: File[];
  existingImageCount: number;
}

const PRICE_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

function newVariantKey(): string {
  return `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDraft(variant: MenuVariant): VariantDraft {
  return {
    key: variant.id,
    id: variant.id,
    size: variant.size ?? "",
    price: variant.price,
    files: [],
    existingImageCount: variant.images.length,
  };
}

function priceError(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Add a price.";
  }

  if (!PRICE_PATTERN.test(trimmed) || Number(trimmed) <= 0) {
    return "Use a positive amount with up to two decimals.";
  }

  return undefined;
}

export function MenuFormDialog({
  item,
  onClose,
}: {
  item?: MenuItem | null;
  onClose: () => void;
}) {
  const formId = useId();
  const categoriesQuery = useCategories();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();

  const categories = categoriesQuery.data ?? [];

  const [name, setName] = useState(item?.name ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [variants, setVariants] = useState<VariantDraft[]>(() =>
    (item?.variants ?? []).map(toDraft),
  );
  const [menuImages, setMenuImages] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const pending = createMenuItem.isPending || updateMenuItem.isPending;

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const trimmedName = name.trim();
  const nameError =
    trimmedName.length === 0
      ? "Enter a dish name."
      : trimmedName.length > 150
        ? "Dish names can be at most 150 characters."
        : undefined;

  const categoryError = !categoryId ? "Choose a category." : undefined;

  const variantPriceErrors = variants.map((variant) =>
    priceError(variant.price),
  );
  const variantSizeErrors = variants.map((variant) =>
    variant.size.trim().length > 50
      ? "Sizes can be at most 50 characters."
      : undefined,
  );

  const sizes = variants
    .map((variant) => variant.size.trim().toLowerCase())
    .filter(Boolean);
  const duplicateSizes = new Set(sizes).size !== sizes.length;

  const variantsError =
    variants.length > 20
      ? "A dish can have at most 20 variants."
      : duplicateSizes
        ? "Variant sizes must be unique."
        : undefined;

  const removedSavedVariant =
    item?.variants.some(
      (saved) => !variants.some((draft) => draft.id === saved.id),
    ) ?? false;

  const draftPrices = variants
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price) && price > 0);
  const startingPrice = draftPrices.length > 0 ? Math.min(...draftPrices) : null;

  const addVariant = () => {
    setVariants((current) => [
      ...current,
      {
        key: newVariantKey(),
        size: "",
        price: "",
        files: [],
        existingImageCount: 0,
      },
    ]);
  };

  const updateVariant = (
    key: string,
    patch: Partial<Pick<VariantDraft, "size" | "price" | "files">>,
  ) => {
    setVariants((current) =>
      current.map((variant) =>
        variant.key === key ? { ...variant, ...patch } : variant,
      ),
    );
  };

  const removeVariant = (key: string) => {
    setVariants((current) =>
      current.filter((variant) => variant.key !== key),
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (
      nameError ||
      categoryError ||
      variantsError ||
      variantPriceErrors.some(Boolean) ||
      variantSizeErrors.some(Boolean)
    ) {
      return;
    }

    const variantInputs: MenuVariantInput[] = variants.map((variant) => ({
      ...(variant.id ? { id: variant.id } : {}),
      size: variant.size.trim() || null,
      price: variant.price.trim(),
    }));

    if (item) {
      updateMenuItem.mutate(
        {
          id: item.id,
          input: {
            categoryId,
            name: trimmedName,
            description: description.trim() || null,
            variants: variantInputs,
          },
        },
        { onSuccess: onClose },
      );
      return;
    }

    const input: CreateMenuItemInput = {
      categoryId,
      name: trimmedName,
      description: description.trim() || null,
      variants: variantInputs,
      menuImages,
      variantImages: variants.map((variant) => variant.files),
    };

    createMenuItem.mutate(input, { onSuccess: onClose });
  };

  const categoriesUnavailable =
    categoriesQuery.isSuccess && categories.length === 0;

  return (
    <Modal
      open
      onClose={() => {
        if (!pending) {
          onClose();
        }
      }}
      size="xl"
      title={item ? "Edit dish" : "New dish"}
      description={
        item
          ? "Update the dish details and variant prices. Photos are managed separately so existing images are kept."
          : "Add a dish with its sizes and prices. Photos can be attached now or added later."
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={pending}
            disabled={categoriesUnavailable}
          >
            {item ? "Save changes" : "Create dish"}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-6" noValidate>
        {categoriesQuery.isPending ? (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Spinner className="size-4" />
            Loading categories…
          </div>
        ) : categoriesQuery.isError ? (
          <Alert tone="error" title="Categories could not be loaded">
            <div className="flex flex-wrap items-center gap-2">
              <span>Refresh to try again before saving a dish.</span>
              <button
                type="button"
                onClick={() => void categoriesQuery.refetch()}
                disabled={categoriesQuery.isFetching}
                className="font-semibold underline underline-offset-2 disabled:opacity-60"
              >
                {categoriesQuery.isFetching ? "Retrying…" : "Retry"}
              </button>
            </div>
          </Alert>
        ) : categoriesUnavailable ? (
          <Alert tone="warning" title="Create a category first">
            Dishes belong to a category.{" "}
            <Link
              to="/admin/categories"
              onClick={onClose}
              className="font-semibold underline underline-offset-2"
            >
              Create a category
            </Link>{" "}
            to continue.
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Dish name"
            value={name}
            maxLength={150}
            autoFocus
            placeholder="e.g. Jollof rice with grilled chicken"
            onChange={(event) => setName(event.target.value)}
            error={submitted ? nameError : undefined}
          />
          <div>
            <Select
              label="Category"
              value={categoryId}
              disabled={categories.length === 0}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {submitted && categoryError ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {categoryError}
              </p>
            ) : null}
          </div>
        </div>

        <Textarea
          label="Description"
          value={description}
          maxLength={2000}
          rows={3}
          placeholder="What makes this dish special? (optional)"
          hint={`${description.length}/2000 characters`}
          onChange={(event) => setDescription(event.target.value)}
        />

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Sizes and prices
              </h3>
              <p className="text-xs text-stone-500">
                Add one row per size. A dish without variants shows “Ask for
                pricing” on the public menu.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={addVariant}
              disabled={variants.length >= 20}
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
            >
              Add variant
            </Button>
          </div>

          {variants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
              No variants yet. Add one to show a price.
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={variant.key}
                  className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/60 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      Variant {index + 1}
                      {variant.id ? (
                        <span className="ml-2 font-normal normal-case tracking-normal text-stone-400">
                          saved
                        </span>
                      ) : null}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(variant.key)}
                      aria-label={`Remove variant ${index + 1}`}
                      leftIcon={
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      }
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                    <Input
                      label="Size"
                      value={variant.size}
                      maxLength={50}
                      placeholder="e.g. Large (optional)"
                      onChange={(event) =>
                        updateVariant(variant.key, {
                          size: event.target.value,
                        })
                      }
                      error={
                        submitted ? variantSizeErrors[index] : undefined
                      }
                    />
                    <Input
                      label="Price (GHS)"
                      value={variant.price}
                      inputMode="decimal"
                      placeholder="0.00"
                      onChange={(event) =>
                        updateVariant(variant.key, {
                          price: event.target.value,
                        })
                      }
                      error={submitted ? variantPriceErrors[index] : undefined}
                    />
                  </div>

                  {item ? (
                    variant.existingImageCount > 0 ? (
                      <p className="text-xs text-stone-500">
                        {variant.existingImageCount}{" "}
                        {variant.existingImageCount === 1 ? "photo" : "photos"}{" "}
                        attached. Use the Photos action in the menu list to add
                        or remove them.
                      </p>
                    ) : null
                  ) : (
                    <ImagePicker
                      label="Variant photos"
                      hint="Optional. The first photo becomes this variant's primary image."
                      files={variant.files}
                      max={MAX_VARIANT_IMAGES}
                      onChange={(files) =>
                        updateVariant(variant.key, { files })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {submitted && variantsError ? (
            <p className="text-xs font-medium text-red-600">{variantsError}</p>
          ) : null}

          {removedSavedVariant ? (
            <Alert tone="warning">
              Removing a saved variant also deletes its photos when you save.
            </Alert>
          ) : null}
        </section>

        {item ? null : (
          <section className="space-y-3 border-t border-stone-200 pt-5">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Dish photos
              </h3>
              <p className="text-xs text-stone-500">
                Optional. The first photo becomes the primary image on the
                public menu.
              </p>
            </div>
            <ImagePicker
              label="Menu photos"
              files={menuImages}
              max={MAX_MENU_IMAGES}
              onChange={setMenuImages}
            />
          </section>
        )}

        {startingPrice !== null ? (
          <p className="text-xs text-stone-500">
            Starting price preview: {formatPrice(startingPrice)}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
