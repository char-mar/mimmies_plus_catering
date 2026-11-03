import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Camera,
  ChefHat,
  ImageOff,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
} from "@/components/ui";
import { MAX_ITEM_QUANTITY, useCartStore } from "@/features/cart/store";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import {
  EASE_OUT,
  springSnappy,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";

import { useMenuItem } from "./hooks";
import type { MenuImage, MenuItem, MenuVariant } from "./types";

function imagesInOrder(images: MenuImage[]): MenuImage[] {
  return [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) {
      return a.isPrimary ? -1 : 1;
    }

    return a.sortOrder - b.sortOrder;
  });
}

function galleryImages(item: MenuItem): MenuImage[] {
  return [
    ...imagesInOrder(item.images),
    ...item.variants.flatMap((variant) => imagesInOrder(variant.images)),
  ];
}

function priceSummary(variants: MenuVariant[]): string {
  const prices = variants
    .map((variant) => Number(variant.price))
    .filter(Number.isFinite);

  if (prices.length === 0) {
    return "Ask for pricing";
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return min === max
    ? formatPrice(min)
    : `${formatPrice(min)} – ${formatPrice(max)}`;
}

export function MenuItemPage() {
  const { id } = useParams<{ id: string }>();
  const menuQuery = useMenuItem(id);

  if (!id) {
    return <DishNotFound />;
  }

  if (menuQuery.isPending) {
    return <DishSkeleton />;
  }

  if (menuQuery.isError) {
    const notFound =
      menuQuery.error instanceof ApiError &&
      (menuQuery.error.status === 400 || menuQuery.error.status === 404);

    if (notFound) {
      return <DishNotFound />;
    }

    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          <div className="p-6">
            <Alert tone="error" title="This dish could not be loaded">
              <div className="flex flex-wrap items-center gap-2">
                <span>{getErrorMessage(menuQuery.error)}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void menuQuery.refetch()}
                  loading={menuQuery.isFetching}
                  leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
                >
                  Try again
                </Button>
              </div>
            </Alert>
          </div>
        </Card>
      </div>
    );
  }

  if (!menuQuery.data) {
    return null;
  }

  return <DishDetails item={menuQuery.data} />;
}

