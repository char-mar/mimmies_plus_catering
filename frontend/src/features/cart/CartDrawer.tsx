import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  ChefHat,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

import { LinkButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { EASE_OUT, springDrawer } from "@/lib/motion";

import {
  cartItemTotal,
  MAX_ITEM_QUANTITY,
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from "./store";
import type { CartItem } from "./store";

export function CartButton({ className }: { className?: string }) {
  const count = useCartStore(selectCartCount);
  const openCart = useCartStore((state) => state.openCart);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-xl bg-white text-stone-600 ring-1 ring-inset ring-stone-200 transition-colors hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        className,
      )}
    >
      <ShoppingBag className="size-4" aria-hidden="true" />
      {count > 0 ? (
        <motion.span
          key={count}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-5 text-white shadow-sm"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      ) : null}
    </button>
  );
}

export function CartDrawer() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const clear = useCartStore((state) => state.clear);
  const items = useCartStore((state) => state.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();
      closeCart();
    };

    dialog.addEventListener("cancel", handleCancel);

    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [closeCart]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Your cart"
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(100vw,26rem)] max-w-none rounded-none border-0 bg-transparent p-0 shadow-2xl backdrop:bg-stone-950/40 backdrop:backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          closeCart();
        }
      }}
    >
      <motion.div
        initial={false}
        animate={isOpen ? { x: 0 } : { x: "100%" }}
        transition={springDrawer}
        className="flex h-full flex-col bg-white"
      >
        <header className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div className="space-y-0.5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-stone-900">
              <ShoppingBag className="size-4 text-brand-600" aria-hidden="true" />
              Your cart
            </h2>
            <p className="text-sm text-stone-500">
              {count === 0
                ? "Nothing here yet"
                : `${count} ${count === 1 ? "item" : "items"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
                <ShoppingBag className="size-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-900">
                  Your cart is empty
                </p>
                <p className="text-sm text-stone-500">
                  Pick a dish from the menu to get started.
                </p>
              </div>
              <LinkButton to="/" variant="secondary" size="sm" onClick={closeCart}>
                Browse the menu
              </LinkButton>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.map((item) => (
                <CartLine key={item.variantId} item={item} />
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <footer className="border-t border-stone-200 bg-stone-50/60 px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-stone-500">Subtotal</span>
              <span
                aria-live="polite"
                className="text-lg font-semibold text-stone-900"
              >
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              Delivery fees and the final total are confirmed when you place
              your order.
            </p>

            <LinkButton
              to="/checkout"
              fullWidth
              className="mt-4"
              onClick={closeCart}
            >
              Checkout
            </LinkButton>
            <button
              type="button"
              onClick={clear}
              className="mt-2 w-full rounded-lg py-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-red-600"
            >
              Clear cart
            </button>
          </footer>
        ) : null}
      </motion.div>
    </dialog>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const closeCart = useCartStore((state) => state.closeCart);

  return (
    <li className="flex gap-3 py-4">
      <Link
        to={`/menu/${item.menuId}`}
        onClick={closeCart}
        className="size-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-brand-600">
            <ChefHat className="size-5" aria-hidden="true" />
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">
              {item.menuName}
            </p>
            <p className="text-xs text-stone-500">
              {item.variantSize ?? "Standard"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.variantId)}
            aria-label={`Remove ${item.menuName} from cart`}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={() => setQuantity(item.variantId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label={`Decrease quantity of ${item.menuName}`}
              className="flex size-7 items-center justify-center text-stone-500 transition-colors hover:text-stone-900 disabled:opacity-40"
            >
              <Minus className="size-3.5" aria-hidden="true" />
            </button>
            <span
              className="w-7 text-center text-xs font-semibold text-stone-800"
              aria-live="polite"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(item.variantId, item.quantity + 1)}
              disabled={item.quantity >= MAX_ITEM_QUANTITY}
              aria-label={`Increase quantity of ${item.menuName}`}
              className="flex size-7 items-center justify-center text-stone-500 transition-colors hover:text-stone-900 disabled:opacity-40"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          <span className="text-sm font-semibold text-stone-900">
            {formatPrice(cartItemTotal(item))}
          </span>
        </div>
      </div>
    </li>
  );
}
