import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ChefHat,
  RefreshCw,
  Search,
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

function scrollToCategories(): void {
  document.getElementById("categories")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function MenuPage() {
  const categoriesQuery = useCategories();
  const menuQuery = useMenuItems();
  const reduceMotion = useReducedMotion();
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

  const activeCategoryName =
    activeCategory === ALL_CATEGORIES
      ? null
      : (categories.find((category) => category.id === activeCategory)?.name ??
        null);

  const hasFilters =
    search.trim().length > 0 || activeCategory !== ALL_CATEGORIES;
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
      <section className="relative left-1/2 isolate -mt-6 w-screen -translate-x-1/2 overflow-hidden bg-[#0b0a09] text-white lg:-mt-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(234,88,12,0.22),transparent_55%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0b0a09] to-transparent"
        />

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-16 pt-14 text-center sm:pt-20 lg:pb-24 lg:pt-24">
          <motion.div
            className="flex flex-col items-center"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.p
              variants={staggerItem}
              className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/50 sm:text-[11px]"
            >
              <span
                aria-hidden="true"
                className="h-px w-8 bg-white/20 sm:w-12"
              />
              Mimmies Plus Catering
              <span
                aria-hidden="true"
                className="h-px w-8 bg-white/20 sm:w-12"
              />
            </motion.p>

            <motion.h1
              variants={staggerItem}
              className="mt-6 max-w-3xl font-serif text-4xl font-medium leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              Mimmies Plus Catering
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mt-5 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base"
            >
              Specialized catering and logistics services for onshore and
              offshore.
            </motion.p>

            <motion.div
              variants={staggerItem}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
            >
              <button
                type="button"
                onClick={scrollToMenu}
                className="group inline-flex h-12 items-center gap-3 border border-white/25 px-7 text-[11px] font-semibold uppercase tracking-[0.28em] text-white transition-colors hover:border-white hover:bg-white hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Browse the menu
                <ArrowDown
                  className="size-3.5 transition-transform group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={scrollToCategories}
                className="inline-flex h-12 items-center px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Explore categories
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.2 }}
            className="relative mt-12 w-full max-w-[22rem] sm:max-w-[26rem] lg:mt-14 lg:max-w-[30rem]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-4 rounded-full bg-brand-600/25 blur-3xl"
            />
            <div className="relative aspect-square w-full overflow-hidden rounded-full ring-1 ring-white/10">
              <motion.img
                src="/images/hero-premium.jpg"
                alt="Jollof rice with grilled chicken and plantain plated in the Mimmies Plus kitchen"
                className="size-full object-cover"
                animate={reduceMotion ? undefined : { rotate: 360 }}
                transition={
                  reduceMotion
                    ? undefined
                    : { duration: 30, repeat: Infinity, ease: "linear" }
                }
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section
        id="categories"
        aria-labelledby="categories-heading"
        className="scroll-mt-24 space-y-4"
      >
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
            Categories
          </p>
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
          className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <CategoryCard
            label="All dishes"
            count={menuQuery.isPending ? null : items.length}
            active={activeCategory === ALL_CATEGORIES}
            onClick={() => selectCategory(ALL_CATEGORIES)}
          />
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              label={category.name}
              count={
                menuQuery.isPending
                  ? null
                  : (categoryCounts.get(category.id) ?? 0)
              }
              active={activeCategory === category.id}
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
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
              <label htmlFor="menu-search" className="sr-only">
                Search the menu
              </label>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />
              <input
                id="menu-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search dishes, sizes…"
                enterKeyHint="search"
                className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-10 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-2 my-auto flex size-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
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
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
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
  onClick,
}: {
  label: string;
  count: number | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      variants={staggerItem}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "inline-flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 shadow-sm ring-1 ring-brand-200"
          : "inline-flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 shadow-sm transition-colors hover:border-stone-300"
      }
    >
      <span
        className={
          active
            ? "text-sm font-semibold text-brand-900"
            : "text-sm font-semibold text-stone-800"
        }
      >
        {label}
      </span>
      <span
        className={
          active
            ? "rounded-md bg-brand-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-brand-700"
            : "rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-stone-500"
        }
      >
        {count === null ? "…" : count}
      </span>
      {active ? (
        <motion.span
          layoutId="category-active-dot"
          className="size-1.5 shrink-0 rounded-full bg-brand-600"
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
      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-hidden="true"
      >
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
