import { useDeferredValue, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ChefHat,
  RefreshCw,
  Search,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { Alert, Button, Card, EmptyState } from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import {
  EASE_OUT,
  springSnappy,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";

import { useCategories, useMenuItems } from "./hooks";
import type { MenuImage, MenuItem } from "./types";

const ALL_CATEGORIES = "all";

const CATEGORY_TONES = [
  "bg-brand-50 text-brand-700",
  "bg-emerald-50 text-emerald-700",
  "bg-sky-50 text-sky-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-violet-50 text-violet-700",
];

function dishLabel(count: number): string {
  return `${count} ${count === 1 ? "dish" : "dishes"}`;
}

function primaryImage(item: MenuItem): MenuImage | null {
  const images = [
    ...item.images,
    ...item.variants.flatMap((variant) => variant.images),
  ];

  return images.find((image) => image.isPrimary) ?? images[0] ?? null;
}

function scrollToMenu(): void {
  document.getElementById("menu")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function MenuPage() {
  const categoriesQuery = useCategories();
  const menuQuery = useMenuItems();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const deferredSearch = useDeferredValue(search);

  const categories = categoriesQuery.data ?? [];
  const items = useMemo(() => menuQuery.data ?? [], [menuQuery.data]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of items) {
      counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    }

    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const tokens = deferredSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);

    return items.filter((item) => {
      if (activeCategory !== ALL_CATEGORIES && item.categoryId !== activeCategory) {
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

  const activeCategoryName =
    activeCategory === ALL_CATEGORIES
      ? null
      : (categories.find((category) => category.id === activeCategory)?.name ?? null);

  const hasFilters = search.trim().length > 0 || activeCategory !== ALL_CATEGORIES;
  const menuError = menuQuery.error;
  const categoriesError = categoriesQuery.error;

  const selectCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    scrollToMenu();
  };

  const clearFilters = () => {
    setSearch("");
    setActiveCategory(ALL_CATEGORIES);
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-stone-950 px-6 py-8 text-white shadow-sm sm:px-9 sm:py-10">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-brand-600/30 blur-3xl"
          animate={{ x: [0, -16, 0], y: [0, 18, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/4 size-64 rounded-full bg-amber-500/15 blur-3xl"
          animate={{ x: [0, 14, 0], y: [0, -14, 0] }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        <motion.div
          className="relative space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={staggerItem} className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200 ring-1 ring-inset ring-white/15">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Mimmies Plus Catering
            </span>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Good food, made for every occasion.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/[0.62] sm:text-base">
              Explore our kitchen, find a favourite, and let us cater the
              moments that matter.
            </p>
          </motion.div>

          <motion.div variants={staggerItem} className="max-w-xl">
            <label htmlFor="menu-search" className="sr-only">
              Search the menu
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/50"
                aria-hidden="true"
              />
              <input
                id="menu-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    scrollToMenu();
                  }
                }}
                placeholder="Search dishes, sizes, or categories…"
                enterKeyHint="search"
                className="h-12 w-full rounded-2xl border border-white/15 bg-white/10 pl-11 pr-12 text-sm text-white outline-none backdrop-blur transition placeholder:text-white/45 focus:border-brand-400/60 focus:bg-white/15 focus:ring-4 focus:ring-brand-500/20"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-2 my-auto flex size-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5"
          >
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xl font-semibold text-white">
                  {menuQuery.isPending ? "…" : items.length}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  On the menu
                </p>
              </div>
              <div>
                <p className="text-xl font-semibold text-white">
                  {categoriesQuery.isPending ? "…" : categories.length}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Categories
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={scrollToMenu}
              rightIcon={<ArrowDown className="size-4" aria-hidden="true" />}
            >
              Browse the menu
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <section
        aria-labelledby="categories-heading"
        className="scroll-mt-24 space-y-4"
      >
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
            Categories
          </p>
          <h2
            id="categories-heading"
            className="text-xl font-semibold tracking-tight text-stone-900"
          >
            What are you craving?
          </h2>
        </div>

        {categoriesError ? (
          <Alert tone="error" title="Categories could not be loaded">
            <div className="flex flex-wrap items-center gap-2">
              <span>{getErrorMessage(categoriesError)}</span>
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
        ) : null}

        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <CategoryCard
            label="All dishes"
            count={menuQuery.isPending ? null : items.length}
            active={activeCategory === ALL_CATEGORIES}
            tone="bg-stone-900 text-white"
            icon={<UtensilsCrossed className="size-5" aria-hidden="true" />}
            onClick={() => selectCategory(ALL_CATEGORIES)}
          />
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              label={category.name}
              count={
                menuQuery.isPending
                  ? null
                  : (categoryCounts.get(category.id) ?? 0)
              }
              active={activeCategory === category.id}
              tone={CATEGORY_TONES[index % CATEGORY_TONES.length]}
              icon={<ChefHat className="size-5" aria-hidden="true" />}
              onClick={() => selectCategory(category.id)}
            />
          ))}
        </motion.div>
      </section>

      <section
        id="menu"
        aria-labelledby="menu-heading"
        className="scroll-mt-24 space-y-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
              Our menu
            </p>
            <h2
              id="menu-heading"
              className="text-xl font-semibold tracking-tight text-stone-900"
            >
              {search.trim()
                ? `Results for “${search.trim()}”`
                : (activeCategoryName ?? "Every dish, freshly made")}
            </h2>
            <p aria-live="polite" className="text-sm text-stone-500">
              {menuQuery.isPending
                ? "Loading dishes…"
                : hasFilters
                  ? `${dishLabel(filteredItems.length)} of ${dishLabel(items.length)}`
                  : dishLabel(items.length)}
            </p>
          </div>
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              leftIcon={<X className="size-4" aria-hidden="true" />}
            >
              Clear filters
            </Button>
          ) : null}
        </div>

        {menuError ? (
          <Alert tone="error" title="The menu could not be loaded">
            <div className="flex flex-wrap items-center gap-2">
              <span>{getErrorMessage(menuError)}</span>
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
        ) : null}

        {menuQuery.isPending ? (
          <MenuSkeleton />
        ) : menuQuery.isError ? null : filteredItems.length > 0 ? (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </motion.div>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ChefHat className="size-5" aria-hidden="true" />}
              title="The kitchen is preparing something good"
              description="No dishes have been published yet. Check back soon for the latest menu."
            />
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={<Search className="size-5" aria-hidden="true" />}
              title="No dishes match your search"
              description="Try a different dish name, size, or category — or clear the filters to see everything."
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          </Card>
        )}
      </section>
    </div>
  );
}

