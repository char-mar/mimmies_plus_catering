import { Badge } from "@/components/ui";

import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from "./status";
import type { OrderStatus, PaymentStatus } from "./types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={ORDER_STATUS_TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge tone={PAYMENT_STATUS_TONES[status]}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
