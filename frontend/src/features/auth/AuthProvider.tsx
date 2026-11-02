import { useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ChefHat, Loader2 } from "lucide-react";

import { refreshSession } from "@/lib/api";
import { springSnappy } from "@/lib/motion";

import { useAuthStore } from "./store";
import type { AuthSessionData } from "./types";

// Kept at module scope so React StrictMode's double-mounted effect shares one
// refresh request instead of rotating the refresh token twice.
let bootstrapPromise: Promise<AuthSessionData | null> | null = null;

function bootstrapSession(): Promise<AuthSessionData | null> {
  bootstrapPromise ??= refreshSession();
  return bootstrapPromise;
}

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-50"
    >
      <div className="relative">
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl bg-brand-400/40 blur-xl"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.15, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={springSnappy}
          className="relative flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25"
        >
          <ChefHat className="size-7" aria-hidden="true" />
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="flex items-center gap-2 text-sm text-stone-500"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>Preparing your session…</span>
      </motion.div>
    </motion.div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const setStatus = useAuthStore((state) => state.setStatus);
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const previousStatus = useRef(status);

  useEffect(() => {
    let cancelled = false;

    setStatus("loading");

    void bootstrapSession().then((session) => {
      if (cancelled) {
        return;
      }

      if (session) {
        setStatus("authenticated");
      } else {
        clearSession();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [clearSession, setStatus]);

  useEffect(() => {
    if (
      status === "unauthenticated" &&
      previousStatus.current === "authenticated"
    ) {
      queryClient.clear();
    }

    previousStatus.current = status;
  }, [queryClient, status]);

  if (status === "idle" || status === "loading") {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
