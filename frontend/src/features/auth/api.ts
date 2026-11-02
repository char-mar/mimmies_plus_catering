import { apiRequest } from "@/lib/api";

import type {
  AuthSessionData,
  LoginInput,
  RegisterInput,
  User,
} from "./types";

export async function loginRequest(input: LoginInput): Promise<AuthSessionData> {
  const response = await apiRequest<AuthSessionData>("/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });

  return response.data;
}

export async function registerRequest(
  input: RegisterInput,
): Promise<AuthSessionData> {
  const response = await apiRequest<AuthSessionData>("/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });

  return response.data;
}

export async function logoutRequest(): Promise<void> {
  await apiRequest<undefined>("/auth/logout", {
    method: "POST",
    auth: false,
  });
}

export async function fetchMe(): Promise<User> {
  const response = await apiRequest<User>("/auth/me");
  return response.data;
}

export async function changePasswordRequest(
  newPassword: string,
): Promise<void> {
  await apiRequest<undefined>("/auth/change-password", {
    method: "PATCH",
    body: { newPassword },
  });
}

export async function requestEmailVerification(): Promise<void> {
  await apiRequest<undefined>("/auth/verify-email/request", {
    method: "POST",
  });
}

export async function confirmEmailVerification(token: string): Promise<void> {
  await apiRequest<undefined>("/auth/verify-email/confirm", {
    method: "POST",
    body: { token },
    auth: false,
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest<undefined>("/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  await apiRequest<undefined>("/auth/reset-password", {
    method: "POST",
    body: { token, password },
    auth: false,
  });
}
