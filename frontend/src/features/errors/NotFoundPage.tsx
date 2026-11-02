import { motion } from "motion/react";
import { UtensilsCrossed } from "lucide-react";

import { FadeIn } from "@/components/motion";
import { LinkButton, Logo } from "@/components/ui";
import { springSnappy } from "@/lib/motion";

export function NotFoundPage() {
  return (
    <FadeIn className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 py-12 text-center">
      <Logo />
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...springSnappy, delay: 0.1 }}
        className="mt-12 flex size-16 items-center justify-center rounded-2xl bg-stone-200/70 text-stone-600"
      >
        <UtensilsCrossed className="size-8" aria-hidden="true" />
      </motion.span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
        This page is off the menu
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
        The page you are looking for may have moved, or the link may be
        incomplete.
      </p>
      <div className="mt-6">
        <LinkButton to="/">Back to dashboard</LinkButton>
      </div>
    </FadeIn>
  );
}
