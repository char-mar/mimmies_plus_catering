import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
} from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatPrice } from "@/lib/format";

import { OrderStatusBadge, PaymentStatusBadge } from "./OrderBadges";
import { useCancelOrder, useOrder, usePayOrder } from "./hooks";
import {
  FULFILLMENT_LABELS,
  isOrderCancellable,
  isOrderPayable,
  PAYMENT_RECORD_LABELS,
  PAYMENT_RECORD_TONES,
} from "./status";
import type { Payment } from "./types";

interface PaymentRedirectState {
  paymentError?: string;
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const orderQuery = useOrder(id);
  const payOrder = usePayOrder();
  const cancelOrder = useCancelOrder();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!id) {
    return <OrderNotFound />;
  }

  if (orderQuery.isPending) {
    return <OrderDetailSkeleton />;
  }

  if (orderQuery.isError) {
    const notFound =
      orderQuery.error instanceof ApiError && orderQuery.error.status === 404;

    if (notFound) {
      return <OrderNotFound />;
    }

    return (
      <div className="space-y-6">
        <BackLink />
        <Alert tone="error" title="This order could not be loaded">
          <div className="flex flex-wrap items-center gap-2">
            <span>{getErrorMessage(orderQuery.error)}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void orderQuery.refetch()}
              loading={orderQuery.isFetching}
              leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
            >
              Try again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!orderQuery.data) {
    return null;
  }

  const order = orderQuery.data;
  const payable = isOrderPayable(order);
  const cancellable = isOrderCancellable(order);
  const paymentError = (location.state as PaymentRedirectState | null)
    ?.paymentError;

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.createdAt)} · ${
          FULFILLMENT_LABELS[order.fulfillmentType]
        }`}
        actions={
          <>
            {cancellable ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmCancel(true)}
                leftIcon={<XCircle className="size-4" aria-hidden="true" />}
              >
                Cancel order
              </Button>
            ) : null}
            {payable ? (
              <Button
                size="sm"
                onClick={() => payOrder.mutate(order.id)}
                loading={payOrder.isPending}
                leftIcon={<CreditCard className="size-4" aria-hidden="true" />}
              >
                Pay now
              </Button>
            ) : null}
          </>
        }
      />

      {paymentError ? (
        <Alert tone="error" title="Your order was placed, but payment did not start">
          <div className="flex flex-wrap items-center gap-2">
            <span>{paymentError}</span>
            {payable ? (
              <button
                type="button"
                onClick={() => payOrder.mutate(order.id)}
                disabled={payOrder.isPending}
                className="font-semibold underline underline-offset-2 hover:text-red-950 disabled:opacity-60"
              >
                {payOrder.isPending ? "Starting…" : "Try payment again"}
              </button>
            ) : null}
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Order status">
          <OrderStatusBadge status={order.status} />
        </SummaryTile>
        <SummaryTile label="Payment">
          <PaymentStatusBadge status={order.paymentStatus} />
        </SummaryTile>
        <SummaryTile label="Total">
          <span className="text-lg font-semibold text-stone-900">
            {formatPrice(order.total)}
          </span>
        </SummaryTile>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <h2 className="text-base font-semibold text-stone-900">Items</h2>
            <span className="text-xs font-medium text-stone-500">
              {order.items.reduce((total, item) => total + item.quantity, 0)}{" "}
              items
            </span>
          </div>

          <ul className="divide-y divide-stone-100 px-5">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800">
                    {item.menuName}
                  </p>
                  <p className="text-xs text-stone-500">
                    {item.variantSize ?? "Standard"} · {item.quantity} ×{" "}
                    {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-stone-900">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-stone-100 bg-stone-50/60 px-5 py-4 text-sm">
            <div className="flex items-center justify-between text-stone-600">
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <dt>Delivery fee</dt>
              <dd>{formatPrice(order.deliveryFee)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-stone-200 pt-2 text-stone-900">
              <dt className="font-semibold">Total</dt>
              <dd className="text-base font-semibold">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="text-base font-semibold text-stone-900">
                Fulfilment
              </h2>
            </div>
            <dl className="space-y-3 px-5 py-4 text-sm">
              <DetailRow icon={<MapPin />} label="Method">
                {FULFILLMENT_LABELS[order.fulfillmentType]}
              </DetailRow>
              <DetailRow icon={<Phone />} label="Phone">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="hover:text-brand-700"
                >
                  {order.customerPhone}
                </a>
              </DetailRow>
              <DetailRow icon={<Mail />} label="Email">
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="break-all hover:text-brand-700"
                >
                  {order.customerEmail}
                </a>
              </DetailRow>
              {order.deliveryAddress ? (
                <DetailRow icon={<MapPin />} label="Address">
                  {order.deliveryAddress}
                </DetailRow>
              ) : null}
              {order.notes ? (
                <DetailRow icon={<ReceiptText />} label="Notes">
                  {order.notes}
                </DetailRow>
              ) : null}
            </dl>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="text-base font-semibold text-stone-900">
                Payments
              </h2>
            </div>

            {order.payments.length === 0 ? (
              <p className="px-5 py-4 text-sm text-stone-500">
                No payment attempts yet.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {order.payments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        description="This cannot be undone. Any pending payment attempt will be abandoned."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        tone="danger"
        loading={cancelOrder.isPending}
        onConfirm={() =>
          cancelOrder.mutate(
            { id: order.id },
            { onSuccess: () => setConfirmCancel(false) },
          )
        }
        onClose={() => setConfirmCancel(false)}
      />
    </div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  return (
    <li className="space-y-1.5 px-5 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-stone-900">
          {formatPrice(payment.amount)}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
            paymentToneStyles[PAYMENT_RECORD_TONES[payment.status]]
          }`}
        >
          {PAYMENT_RECORD_LABELS[payment.status]}
        </span>
      </div>
      <p className="break-all text-[11px] font-medium text-stone-400">
        {payment.reference}
      </p>
      <p className="text-xs text-stone-500">
        {payment.paidAt
          ? `Paid ${formatDateTime(payment.paidAt)}`
          : `Created ${formatDateTime(payment.createdAt)}`}
        {payment.channel ? ` · ${payment.channel}` : ""}
      </p>
    </li>
  );
}

const paymentToneStyles = {
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  stone: "bg-stone-100 text-stone-600 ring-stone-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
} as const;

function SummaryTile({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
        {label}
      </span>
      {children}
    </Card>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-stone-400 [&>svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
          {label}
        </dt>
        <dd className="mt-0.5 break-words text-stone-700">{children}</dd>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/orders"
      className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to orders
    </Link>
  );
}

function OrderNotFound() {
  return (
    <div className="space-y-6">
      <BackLink />
      <Card>
        <EmptyState
          icon={<ReceiptText className="size-5" aria-hidden="true" />}
          title="Order not found"
          description="This order may have been removed, or it belongs to a different account."
          action={<LinkButton to="/orders">View your orders</LinkButton>}
        />
      </Card>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <BackLink />
      <p className="sr-only" role="status">
        Loading order…
      </p>
      <div className="space-y-4" aria-hidden="true">
        <div className="h-8 w-56 animate-pulse rounded bg-stone-200" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-2xl bg-stone-100"
            />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
        </div>
      </div>
    </div>
  );
}
