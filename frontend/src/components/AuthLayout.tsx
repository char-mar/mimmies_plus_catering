import { motion } from "motion/react";
import { Outlet, useLocation } from "react-router-dom";
import { BadgeCheck, KeyRound, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/ui";
import {
  EASE_OUT,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";

const highlights = [
  {
    icon: ShieldCheck,
    title: "Role-aware access",
    description:
      "Customers, admins and super admins each see exactly what they should.",
  },
  {
    icon: KeyRound,
    title: "Secure by default",
    description:
      "Short-lived access tokens with rotating, httpOnly refresh sessions.",
  },
  {
    icon: BadgeCheck,
    title: "Verified accounts",
    description:
      "Email verification, password resets and instant session revocation.",
  },
];

export function AuthLayout() {
  const year = new Date().getFullYear();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-stone-50 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-stone-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/3 size-96 rounded-full bg-brand-600/25 blur-3xl"
          animate={{ x: [0, 14, 0], y: [0, -18, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-amber-500/10 blur-3xl"
          animate={{ x: [0, -12, 0], y: [0, 16, 0] }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />

        <motion.div
          className="relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <Logo inverted />
        </motion.div>

        <motion.div
          className="relative max-w-md space-y-9"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={staggerItem} className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              Kitchen &amp; delivery operations
            </span>
            <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight">
              Run the whole catering day from one calm place.
            </h1>
            <p className="text-sm leading-relaxed text-white/[0.55]">
              Sign in to manage menu items, keep orders moving, and give every
              customer a reliable delivery experience.
            </p>
          </motion.div>

          <motion.ul variants={staggerContainer} className="space-y-5">
            {highlights.map(({ icon: Icon, title, description }) => (
              <motion.li
                key={title}
                variants={staggerItem}
                className="flex gap-3.5"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-brand-300 ring-1 ring-inset ring-white/10">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm leading-relaxed text-white/50">
                    {description}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.p
          className="relative text-xs text-white/[0.35]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          © {year} Mimmies Plus Catering
        </motion.p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            <Outlet />
          </motion.div>
          <p className="mt-10 text-center text-xs text-stone-400 lg:hidden">
            © {year} Mimmies Plus Catering
          </p>
        </div>
      </main>
    </div>
  );
}
