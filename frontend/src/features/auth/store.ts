import { create } from "zustand";

import type { AuthSessionData, User } from "./types";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  setSession: (session: AuthSessionData) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
  setStatus: (status: AuthStatus) => void;
}

// The access token is intentionally kept in memory only. Persisting it would
// expose it to XSS, and the httpOnly refresh cookie already lets the app
// restore the session on reload.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setSession: ({ user, accessToken }) =>
    set({ user, accessToken, status: "authenticated" }),
  setUser: (user) => set({ user }),
  clearSession: () =>
    set({ user: null, accessToken: null, status: "unauthenticated" }),
  setStatus: (status) => set({ status }),
}));

export function selectIsAuthenticated(state: AuthState): boolean {
  return state.status === "authenticated" && state.user !== null;
}
