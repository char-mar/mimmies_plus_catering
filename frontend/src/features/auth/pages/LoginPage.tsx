import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";

import { Alert, Button, Input, PasswordInput } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { getErrorMessage } from "@/lib/errors";
import { validateEmail } from "@/lib/validation";

import { useLogin } from "../hooks";

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {
      email: validateEmail(email),
      password: password ? undefined : "Password is required.",
    };

    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    login.mutate({ email: email.trim().toLowerCase(), password });
  };

  return (
    <Stagger className="space-y-8">
      <StaggerItem>
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Welcome back
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Sign in to your account
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">
            Manage the kitchen, keep orders moving and stay on top of every
            delivery.
          </p>
        </header>
      </StaggerItem>

      <StaggerItem>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {login.error ? (
            <Alert tone="error">{getErrorMessage(login.error)}</Alert>
          ) : null}

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              login.reset();
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            error={errors.email}
            leftIcon={<Mail className="size-4" aria-hidden="true" />}
            required
            autoFocus
          />

          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              login.reset();
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            error={errors.password}
            required
          />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-brand-700 transition hover:text-brand-800"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={login.isPending}
            rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
          >
            Sign in
          </Button>
        </form>
      </StaggerItem>

      <StaggerItem>
        <p className="text-center text-sm text-stone-500">
          New to Mimmies Plus?{" "}
          <Link
            to="/register"
            className="font-semibold text-brand-700 transition hover:text-brand-800"
          >
            Create an account
          </Link>
        </p>
      </StaggerItem>
    </Stagger>
  );
}
