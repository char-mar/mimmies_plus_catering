import toast from "react-hot-toast";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getErrorMessage } from "@/lib/errors";
import { orderKeys, paymentKeys } from "@/lib/query-keys";

import * as ordersApi from "./api";
import type { CreateOrderInput } from "./types";

const ORDERS_PAGE_SIZE = 10;

export function useOrders(page = 1, limit = ORDERS_PAGE_SIZE) {
  return useQuery({
    queryKey: orderKeys.list(page, limit),
    queryFn: () => ordersApi.listOrders(page, limit),
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: () => {
      if (!id) {
        throw new Error("An order id is required.");
      }

      return ordersApi.getOrder(id);
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersApi.createOrder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ordersApi.cancelOrder(id, reason),
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} was cancelled.`);
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePayOrder() {
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.initializeOrderPayment(orderId),
    onSuccess: ({ authorizationUrl }) => {
      window.location.assign(authorizationUrl);
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(
          error,
          "Payment could not be started. Please try again.",
        ),
      ),
  });
}

export function useVerifyPayment(reference: string | null) {
  return useQuery({
    queryKey: paymentKeys.verify(reference ?? ""),
    queryFn: () => {
      if (!reference) {
        throw new Error("A payment reference is required.");
      }

      return ordersApi.verifyPayment(reference);
    },
    enabled: Boolean(reference),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    gcTime: Infinity,
  });
}
