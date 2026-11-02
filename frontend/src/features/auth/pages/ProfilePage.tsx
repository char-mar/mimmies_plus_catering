import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { BadgeCheck, KeyRound, Mail, ShieldCheck } from "lucide-react";

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  PageHeader,
  PasswordInput,
} from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_TONES } from "@/lib/roles";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/validation";

import { useChangePassword, useResendVerification } from "../hooks";
import { useAuthStore } from "../store";

interface FieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-6 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
        {label}
      </dt>
      <dd className="text-sm text-stone-700 sm:text-right">{value}</dd>
    </div>
  );
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const changePassword = useChangePassword();
  const resendVerification = useResendVerification();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  if (!user) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {
      newPassword: validatePassword(newPassword),
      confirmPassword: validatePasswordConfirmation(
        newPassword,
        confirmPassword,
      ),
    };

    setErrors(nextErrors);

    if (nextErrors.newPassword || nextErrors.confirmPassword) {
      return;
    }

    changePassword.mutate(newPassword);
  };

  return (
    <Stagger className="space-y-6">
      <StaggerItem>
        <PageHeader
          title="Profile"
          description="Your account details, access level and sign-in security."
        />
      </StaggerItem>

      <StaggerItem className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <div className="flex items-start gap-4 border-b border-stone-200 p-6">
            <Avatar name={user.name} className="size-14 text-base" />
            <div className="min-w-0 space-y-1">
              <h2 className="truncate text-lg font-semibold text-stone-900">
                {user.name}
              </h2>
              <p className="truncate text-sm text-stone-500">{user.email}</p>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                <Badge tone={ROLE_TONES[user.role]}>
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  {ROLE_LABELS[user.role]}
                </Badge>
                <Badge tone={user.isActive ? "green" : "red"}>
                  {user.isActive ? "Active" : "Disabled"}
                </Badge>
                {user.isEmailVerified ? (
                  <Badge tone="green">
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    Verified
                  </Badge>
                ) : (
                  <Badge tone="amber">Unverified</Badge>
                )}
              </div>
            </div>
          </div>

          <dl className="divide-y divide-stone-100">
            <DetailRow
              label="Access level"
              value={ROLE_DESCRIPTIONS[user.role]}
            />
            <DetailRow
              label="Last sign-in"
              value={formatDateTime(user.lastLogin)}
            />
            <DetailRow label="Member since" value={formatDate(user.createdAt)} />
            <DetailRow
              label="Account ID"
              value={
                <span className="break-all font-mono text-xs text-stone-500">
                  {user.id}
                </span>
              }
            />
          </dl>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                <Mail className="size-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-stone-900">
                  Email verification
                </h2>
                <p className="text-sm leading-relaxed text-stone-500">
                  A verified address is required to recover your account and
                  receive order updates.
                </p>
              </div>
            </div>

            <div className="mt-4">
              {user.isEmailVerified ? (
                <Alert tone="success">
                  {user.email} is verified.
                </Alert>
              ) : (
                <div className="space-y-3">
                  <Alert tone="warning">
                    {user.email} is not verified yet.
                  </Alert>
                  <Button
                    variant="secondary"
                    fullWidth
                    loading={resendVerification.isPending}
                    onClick={() => resendVerification.mutate()}
                  >
                    Resend verification email
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-stone-900">
                  Change password
                </h2>
                <p className="text-sm leading-relaxed text-stone-500">
                  Updating your password signs you out on every device,
                  including this one.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              {changePassword.error ? (
                <Alert tone="error">
                  {getErrorMessage(changePassword.error)}
                </Alert>
              ) : null}

              <PasswordInput
                label="New password"
                autoComplete="new-password"
                placeholder="At least 10 characters"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  changePassword.reset();
                  setErrors((current) => ({
                    ...current,
                    newPassword: undefined,
                  }));
                }}
                error={errors.newPassword}
                hint="Use at least 10 characters, up to 72."
                required
              />

              <PasswordInput
                label="Confirm new password"
                autoComplete="new-password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  changePassword.reset();
                  setErrors((current) => ({
                    ...current,
                    confirmPassword: undefined,
                  }));
                }}
                error={errors.confirmPassword}
                required
              />

              <Button
                type="submit"
                fullWidth
                loading={changePassword.isPending}
              >
                Update password
              </Button>
            </form>
          </Card>
        </div>
      </StaggerItem>
    </Stagger>
  );
}
