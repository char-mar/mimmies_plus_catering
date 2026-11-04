import { useState } from "react";
import {
  Clock,
  MessageSquare,
  ReceiptText,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import {
  Alert,
  Button,
  Card,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";
import { ORDER_STATUS_LABELS } from "@/features/orders/status";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";

import { AreaChart, BarChart, BreakdownList } from "./charts";
import type { ChartPoint } from "./charts";
import { useAnalytics } from "./hooks";

const RANGE_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

function dayLabel(date: string, style: "short" | "full"): string {
  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(
    undefined,
    style === "short"
      ? { month: "short", day: "numeric", timeZone: "UTC" }
      : { dateStyle: "medium", timeZone: "UTC" },
  ).format(parsed);
}

function channelLabel(channel: string): string {
  if (channel === "unknown") {
    return "Unknown";
  }

  return channel.charAt(0).toUpperCase() + channel.slice(1);
}

export function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const analyticsQuery = useAnalytics(days);

  const data = analyticsQuery.data;

  const revenuePoints: ChartPoint[] =
    data?.series.map((point) => ({
      label: dayLabel(point.date, "full"),
      shortLabel: dayLabel(point.date, "short"),
      value: point.revenue,
    })) ?? [];

  const orderPoints: ChartPoint[] =
    data?.series.map((point) => ({
      label: dayLabel(point.date, "full"),
      shortLabel: dayLabel(point.date, "short"),
      value: point.orders,
    })) ?? [];

  const statusItems =
    data?.orderStatus
      .filter((slice) => slice.count > 0)
      .map((slice) => ({
        label: ORDER_STATUS_LABELS[slice.status],
        value: slice.count,
      })) ?? [];

  const topItems =
    data?.topItems.map((item) => ({
      label: item.menuName,
      value: item.quantity,
      meta: formatPrice(item.revenue),
    })) ?? [];

  const channelItems =
    data?.paymentChannels.map((channel) => ({
      label: channelLabel(channel.channel),
      value: Number(channel.amount),
      meta: `${channel.count} ${channel.count === 1 ? "payment" : "payments"}`,
    })) ?? [];

  const totals = data?.totals;

  const kpis = [
    {
      icon: TrendingUp,
      label: "Revenue",
      value: formatPrice(totals?.revenue ?? "0"),
      hint: `${totals?.paidOrders ?? 0} paid orders`,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: ReceiptText,
      label: "Orders",
      value: String(totals?.orders ?? 0),
      hint: "Placed in this period",
      iconClass: "bg-brand-50 text-brand-700",
    },
    {
      icon: Wallet,
      label: "Average payment",
      value: formatPrice(totals?.averageOrderValue ?? "0"),
      hint: "Per successful charge",
      iconClass: "bg-sky-50 text-sky-700",
    },
    {
      icon: Clock,
      label: "Pending payments",
      value: String(totals?.pendingPayments ?? 0),
      hint: "Open Paystack attempts",
      iconClass: "bg-amber-50 text-amber-700",
    },
    {
      icon: MessageSquare,
      label: "New contacts",
      value: String(totals?.newContacts ?? 0),
      hint: "Unread messages",
      iconClass: "bg-violet-50 text-violet-700",
    },
    {
      icon: Users,
      label: "Customers",
      value: String(totals?.customers ?? 0),
      hint: "Registered accounts",
      iconClass: "bg-stone-100 text-stone-600",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Revenue, order flow, and payment mix across the kitchen at a glance."
        actions={
          <div className="flex items-end gap-2">
            <Select
              label="Range"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="w-40"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              size="sm"
              className="h-10"
              onClick={() => void analyticsQuery.refetch()}
              loading={analyticsQuery.isFetching && !analyticsQuery.isPending}
              leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {analyticsQuery.isPending ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-20">
            <Spinner />
            <p className="text-sm text-stone-500">Crunching the numbers…</p>
          </div>
        </Card>
      ) : analyticsQuery.isError ? (
        <Card className="p-6">
          <Alert tone="error" title="Could not load analytics">
            {getErrorMessage(analyticsQuery.error)}
          </Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => void analyticsQuery.refetch()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map(({ icon: Icon, label, value, hint, iconClass }) => (
              <Card key={label} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex size-9 items-center justify-center rounded-xl ${iconClass}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                    {data.rangeDays}d
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                  {label}
                </p>
                <p className="mt-1 text-xl font-semibold text-stone-900">
                  {value}
                </p>
                <p className="text-xs text-stone-500">{hint}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    Revenue trend
                  </h2>
                  <p className="text-sm text-stone-500">
                    Successful Paystack charges per day.
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-700">
                  {formatPrice(totals?.revenue ?? "0")}
                </span>
              </div>
              <div className="mt-5">
                <AreaChart
                  points={revenuePoints}
                  tone="emerald"
                  formatValue={(value) => formatPrice(value)}
                  emptyMessage="No successful payments in this period yet."
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    Orders per day
                  </h2>
                  <p className="text-sm text-stone-500">
                    Volume of orders placed each day.
                  </p>
                </div>
                <span className="text-sm font-semibold text-brand-700">
                  {totals?.orders ?? 0} orders
                </span>
              </div>
              <div className="mt-5">
                <BarChart
                  points={orderPoints}
                  formatValue={(value) =>
                    `${value} ${value === 1 ? "order" : "orders"}`
                  }
                  emptyMessage="No orders in this period yet."
                />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-stone-900">
                Order status
              </h2>
              <p className="mb-4 text-sm text-stone-500">
                Where orders are sitting right now.
              </p>
              <BreakdownList
                items={statusItems}
                emptyMessage="No orders in this period yet."
              />
            </Card>

            <Card className="p-6">
              <h2 className="text-base font-semibold text-stone-900">
                Top dishes
              </h2>
              <p className="mb-4 text-sm text-stone-500">
                Best sellers by quantity ordered.
              </p>
              <BreakdownList
                items={topItems}
                toneClass="bg-brand-500"
                formatValue={(value) => `${value} sold`}
                emptyMessage="No dish sales in this period yet."
              />
            </Card>

            <Card className="p-6">
              <h2 className="text-base font-semibold text-stone-900">
                Payment channels
              </h2>
              <p className="mb-4 text-sm text-stone-500">
                How successful payments were made.
              </p>
              <BreakdownList
                items={channelItems}
                toneClass="bg-emerald-500"
                formatValue={(value) => formatPrice(value)}
                emptyMessage="No successful payments in this period yet."
              />
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
