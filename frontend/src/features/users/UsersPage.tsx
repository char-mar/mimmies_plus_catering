import { useState } from "react";
import { motion } from "motion/react";
import { RefreshCw, Users } from "lucide-react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pagination } from "@/components/Pagination";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";
import { useAuthStore } from "@/features/auth/store";
import { userRoles } from "@/features/auth/types";
import type { User, UserRole } from "@/features/auth/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_TONES } from "@/lib/roles";

import { useUpdateUserRole, useUpdateUserStatus, useUsers } from "./hooks";

const PAGE_SIZE = 20;

export function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const usersQuery = useUsers(page, PAGE_SIZE);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const [roleDialog, setRoleDialog] = useState<{
    user: User;
    role: UserRole;
  } | null>(null);
  const [statusDialog, setStatusDialog] = useState<User | null>(null);

  if (!currentUser) {
    return null;
  }

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const canManageRole = (target: User) =>
    isSuperAdmin && target.id !== currentUser.id;

  // Mirrors the backend: admins may only activate or deactivate customers,
  // while super admins can manage everyone except themselves.
  const canManageStatus = (target: User) =>
    target.id !== currentUser.id &&
    (isSuperAdmin || target.role === "CUSTOMER");

  const confirmRoleChange = () => {
    if (!roleDialog) {
      return;
    }

    updateRole.mutate(
      { id: roleDialog.user.id, role: roleDialog.role },
      { onSuccess: () => setRoleDialog(null) },
    );
  };

  const confirmStatusChange = () => {
    if (!statusDialog) {
      return;
    }

    updateStatus.mutate(
      { id: statusDialog.id, isActive: !statusDialog.isActive },
      { onSuccess: () => setStatusDialog(null) },
    );
  };

  const users = usersQuery.data?.items ?? [];
  const pagination = usersQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage access for every account. Changes apply on the user's next request, and deactivation revokes active sessions."
        actions={
          <Button
            variant="secondary"
            onClick={() => void usersQuery.refetch()}
            loading={usersQuery.isFetching && !usersQuery.isPending}
            leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
          >
            Refresh
          </Button>
        }
      />

      <Alert tone="info">
        {isSuperAdmin
          ? "As a super admin you can change roles and account status for everyone except yourself."
          : "As an admin you can activate or deactivate customer accounts. Roles and staff accounts are managed by super admins."}
      </Alert>

      {usersQuery.isPending ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16">
            <Spinner />
            <p className="text-sm text-stone-500">Loading users…</p>
          </div>
        </Card>
      ) : usersQuery.isError ? (
        <Card className="p-6">
          <Alert tone="error" title="Could not load users">
            {getErrorMessage(usersQuery.error)}
          </Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => void usersQuery.refetch()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {users.length === 0 ? (
            <EmptyState
              icon={<Users className="size-5" aria-hidden="true" />}
              title="No users found"
              description="Accounts will appear here as people register."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[46rem] text-left text-sm">
                  <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.12em] text-stone-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        User
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Role
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Last sign-in
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Joined
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
                    {users.map((user) => {
                      const isSelf = user.id === currentUser.id;

                      return (
                        <motion.tr
                          key={user.id}
                          variants={staggerItem}
                          className="transition-colors hover:bg-stone-50/70"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={user.name} />
                              <div className="min-w-0">
                                <p className="flex items-center gap-1.5 truncate font-medium text-stone-900">
                                  {user.name}
                                  {isSelf ? (
                                    <span className="text-xs font-normal text-stone-400">
                                      (you)
                                    </span>
                                  ) : null}
                                </p>
                                <p className="truncate text-xs text-stone-500">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={ROLE_TONES[user.role]}>
                              {ROLE_LABELS[user.role]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-1">
                              <Badge tone={user.isActive ? "green" : "red"}>
                                {user.isActive ? "Active" : "Disabled"}
                              </Badge>
                              {!user.isEmailVerified ? (
                                <span className="text-[11px] text-amber-700">
                                  Email unverified
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">
                            {formatDateTime(user.lastLogin)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5">
                              {canManageRole(user) ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    setRoleDialog({
                                      user,
                                      role: user.role,
                                    })
                                  }
                                >
                                  Change role
                                </Button>
                              ) : null}
                              {canManageStatus(user) ? (
                                <Button
                                  variant={user.isActive ? "danger" : "secondary"}
                                  size="sm"
                                  onClick={() => setStatusDialog(user)}
                                >
                                  {user.isActive ? "Deactivate" : "Activate"}
                                </Button>
                              ) : null}
                              {!canManageRole(user) &&
                              !canManageStatus(user) ? (
                                <span className="px-2 text-xs text-stone-400">
                                  —
                                </span>
                              ) : null}
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
                  isFetching={usersQuery.isFetching}
                />
              ) : null}
            </>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={roleDialog !== null}
        title="Change user role"
        description={`Update the access level for ${
          roleDialog?.user.name ?? "this user"
        }. Role changes take effect immediately.`}
        confirmLabel="Save role"
        loading={updateRole.isPending}
        onConfirm={confirmRoleChange}
        onClose={() => {
          if (!updateRole.isPending) {
            setRoleDialog(null);
          }
        }}
      >
        {roleDialog ? (
          <Select
            label="Role"
            value={roleDialog.role}
            onChange={(event) =>
              setRoleDialog({
                ...roleDialog,
                role: event.target.value as UserRole,
              })
            }
            hint={ROLE_DESCRIPTIONS[roleDialog.role]}
          >
            {userRoles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={statusDialog !== null}
        title={
          statusDialog?.isActive ? "Deactivate account" : "Activate account"
        }
        description={
          statusDialog?.isActive
            ? `Deactivating ${statusDialog.name} signs them out immediately and blocks future sign-ins until the account is reactivated.`
            : `Activating ${statusDialog?.name ?? "this account"} restores sign-in access.`
        }
        confirmLabel={statusDialog?.isActive ? "Deactivate" : "Activate"}
        tone={statusDialog?.isActive ? "danger" : "primary"}
        loading={updateStatus.isPending}
        onConfirm={confirmStatusChange}
        onClose={() => {
          if (!updateStatus.isPending) {
            setStatusDialog(null);
          }
        }}
      />
    </div>
  );
}
