import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, UserRound } from "lucide-react";

import { Alert, Button, Input, PasswordInput } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { getErrorMessage } from "@/lib/errors";
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/validation";

import { useRegister } from "../hooks";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterPage() {
  const register = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validatePasswordConfirmation(password, confirmPassword),
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    register.mutate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
  };

  const clearError = (field: keyof FieldErrors) => {
    register.reset();
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  return (
    <Stagger className="space-y-8">
      <StaggerItem>
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Get started
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Create your account
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">
            Order from the menu, follow your deliveries and manage your details
            in one place.
          </p>
        </header>
      </StaggerItem>

      <StaggerItem>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {register.error ? (
            <Alert tone="error">{getErrorMessage(register.error)}</Alert>
          ) : null}

          <Input
            label="Full name"
            autoComplete="name"
            placeholder="Ama Mensah"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearError("name");
            }}
            error={errors.name}
            leftIcon={<UserRound className="size-4" aria-hidden="true" />}
            required
            autoFocus
          />

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError("email");
            }}
            error={errors.email}
            leftIcon={<Mail className="size-4" aria-hidden="true" />}
            required
          />

          <PasswordInput
            label="Password"
            autoComplete="new-password"
            placeholder="At least 10 characters"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError("password");
            }}
            error={errors.password}
            hint="Use at least 10 characters, up to 72."
            required
          />

          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearError("confirmPassword");
            }}
            error={errors.confirmPassword}
            required
          />

          <p className="text-xs leading-relaxed text-stone-500">
            We will email you a link to verify your address. You can keep
            working while it is pending.
          </p>

          <Button
            type="submit"
            fullWidth
            loading={register.isPending}
            rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
          >
            Create account
          </Button>
        </form>
      </StaggerItem>

      <StaggerItem>
        <p className="text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-700 transition hover:text-brand-800"
          >
            Sign in
          </Link>
        </p>
      </StaggerItem>
    </Stagger>
  );
}