function DishDetails({ item }: { item: MenuItem }) {
  const images = useMemo(() => galleryImages(item), [item]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const selectedImage =
    images.find((image) => image.id === selectedImageId) ?? images[0] ?? null;

  const variants = useMemo(
    () =>
      [...item.variants].sort(
        (a, b) => Number(a.price) - Number(b.price),
      ),
    [item.variants],
  );

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    variants[0] ??
    null;

  const hasVariantPhotos = item.variants.some(
    (variant) => variant.images.length > 0,
  );

  const selectVariant = (variant: MenuVariant) => {
    setSelectedVariantId(variant.id);
    setQuantity(1);

    const image = imagesInOrder(variant.images)[0];

    if (image) {
      setSelectedImageId(image.id);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      return;
    }

    const variantImage =
      imagesInOrder(selectedVariant.images)[0]?.url ?? images[0]?.url ?? null;

    addItem(
      {
        variantId: selectedVariant.id,
        menuId: item.id,
        menuName: item.name,
        variantSize: selectedVariant.size,
        unitPrice: selectedVariant.price,
        imageUrl: variantImage,
      },
      quantity,
    );

    toast.success(`${item.name} added to your cart.`);
    openCart();
    setQuantity(1);
  };

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <motion.section
          aria-label={`Photos of ${item.name}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          <Gallery
            name={item.name}
            images={images}
            selected={selectedImage}
            onSelect={setSelectedImageId}
          />
        </motion.section>

        <motion.div
          className="space-y-5"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={staggerItem} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {item.category ? (
                <Badge tone="brand">{item.category.name}</Badge>
              ) : null}
              <span className="text-xs font-medium text-stone-400">
                {item.variants.length === 0
                  ? "Pricing on request"
                  : `${item.variants.length} ${
                      item.variants.length === 1 ? "size" : "sizes"
                    }`}
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              {item.name}
            </h1>

            <p className="text-2xl font-semibold text-brand-700">
              {priceSummary(item.variants)}
            </p>

            {item.description ? (
              <p className="text-sm leading-relaxed text-stone-600">
                {item.description}
              </p>
            ) : null}
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-stone-900">
                  Sizes &amp; pricing
                </h2>
                {hasVariantPhotos ? (
                  <span className="text-[11px] font-medium text-stone-400">
                    Photos change with the size you pick
                  </span>
                ) : null}
              </div>

              {variants.length === 0 ? (
                <p className="px-5 py-6 text-sm leading-relaxed text-stone-500">
                  Pricing for this dish is available on request. Get in touch
                  and we will help you plan your order.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {variants.map((variant) => (
                    <VariantRow
                      key={variant.id}
                      variant={variant}
                      selected={selectedVariant?.id === variant.id}
                      onSelect={() => selectVariant(variant)}
                    />
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>

          {selectedVariant ? (
            <motion.div
              variants={staggerItem}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                    Qty
                  </span>
                  <div className="flex items-center rounded-xl border border-stone-200">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) => Math.max(1, current - 1))
                      }
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="flex size-9 items-center justify-center text-stone-500 transition-colors hover:text-stone-900 disabled:opacity-40"
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span
                      aria-live="polite"
                      className="w-9 text-center text-sm font-semibold text-stone-900"
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) =>
                          Math.min(MAX_ITEM_QUANTITY, current + 1),
                        )
                      }
                      disabled={quantity >= MAX_ITEM_QUANTITY}
                      aria-label="Increase quantity"
                      className="flex size-9 items-center justify-center text-stone-500 transition-colors hover:text-stone-900 disabled:opacity-40"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="flex-1"
                  leftIcon={
                    <ShoppingBag className="size-4" aria-hidden="true" />
                  }
                >
                  Add to cart ·{" "}
                  {formatPrice(Number(selectedVariant.price) * quantity)}
                </Button>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-stone-400">
                {selectedVariant.size ?? "Standard"} selected. Prices and
                availability are confirmed when the order is placed.
              </p>
            </motion.div>
          ) : null}

          <motion.div variants={staggerItem} className="flex flex-wrap gap-2">
            <LinkButton
              to="/"
              variant="secondary"
              leftIcon={<ArrowLeft className="size-4" aria-hidden="true" />}
            >
              Browse the menu
            </LinkButton>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function Gallery({
  name,
  images,
  selected,
  onSelect,
}: {
  name: string;
  images: MenuImage[];
  selected: MenuImage | null;
  onSelect: (imageId: string) => void;
}) {
  const [failedImageId, setFailedImageId] = useState<string | null>(null);
  const imageFailed = selected !== null && selected.id === failedImageId;

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-stone-200/80 bg-stone-100 shadow-sm">
        {selected && !imageFailed ? (
          <motion.img
            key={selected.id}
            src={selected.url}
            alt={selected.altText ?? name}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            onError={() => setFailedImageId(selected.id)}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-100 via-amber-50 to-stone-100 text-brand-600">
            {selected ? (
              <ImageOff className="size-10" aria-hidden="true" />
            ) : (
              <ChefHat className="size-10" aria-hidden="true" />
            )}
            <span className="text-xs font-medium text-stone-500">
              {selected ? "Photo unavailable" : "Photos coming soon"}
            </span>
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div
          role="group"
          aria-label="More photos"
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
        >
          {images.map((image, index) => {
            const active = selected?.id === image.id;

            return (
              <motion.button
                key={image.id}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={springSnappy}
                onClick={() => onSelect(image.id)}
                aria-pressed={active}
                aria-label={`View photo ${index + 1} of ${images.length}`}
                className={cn(
                  "size-20 shrink-0 overflow-hidden rounded-xl border bg-stone-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                  active
                    ? "border-brand-500 ring-2 ring-brand-200"
                    : "border-stone-200 hover:border-stone-300",
                )}
              >
                <img
                  src={image.url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </motion.button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function VariantRow({
  variant,
  selected,
  onSelect,
}: {
  variant: MenuVariant;
  selected: boolean;
  onSelect: () => void;
}) {
  const photos = imagesInOrder(variant.images);
  const label = variant.size ?? "Standard";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-stone-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600",
          selected && "bg-brand-50/60",
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
              selected
                ? "border-brand-600 bg-brand-600"
                : "border-stone-300 bg-white",
            )}
            aria-hidden="true"
          >
            {selected ? (
              <span className="size-1.5 rounded-full bg-white" />
            ) : null}
          </span>
          <span className="truncate text-sm font-medium text-stone-800">
            {label}
          </span>
          {photos.length > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-stone-400">
              <Camera className="size-3" aria-hidden="true" />
              {photos.length}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-sm font-semibold text-stone-900">
          {formatPrice(variant.price)}
        </span>
      </button>
    </li>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to menu
    </Link>
  );
}

function DishNotFound() {
  return (
    <div className="space-y-6">
      <BackLink />
      <Card>
        <EmptyState
          icon={<UtensilsCrossed className="size-5" aria-hidden="true" />}
          title="This dish is no longer on the menu"
          description="It may have been renamed or removed. Browse the full menu for something new."
          action={<LinkButton to="/">Browse the menu</LinkButton>}
        />
      </Card>
    </div>
  );
}

function DishSkeleton() {
  return (
    <div className="space-y-6">
      <BackLink />
      <p className="sr-only" role="status">
        Loading the dish…
      </p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="aspect-[4/3] animate-pulse rounded-3xl bg-stone-200/70" />
        <div className="space-y-4" aria-hidden="true">
          <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-stone-200" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-stone-200" />
          <div className="h-3 w-full animate-pulse rounded bg-stone-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-stone-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-stone-100" />
        </div>
      </div>
    </div>
  );
}
