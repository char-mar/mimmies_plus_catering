import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";

import { Alert, LinkButton, Spinner } from "@/components/ui";
import { FadeIn } from "@/components/motion";
import { getErrorMessage } from "@/lib/errors";
import { authKeys } from "@/lib/query-keys";

import { useVerifyEmail } from "../hooks";
import { useAuthStore } from "../store";

export function VerifyEmailPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");
  const verifyEmail = useVerifyEmail();
  const { mutate } = verifyEmail;
  const queryClient = useQueryClient();
  const startedRef = useRef(false);
  const authenticated = useAuthStore(
    (state) => state.status === "authenticated",
  );

  useEffect(() => {
    if (!token || startedRef.current) {
      return;
    }

    startedRef.current = true;

    mutate(token, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: authKeys.me });
      },
    });
  }, [mutate, queryClient, token]);

  if (!token) {
    return (
      <FadeIn className="space-y-7">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <AlertCircle className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Verification link is incomplete
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">
            This page needs a valid token from your verification email.
          </p>
        </div>
        <Alert tone="error">
          Sign in and use the banner on your dashboard to request a fresh link.
        </Alert>
        <LinkButton to="/login" fullWidth>
          Continue to sign in
        </LinkButton>
      </FadeIn>
    );
  }

  if (verifyEmail.isError) {
    return (
      <FadeIn className="space-y-7">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <AlertCircle className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            We could not verify your email
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">
            {getErrorMessage(verifyEmail.error)}
          </p>
        </div>
        <Alert tone="info">
          The link may have expired or already been used. Sign in and request a
          new one from your dashboard.
        </Alert>
        <LinkButton to="/login" fullWidth>
          Back to sign in
        </LinkButton>
      </FadeIn>
    );
  }

  if (verifyEmail.isSuccess) {
    return (
      <FadeIn className="space-y-7">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Email verified
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">
            Your address is confirmed. Your account is now fully secured.
          </p>
        </div>
        <LinkButton to={authenticated ? "/dashboard" : "/login"} fullWidth>
          {authenticated ? "Go to dashboard" : "Continue to sign in"}
        </LinkButton>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="space-y-7">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <Mail className="size-6" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
          Verifying your email
        </h1>
        <p className="text-sm leading-relaxed text-stone-500">
          Hold on while we confirm your verification link.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500">
        <Spinner className="size-4" />
        This usually takes a second.
      </div>
    </FadeIn>
  );
}
