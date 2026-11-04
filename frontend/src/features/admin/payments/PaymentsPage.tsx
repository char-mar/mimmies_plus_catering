import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  CircleAlert,
  Clock,
  CreditCard,
  RotateCcw,
  Search,
  Wallet,
} from "lucide-react";

import { Pagination } from "@/components/Pagination";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";
import {
  PAYMENT_RECORD_LABELS,
  PAYMENT_RECORD_TONES,
} from "@/features/orders/status";
import { paymentRecordStatuses } from "@/features/orders/types";
import type { PaymentRecordStatus } from "@/features/orders/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatPrice } from "@/lib/format";

import { usePaymentSummary, usePayments } from "./hooks";

const PAGE_SIZE = 20;

export function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PaymentRecordStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const paymentsQuery = usePayments({
    page,
    limit: PAGE_SIZE,
    status,
    search,
  });
  const summaryQuery = usePaymentSummary();

  const payments = paymentsQuery.data?.items ?? [];
  const pagination = paymentsQuery.data?.pagination;
  const summary = summaryQuery.data;
  const hasFilters = Boolean(status || search);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setStatus("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const summaryCards = [
    {
      icon: Wallet,
      label: "Collected",
      value: formatPrice(summary?.collected ?? "0"),
      hint: `${summary?.successCount ?? 0} successful`,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: Clock,
      label: "Awaiting payment",
      value: formatPrice(summary?.pending ?? "0"),
      hint: `${summary?.pendingCount ?? 0} open`,
      iconClass: "bg-amber-50 text-amber-700",
    },
    {
      icon: CircleAlert,
      label: "Unsuccessful",
      value: String((summary?.failedCount ?? 0) + (summary?.abandonedCount ?? 0)),
      hint: `${summary?.failedCount ?? 0} failed · ${summary?.abandonedCount ?? 0} abandoned`,
      iconClass: "bg-red-50 text-red-700",
    },
    {
      icon: RotateCcw,
      label: "Refunded",
      value: formatPrice(summary?.refunded ?? "0"),
      hint: `${summary?.refundedCount ?? 0} refunds`,
      iconClass: "bg-stone-100 text-stone-600",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every Paystack attempt across the order book, with totals for collected, pending, and failed charges."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ icon: Icon, label, value, hint, iconClass }) => (
          <Card key={label} className="p-5">
            <span
              className={`flex size-9 items-center justify-center rounded-xl ${iconClass}`}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
              {label}
            </p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{value}</p>
            <p className="text-xs text-stone-500">{hint}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_14rem_auto]">
          <form onSubmit={submitSearch} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Input
                label="Search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Reference, order number, customer email"
                leftIcon={<Search className="size-4" aria-hidden="true" />}
              />
            </div>
            <Button type="submit" variant="secondary" className="h-11">
              Search
            </Button>
          </form>
          <Select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PaymentRecordStatus | "");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {paymentRecordStatuses.map((value) => (
              <option key={value} value={value}>
                {PAYMENT_RECORD_LABELS[value]}
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
            >
              Clear filters
            </Button>
          </div>
        </div>
      </Card>

      {paymentsQuery.isPending ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16">
            <Spinner />
            <p className="text-sm text-stone-500">Loading payments…</p>
          </div>
        </Card>
      ) : paymentsQuery.isError ? (
        <Card className="p-6">
          <Alert tone="error" title="Could not load payments">
            {getErrorMessage(paymentsQuery.error)}
          </Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => void paymentsQuery.refetch()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {payments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="size-5" aria-hidden="true" />}
              title="No payments found"
              description={
                hasFilters
                  ? "No payment attempts match these filters."
                  : "Payment attempts will appear here as customers check out."
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[56rem] text-left text-sm">
                  <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.12em] text-stone-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Reference
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Order
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Customer
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Channel
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Amount
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="transition-colors hover:bg-stone-50/70"
                      >
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-stone-700">
                            {payment.reference}
                          </p>
                          <p className="text-[11px] uppercase tracking-wide text-stone-400">
                            {payment.provider}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/orders/${payment.orderId}`}
                            className="font-medium text-brand-700 hover:underline"
                          >
                            {payment.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-stone-800">
                            {payment.customerName}
                          </p>
                          <p className="text-xs text-stone-500">
                            {payment.customerEmail}
                          </p>
                        </td>
                        <td className="px-4 py-3 capitalize text-stone-600">
                          {payment.channel ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-stone-900">
                          {formatPrice(payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={PAYMENT_RECORD_TONES[payment.status]}>
                            {PAYMENT_RECORD_LABELS[payment.status]}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">
                          {formatDateTime(payment.paidAt ?? payment.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination ? (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                  isFetching={paymentsQuery.isFetching}
                />
              ) : null}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
