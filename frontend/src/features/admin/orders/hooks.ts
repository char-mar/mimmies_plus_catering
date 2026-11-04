import toast from "react-hot-toast";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { OrderStatus } from "@/features/orders/types";
import { getErrorMessage } from "@/lib/errors";
import { ORDER_STATUS_LABELS } from "@/features/orders/status";
import { adminOrderKeys, analyticsKeys, orderKeys } from "@/lib/query-keys";

import * as adminOrdersApi from "./api";
import type { AdminOrderFilters } from "./api";

export function useAdminOrders(filters: AdminOrderFilters) {
  return useQuery({
    queryKey: adminOrderKeys.list(filters),
    queryFn: () => adminOrdersApi.listAdminOrders(filters),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: OrderStatus;
      note?: string;
    }) => adminOrdersApi.updateOrderStatus(id, status, note),
    onSuccess: (order) => {
      toast.success(
        `Order ${order.orderNumber} is now ${ORDER_STATUS_LABELS[order.status].toLowerCase()}.`,
      );
      void queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
