import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

import { Alert, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { useAuthStore } from "@/features/auth/store";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatPrice } from "@/lib/format";
import { hasRequiredRole } from "@/lib/roles";

import { PaymentStatusBadge, OrderStatusBadge } from "./OrderBadges";
import { useOrders } from "./hooks";
import { FULFILLMENT_LABELS } from "./status";
import type { Order } from "./types";

export function OrdersPage() {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const ordersQuery = useOrders(page);
  const isAdmin = user ? hasRequiredRole(user.role, ["ADMIN"]) : false;

  const orders = ordersQuery.data?.items ?? [];
  const pagination = ordersQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description={
          isAdmin
            ? "Every order placed through the kitchen, newest first."
            : "Track your orders and complete any outstanding payments."
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void ordersQuery.refetch()}
            loading={ordersQuery.isFetching}
            leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
          >
            Refresh
          </Button>
        }
      />

      {ordersQuery.error ? (
        <Alert tone="error" title="Orders could not be loaded">
          <div className="flex flex-wrap items-center gap-2">
            <span>{getErrorMessage(ordersQuery.error)}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void ordersQuery.refetch()}
              loading={ordersQuery.isFetching}
            >
              Try again
            </Button>
          </div>
        </Alert>
      ) : null}

      {ordersQuery.isPending ? (
        <OrdersSkeleton />
      ) : ordersQuery.isError ? null : orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ReceiptText className="size-5" aria-hidden="true" />}
            title="No orders yet"
            description="When you place an order it will show up here with its payment and delivery status."
            action={
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <ShoppingBag className="size-4" aria-hidden="true" />
                Browse the menu
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <p aria-live="polite" className="text-sm text-stone-500">
            {pagination
              ? `${pagination.total} ${
                  pagination.total === 1 ? "order" : "orders"
                }`
              : `${orders.length} orders`}
          </p>

          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} showCustomer={isAdmin} />
              </li>
            ))}
          </ul>

          {pagination && pagination.totalPages > 1 ? (
            <nav
              aria-label="Order pages"
              className="flex items-center justify-between gap-3"
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                leftIcon={<ChevronLeft className="size-4" aria-hidden="true" />}
              >
                Previous
              </Button>
              <span className="text-sm text-stone-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
                rightIcon={<ChevronRight className="size-4" aria-hidden="true" />}
              >
                Next
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}

function OrderCard({
  order,
  showCustomer,
}: {
  order: Order;
  showCustomer: boolean;
}) {
  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const itemSummary = order.items
    .slice(0, 2)
    .map((item) => item.menuName)
    .join(", ");

  return (
    <Link
      to={`/orders/${order.id}`}
      className="group block rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition-colors hover:border-stone-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900">
            {order.orderNumber}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            {formatDateTime(order.createdAt)} ·{" "}
            {FULFILLMENT_LABELS[order.fulfillmentType]}
            {showCustomer ? ` · ${order.customerName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0 text-sm text-stone-600">
          <p className="truncate">
            {itemSummary}
            {order.items.length > 2
              ? ` +${order.items.length - 2} more`
              : ""}
          </p>
          <p className="mt-0.5 text-xs text-stone-400">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-base font-semibold text-stone-900">
            {formatPrice(order.total)}
          </span>
          <ArrowRight
            className="size-4 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
}

function OrdersSkeleton() {
  return (
    <div>
      <p className="sr-only" role="status">
        Loading orders…
      </p>
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex justify-between gap-3">
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
                <div className="h-3 w-56 animate-pulse rounded bg-stone-100" />
              </div>
              <div className="h-5 w-24 animate-pulse rounded-full bg-stone-100" />
            </div>
            <div className="mt-4 flex justify-between">
              <div className="h-3 w-48 animate-pulse rounded bg-stone-100" />
              <div className="h-4 w-20 animate-pulse rounded bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
