import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Send } from "lucide-react";

import { Alert, Button, Input, LinkButton } from "@/components/ui";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { getErrorMessage } from "@/lib/errors";
import { validateEmail } from "@/lib/validation";

import { useForgotPassword } from "../hooks";

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextError = validateEmail(email);
    setError(nextError);

    if (nextError) {
      return;
    }

    forgotPassword.mutate(email.trim().toLowerCase());
  };

  if (forgotPassword.isSuccess) {
    return (
      <FadeIn className="space-y-7">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Mail className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Check your inbox
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">
            If an account exists for{" "}
            <span className="font-semibold text-stone-700">{email}</span>, we
            have sent a password reset link. The link expires in 60 minutes.
          </p>
        </div>
        <Alert tone="info">
          Nothing arrived? Check your spam folder, then try again with the same
          address.
        </Alert>
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              forgotPassword.reset();
            }}
          >
            Use a different email
          </Button>
          <LinkButton to="/login" variant="ghost" fullWidth>
            Back to sign in
          </LinkButton>
        </div>
      </FadeIn>
    );
  }

  return (
    <Stagger className="space-y-8">
      <StaggerItem>
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Account recovery
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Forgot your password?
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">
            Enter the email linked to your account and we will send you a secure
            reset link.
          </p>
        </header>
      </StaggerItem>

      <StaggerItem>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {forgotPassword.error ? (
            <Alert tone="error">{getErrorMessage(forgotPassword.error)}</Alert>
          ) : null}

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(undefined);
              forgotPassword.reset();
            }}
            error={error}
            leftIcon={<Mail className="size-4" aria-hidden="true" />}
            required
            autoFocus
          />

          <Button
            type="submit"
            fullWidth
            loading={forgotPassword.isPending}
            leftIcon={<Send className="size-4" aria-hidden="true" />}
          >
            Send reset link
          </Button>
        </form>
      </StaggerItem>

      <StaggerItem>
        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-semibold text-stone-600 transition hover:text-stone-900"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </StaggerItem>
    </Stagger>
  );
}
