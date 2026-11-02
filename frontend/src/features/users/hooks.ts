import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import type { UserRole } from "@/features/auth/types";
import { getErrorMessage } from "@/lib/errors";
import { userKeys } from "@/lib/query-keys";
import { ROLE_LABELS } from "@/lib/roles";

import * as usersApi from "./api";

export function useUsers(page: number, limit = 20) {
  return useQuery({
    queryKey: userKeys.list(page, limit),
    queryFn: () => usersApi.listUsers({ page, limit }),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      usersApi.updateUserRole(id, role),
    onSuccess: (user) => {
      toast.success(
        `${user.name}'s role is now ${ROLE_LABELS[user.role].toLowerCase()}.`,
      );
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.updateUserStatus(id, isActive),
    onSuccess: (user) => {
      toast.success(
        `${user.name} is now ${user.isActive ? "active" : "deactivated"}.`,
      );
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
