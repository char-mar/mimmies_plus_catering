import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getErrorMessage } from "@/lib/errors";
import { authKeys } from "@/lib/query-keys";

import * as authApi from "./api";
import { useAuthStore } from "./store";
import type { LoginInput, RegisterInput } from "./types";

interface RedirectState {
  from?: string;
}

function useRedirectTarget(): string {
  const location = useLocation();
  const state = location.state as RedirectState | null;

  return state?.from ?? "/";
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const redirectTo = useRedirectTarget();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.loginRequest(input),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(authKeys.me, session.user);
      toast.success(`Welcome back, ${session.user.name.split(" ")[0]}.`);
      navigate(redirectTo, { replace: true });
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const redirectTo = useRedirectTarget();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.registerRequest(input),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(authKeys.me, session.user);
      toast.success("Your account is ready.");
      navigate(redirectTo, { replace: true });
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logoutRequest,
    onSuccess: () => toast.success("You have been signed out."),
    onError: (error) =>
      toast.error(
        getErrorMessage(error, "Signed out on this device, but the server could not be reached."),
      ),
    onSettled: () => {
      clearSession();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
}

export function useMe() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.fetchMe,
    enabled: status === "authenticated",
    initialData: user ?? undefined,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}

export function useChangePassword() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (newPassword: string) =>
      authApi.changePasswordRequest(newPassword),
    onSuccess: () => {
      clearSession();
      queryClient.clear();
      toast.success("Password updated. Please sign in again.");
      navigate("/login", { replace: true });
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: authApi.requestEmailVerification,
    onSuccess: () =>
      toast.success(
        "If your email still needs verification, a new link is on its way.",
      ),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
    onSuccess: () => {
      toast.success("Password reset. Please sign in with your new password.");
      navigate("/login", { replace: true });
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.confirmEmailVerification(token),
  });
}
