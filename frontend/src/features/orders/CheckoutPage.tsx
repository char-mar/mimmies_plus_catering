import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  CreditCard,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from "lucide-react";

import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  LinkButton,
  PageHeader,
  Textarea,
} from "@/components/ui";
import { useAuthStore } from "@/features/auth/store";
import {
  cartItemTotal,
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from "@/features/cart/store";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";

import { initializeOrderPayment } from "./api";
import { useCreateOrder } from "./hooks";
import type { CreateOrderInput, FulfillmentType } from "./types";

const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;
const MAX_ORDER_QUANTITY = 100;

interface FieldErrors {
  phone?: string;
  address?: string;
  form?: string;
}

export function CheckoutPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const clearCart = useCartStore((state) => state.clear);
  const createOrder = useCreateOrder();

  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>("PICKUP");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [startingPayment, setStartingPayment] = useState(false);

  if (!user) {
    return null;
  }

  if (items.length === 0 && !createOrder.isPending && !startingPayment) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Checkout"
          description="Review your order and choose how you would like to receive it."
        />
        <Card>
          <EmptyState
            icon={<ShoppingBag className="size-5" aria-hidden="true" />}
            title="Your cart is empty"
            description="Add a dish from the menu before heading to checkout."
            action={<LinkButton to="/">Browse the menu</LinkButton>}
          />
        </Card>
      </div>
    );
  }

  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const submitting = createOrder.isPending || startingPayment;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {};

    if (!PHONE_PATTERN.test(phone.trim())) {
      nextErrors.phone =
        "Enter a valid phone number, for example 024 000 0000.";
    }

    if (fulfillmentType === "DELIVERY" && address.trim().length < 5) {
      nextErrors.address = "A delivery address is required for delivery.";
    }

    if (totalQuantity > MAX_ORDER_QUANTITY) {
      nextErrors.form = `An order can contain at most ${MAX_ORDER_QUANTITY} items.`;
    }

    setErrors(nextErrors);

    if (nextErrors.phone || nextErrors.address || nextErrors.form) {
      return;
    }

    const input: CreateOrderInput = {
      items: items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      fulfillmentType,
      customerPhone: phone.trim(),
      deliveryAddress:
        fulfillmentType === "DELIVERY" ? address.trim() : null,
      notes: notes.trim() || null,
    };

    let orderId: string;

    try {
      const order = await createOrder.mutateAsync(input);
      orderId = order.id;
      setStartingPayment(true);
      clearCart();
    } catch {
      return;
    }

    try {
      const payment = await initializeOrderPayment(orderId);
      window.location.assign(payment.authorizationUrl);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Your order was placed, but payment could not be started.",
      );
      navigate(`/orders/${orderId}`, {
        replace: true,
        state: { paymentError: message },
      });
    } finally {
      setStartingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout"
        description="Review your order and choose how you would like to receive it."
        actions={
          <LinkButton
            to="/"
            variant="secondary"
            size="sm"
            leftIcon={<ChevronLeft className="size-4" aria-hidden="true" />}
          >
            Keep browsing
          </LinkButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Card className="space-y-5 p-5">
            <fieldset>
              <legend className="text-base font-semibold text-stone-900">
                How would you like your order?
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <FulfillmentOption
                  value="PICKUP"
                  current={fulfillmentType}
                  onSelect={setFulfillmentType}
                  icon={<Store className="size-4" aria-hidden="true" />}
                  title="Pickup"
                  description="Collect from the kitchen when your order is ready."
                />
                <FulfillmentOption
                  value="DELIVERY"
                  current={fulfillmentType}
                  onSelect={setFulfillmentType}
                  icon={<Truck className="size-4" aria-hidden="true" />}
                  title="Delivery"
                  description="We bring your order to your address."
                />
              </div>
            </fieldset>

            <Input
              label="Phone number"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="024 000 0000"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setErrors((current) => ({ ...current, phone: undefined }));
              }}
              error={errors.phone}
              leftIcon={<Phone className="size-4" aria-hidden="true" />}
              required
            />

            {fulfillmentType === "DELIVERY" ? (
              <Textarea
                label="Delivery address"
                placeholder="House or landmark, street, area, city"
                rows={3}
                value={address}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setErrors((current) => ({ ...current, address: undefined }));
                }}
                error={errors.address}
                required
              />
            ) : null}

            <Textarea
              label="Order notes (optional)"
              placeholder="Anything we should know about your order?"
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Card>

          <Card className="flex items-start gap-3 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
              <UserRound className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-stone-900">{user.name}</p>
              <p className="truncate text-stone-500">{user.email}</p>
              <p className="mt-1 text-xs text-stone-400">
                We will send order updates to this email address.
              </p>
            </div>
          </Card>

          {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}

          {createOrder.error ? (
            <Alert tone="error" title="Your order could not be placed">
              {getErrorMessage(createOrder.error)}
            </Alert>
          ) : null}

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2.5 text-xs leading-relaxed text-stone-500">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <p>
                You will be redirected to Paystack to pay securely. Your order
                is only confirmed after payment succeeds.
              </p>
            </div>
            <Button
              type="submit"
              fullWidth
              className="mt-4"
              loading={submitting}
              disabled={submitting}
              leftIcon={<CreditCard className="size-4" aria-hidden="true" />}
            >
              {startingPayment ? "Starting payment…" : "Place order & pay"}
            </Button>
          </div>
        </form>

        <Card className="overflow-hidden lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <h2 className="text-base font-semibold text-stone-900">
              Order summary
            </h2>
            <span className="text-xs font-medium text-stone-500">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </div>

          <ul className="divide-y divide-stone-100 px-5">
            {items.map((item) => (
              <li
                key={item.variantId}
                className="flex items-start justify-between gap-3 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800">
                    {item.menuName}
                  </p>
                  <p className="text-xs text-stone-500">
                    {item.variantSize ?? "Standard"} · Qty {item.quantity}
                  </p>
                  <Link
                    to={`/menu/${item.menuId}`}
                    className="mt-0.5 inline-block text-[11px] font-medium text-brand-700 hover:text-brand-800"
                  >
                    View dish
                  </Link>
                </div>
                <span className="shrink-0 text-sm font-semibold text-stone-900">
                  {formatPrice(cartItemTotal(item))}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-stone-100 bg-stone-50/60 px-5 py-4 text-sm">
            <div className="flex items-center justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span>Delivery</span>
              <span className="text-xs text-stone-400">
                Calculated when you place the order
              </span>
            </div>
            <p className="border-t border-stone-200 pt-2 text-xs leading-relaxed text-stone-500">
              Prices are confirmed by the kitchen when the order is created.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FulfillmentOption({
  value,
  current,
  onSelect,
  icon,
  title,
  description,
}: {
  value: FulfillmentType;
  current: FulfillmentType;
  onSelect: (value: FulfillmentType) => void;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  const active = value === current;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
        active
          ? "border-brand-300 bg-brand-50/60 ring-2 ring-brand-100"
          : "border-stone-200 hover:border-stone-300",
      )}
    >
      <input
        type="radio"
        name="fulfillmentType"
        value={value}
        checked={active}
        onChange={() => onSelect(value)}
        className="mt-0.5 size-4 shrink-0 accent-brand-600"
      />
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-brand-100 text-brand-700" : "bg-stone-100 text-stone-500",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-stone-900">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">
          {description}
        </span>
      </span>
    </label>
  );
}