function CategoryCard({
  label,
  count,
  active,
  tone,
  icon,
  onClick,
}: {
  label: string;
  count: number | null;
  active: boolean;
  tone: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      variants={staggerItem}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-left shadow-sm ring-2 ring-brand-200"
          : "flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-stone-300"
      }
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={
            active
              ? "block truncate text-sm font-semibold text-brand-900"
              : "block truncate text-sm font-semibold text-stone-900"
          }
        >
          {label}
        </span>
        <span className="block text-xs text-stone-500">
          {count === null ? "Loading…" : dishLabel(count)}
        </span>
      </span>
      {active ? (
        <motion.span
          layoutId="category-active-dot"
          className="size-2 shrink-0 rounded-full bg-brand-600"
          transition={springSnappy}
        />
      ) : null}
    </motion.button>
  );
}

function MenuCard({ item }: { item: MenuItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = primaryImage(item);

  const prices = item.variants
    .map((variant) => Number(variant.price))
    .filter(Number.isFinite);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const hasRange =
    prices.length > 1 && Math.min(...prices) !== Math.max(...prices);

  const sizes = [
    ...new Set(
      item.variants
        .map((variant) => variant.size)
        .filter((size): size is string => Boolean(size)),
    ),
  ];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link
        to={`/menu/${item.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          {image && !imageFailed ? (
            <img
              src={image.url}
              alt={image.altText ?? item.name}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="size-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-100 via-amber-50 to-stone-100 text-brand-600">
              <ChefHat className="size-10" aria-hidden="true" />
            </div>
          )}
          {item.category ? (
            <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-stone-700 shadow-sm backdrop-blur">
              {item.category.name}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-snug text-stone-900">
              {item.name}
            </h3>
            <ArrowRight
              className="mt-0.5 size-4 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
              aria-hidden="true"
            />
          </div>
          {item.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-stone-500">
              {item.description}
            </p>
          ) : null}

          {sizes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {sizes.slice(0, 4).map((size) => (
                <span
                  key={size}
                  className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600"
                >
                  {size}
                </span>
              ))}
              {sizes.length > 4 ? (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                  +{sizes.length - 4}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <p className="text-sm font-semibold text-stone-900">
              {minPrice === null ? (
                <span className="text-stone-500">Ask for pricing</span>
              ) : (
                <>
                  {hasRange ? (
                    <span className="text-xs font-medium text-stone-400">
                      From{" "}
                    </span>
                  ) : null}
                  {formatPrice(minPrice)}
                </>
              )}
            </p>
            {prices.length > 1 ? (
              <span className="text-xs text-stone-400">
                {prices.length} options
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function MenuSkeleton() {
  return (
    <div>
      <p className="sr-only" role="status">
        Loading the menu…
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
          >
            <div className="aspect-[4/3] animate-pulse bg-stone-200/70" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200" />
              <div className="h-3 w-full animate-pulse rounded bg-stone-100" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-stone-100" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
