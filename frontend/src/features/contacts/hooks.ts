import toast from "react-hot-toast";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getErrorMessage } from "@/lib/errors";
import { contactKeys } from "@/lib/query-keys";

import * as contactsApi from "./api";
import type { ContactStatus, CreateContactInput } from "./types";

export function useCreateContact() {
  return useMutation({
    mutationFn: (input: CreateContactInput) =>
      contactsApi.createContact(input),
    onError: (error) =>
      toast.error(
        getErrorMessage(
          error,
          "Your message could not be sent. Please try again.",
        ),
      ),
  });
}

export function useContacts(filters: {
  page: number;
  limit: number;
  status?: ContactStatus | "";
}) {
  return useQuery({
    queryKey: contactKeys.list({
      page: filters.page,
      limit: filters.limit,
      status: filters.status || undefined,
    }),
    queryFn: () => contactsApi.listContacts(filters),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useUpdateContactStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactStatus }) =>
      contactsApi.updateContactStatus(id, status),
    onSuccess: () => {
      toast.success("Contact updated.");
      void queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsApi.deleteContact(id),
    onSuccess: () => {
      toast.success("Contact message deleted.");
      void queryClient.invalidateQueries({ queryKey: contactKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
