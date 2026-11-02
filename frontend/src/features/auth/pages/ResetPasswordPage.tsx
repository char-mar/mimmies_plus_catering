import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { KeyRound } from "lucide-react";

import {
  Alert,
  Button,
  LinkButton,
  PasswordInput,
} from "@/components/ui";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { getErrorMessage } from "@/lib/errors";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/validation";

import { useResetPassword } from "../hooks";

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

export function ResetPasswordPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");
  const resetPassword = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  if (!token) {
    return (
      <FadeIn className="space-y-7">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <KeyRound className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Reset link is incomplete
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">
            This page needs a valid token from your password reset email.
          </p>
        </div>
        <Alert tone="error">
          Request a new link below. For your security, reset links expire after
          60 minutes.
        </Alert>
        <LinkButton to="/forgot-password" fullWidth>
          Request a new link
        </LinkButton>
      </FadeIn>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {
      password: validatePassword(password),
      confirmPassword: validatePasswordConfirmation(password, confirmPassword),
    };

    setErrors(nextErrors);

    if (nextErrors.password || nextErrors.confirmPassword) {
      return;
    }

    resetPassword.mutate({ token, password });
  };

  return (
    <Stagger className="space-y-8">
      <StaggerItem>
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Account recovery
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Choose a new password
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">
            Resetting your password signs out every device that is currently
            signed in.
          </p>
        </header>
      </StaggerItem>

      <StaggerItem>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {resetPassword.error ? (
            <Alert tone="error">{getErrorMessage(resetPassword.error)}</Alert>
          ) : null}

          <PasswordInput
            label="New password"
            autoComplete="new-password"
            placeholder="At least 10 characters"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              resetPassword.reset();
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            error={errors.password}
            hint="Use at least 10 characters, up to 72."
            required
            autoFocus
          />

          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              resetPassword.reset();
              setErrors((current) => ({
                ...current,
                confirmPassword: undefined,
              }));
            }}
            error={errors.confirmPassword}
            required
          />

          <Button type="submit" fullWidth loading={resetPassword.isPending}>
            Reset password
          </Button>
        </form>
      </StaggerItem>

      <StaggerItem>
        <Link
          to="/login"
          className="block text-center text-sm font-semibold text-stone-600 transition hover:text-stone-900"
        >
          Back to sign in
        </Link>
      </StaggerItem>
    </Stagger>
  );
}
