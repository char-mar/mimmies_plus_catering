import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, RefreshCw, X } from "lucide-react";

import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/features/orders/OrderBadges";
import {
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
  nextOrderStatuses,
} from "@/features/orders/status";
import {
  fulfillmentTypes,
  orderStatuses,
  paymentStatuses,
} from "@/features/orders/types";
import type {
  FulfillmentType,
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/features/orders/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatPrice } from "@/lib/format";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { motion } from "motion/react";

import { useAdminOrders, useUpdateOrderStatus } from "./hooks";

const PAGE_SIZE = 20;

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType | "">("");
  const [dialogOrder, setDialogOrder] = useState<Order | null>(null);

  const ordersQuery = useAdminOrders({
    page,
    limit: PAGE_SIZE,
    status,
    paymentStatus,
    fulfillmentType,
  });

  const orders = ordersQuery.data?.items ?? [];
  const pagination = ordersQuery.data?.pagination;
  const hasFilters = Boolean(status || paymentStatus || fulfillmentType);

  const clearFilters = () => {
    setStatus("");
    setPaymentStatus("");
    setFulfillmentType("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order management"
        description="Follow every order through the kitchen, update fulfilment status, and keep an eye on payments."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void ordersQuery.refetch()}
            loading={ordersQuery.isFetching && !ordersQuery.isPending}
            leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
          >
            Refresh
          </Button>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Order status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as OrderStatus | "");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {orderStatuses.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
          <Select
            label="Payment"
            value={paymentStatus}
            onChange={(event) => {
              setPaymentStatus(event.target.value as PaymentStatus | "");
              setPage(1);
            }}
          >
            <option value="">All payments</option>
            {paymentStatuses.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0) + value.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
          <Select
            label="Fulfilment"
            value={fulfillmentType}
            onChange={(event) => {
              setFulfillmentType(event.target.value as FulfillmentType | "");
              setPage(1);
            }}
          >
            <option value="">Pickup & delivery</option>
            {fulfillmentTypes.map((value) => (
              <option key={value} value={value}>
                {FULFILLMENT_LABELS[value]}
              </option>
            ))}
          </Select>
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-10"
              onClick={clearFilters}
              disabled={!hasFilters}
              leftIcon={<X className="size-4" aria-hidden="true" />}
            >
              Clear filters
            </Button>
          </div>
        </div>
      </Card>

      {ordersQuery.isPending ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16">
            <Spinner />
            <p className="text-sm text-stone-500">Loading orders…</p>
          </div>
        </Card>
      ) : ordersQuery.isError ? (
        <Card className="p-6">
          <Alert tone="error" title="Could not load orders">
            {getErrorMessage(ordersQuery.error)}
          </Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => void ordersQuery.refetch()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {orders.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="size-5" aria-hidden="true" />}
              title="No orders match these filters"
              description={
                hasFilters
                  ? "Try clearing the filters to see the full order book."
                  : "New orders will appear here as customers check out."
              }
              action={
                hasFilters ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[58rem] text-left text-sm">
                  <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.12em] text-stone-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Order
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Customer
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Fulfilment
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Total
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Payment
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">
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
                    {orders.map((order) => {
                      const transitions = nextOrderStatuses(
                        order.status,
                        order.fulfillmentType,
                      );

                      return (
                        <motion.tr
                          key={order.id}
                          variants={staggerItem}
                          className="transition-colors hover:bg-stone-50/70"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-stone-900">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-stone-500">
                              {formatDateTime(order.createdAt)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-stone-800">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-stone-500">
                              {order.customerEmail}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-stone-600">
                            {FULFILLMENT_LABELS[order.fulfillmentType]}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-stone-900">
                            {formatPrice(order.total)}
                          </td>
                          <td className="px-4 py-3">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="px-4 py-3">
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5">
                              <LinkButton
                                to={`/orders/${order.id}`}
                                variant="secondary"
                                size="sm"
                              >
                                View
                              </LinkButton>
                              <Button
                                size="sm"
                                disabled={transitions.length === 0}
                                onClick={() => setDialogOrder(order)}
                              >
                                Update
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              </div>
              {pagination ? (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                  isFetching={ordersQuery.isFetching}
                />
              ) : null}
            </>
          )}
        </Card>
      )}

      {dialogOrder ? (
        <OrderStatusDialog
          order={dialogOrder}
          onClose={() => setDialogOrder(null)}
        />
      ) : null}

      <p className="text-xs text-stone-400">
        Looking for your own purchases?{" "}
        <Link to="/orders" className="font-semibold text-brand-700 hover:underline">
          Open the customer order list
        </Link>
        .
      </p>
    </div>
  );
}

function OrderStatusDialog({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const updateStatus = useUpdateOrderStatus();
  const transitions = nextOrderStatuses(order.status, order.fulfillmentType);
  const [status, setStatus] = useState<OrderStatus>(
    transitions[0] ?? order.status,
  );
  const [note, setNote] = useState("");

  return (
    <Modal
      open
      onClose={() => {
        if (!updateStatus.isPending) {
          onClose();
        }
      }}
      title={`Update ${order.orderNumber}`}
      description={`${order.customerName} · ${FULFILLMENT_LABELS[order.fulfillmentType]} · ${formatPrice(order.total)}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={updateStatus.isPending}
          >
            Cancel
          </Button>
          <Button
            loading={updateStatus.isPending}
            onClick={() =>
              updateStatus.mutate(
                { id: order.id, status, note },
                { onSuccess: onClose },
              )
            }
          >
            Save status
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-stone-50 px-3.5 py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
            Current
          </span>
          <OrderStatusBadge status={order.status} />
          <Badge tone={order.paymentStatus === "PAID" ? "green" : "amber"}>
            {order.paymentStatus === "PAID" ? "Paid" : "Payment pending"}
          </Badge>
        </div>

        <Select
          label="Move to"
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          hint="Only valid next steps are listed. Cancelling releases any open payment attempt."
        >
          {transitions.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>

        <Textarea
          label="Note (optional)"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Left the kitchen at 12:40"
          hint="Saved to the order's status history."
        />
      </div>
    </Modal>
  );
}
