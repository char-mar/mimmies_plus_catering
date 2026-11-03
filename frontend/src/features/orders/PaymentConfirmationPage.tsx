import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  ReceiptText,
  RefreshCw,
} from "lucide-react";

import {
  Alert,
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { springSnappy } from "@/lib/motion";
import { orderKeys } from "@/lib/query-keys";

import { OrderStatusBadge, PaymentStatusBadge } from "./OrderBadges";
import { useVerifyPayment } from "./hooks";

export function PaymentConfirmationPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? null;
  const verification = useVerifyPayment(reference);

  useEffect(() => {
    if (verification.data) {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    }
  }, [queryClient, verification.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment confirmation"
        description="We are confirming your payment with Paystack."
      />

      {!reference ? (
        <Card>
          <EmptyState
            icon={<CreditCard className="size-5" aria-hidden="true" />}
            title="No payment reference found"
            description="This page is opened after a Paystack checkout. Check your orders to see the latest payment status."
            action={<LinkButton to="/orders">View your orders</LinkButton>}
          />
        </Card>
      ) : verification.isPending ? (
        <Card className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springSnappy}
            className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"
          >
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          </motion.span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-stone-900">
              Confirming your payment…
            </p>
            <p className="break-all text-xs text-stone-400">{reference}</p>
          </div>
          <p role="status" className="sr-only">
            Verifying payment
          </p>
        </Card>
      ) : verification.isError ? (
        <div className="space-y-4">
          <Alert tone="error" title="We could not confirm this payment">
            <div className="flex flex-wrap items-center gap-2">
              <span>{getErrorMessage(verification.error)}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void verification.refetch()}
                loading={verification.isFetching}
                leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
              >
                Try again
              </Button>
            </div>
          </Alert>
          <p className="break-all text-xs text-stone-400">
            Reference: {reference}
          </p>
          <Card className="p-4">
            <p className="text-sm text-stone-600">
              If you were charged but this page did not confirm it, your payment
              may still be processing. Open the order to check its status, or
              try again in a moment.
            </p>
            <Link
              to="/orders"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              <ReceiptText className="size-4" aria-hidden="true" />
              View your orders
            </Link>
          </Card>
        </div>
      ) : verification.data ? (
        <Card className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springSnappy}
            className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
          >
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </motion.span>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-stone-900">
              Payment confirmed
            </h2>
            <p className="text-sm text-stone-500">
              Order {verification.data.orderNumber} is paid. We will keep you
              posted as the kitchen prepares it.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <OrderStatusBadge status={verification.data.status} />
            <PaymentStatusBadge status={verification.data.paymentStatus} />
            <span className="text-sm font-semibold text-stone-900">
              {formatPrice(verification.data.total)}
            </span>
          </div>

          {verification.data.status === "CANCELLED" ? (
            <Alert tone="warning" title="This order was cancelled">
              Payment was received for a cancelled order. Please contact support
              so a refund can be arranged.
            </Alert>
          ) : null}

          <div className="flex flex-wrap justify-center gap-2">
            <LinkButton to={`/orders/${verification.data.id}`}>
              View order
            </LinkButton>
            <LinkButton to="/" variant="secondary">
              Browse the menu
            </LinkButton>
          </div>

          <p className="break-all text-[11px] text-stone-400">
            Reference: {reference}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
