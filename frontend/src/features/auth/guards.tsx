import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { hasRequiredRole } from "@/lib/roles";

import { useAuthStore } from "./store";
import type { UserRole } from "./types";

export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status !== "authenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  return <>{children}</>;
}

export function RequireRole({
  roles,
  children,
}: {
  roles: readonly UserRole[];
  children: ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (!hasRequiredRole(user.role, roles)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
