import { motion } from "motion/react";
import { ShieldAlert } from "lucide-react";

import { FadeIn } from "@/components/motion";
import { LinkButton, Logo } from "@/components/ui";
import { useAuthStore } from "@/features/auth/store";
import { springSnappy } from "@/lib/motion";

export function ForbiddenPage() {
  const authenticated = useAuthStore((state) => state.status === "authenticated");

  return (
    <FadeIn className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 py-12 text-center">
      <Logo />
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...springSnappy, delay: 0.1 }}
        className="mt-12 flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"
      >
        <ShieldAlert className="size-8" aria-hidden="true" />
      </motion.span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-stone-900">
        Access denied
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
        Your account does not have permission to view this page. If you believe
        this is a mistake, ask a super admin to review your role.
      </p>
      <div className="mt-6">
        <LinkButton to={authenticated ? "/dashboard" : "/"}>
          Back to {authenticated ? "dashboard" : "menu"}
        </LinkButton>
      </div>
    </FadeIn>
  );
}
