import { useEffect, useId, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  ReceiptText,
  ShieldCheck,
  Tags,
  UserRound,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { useMe, useLogout, useResendVerification } from "@/features/auth/hooks";
import { useAuthStore } from "@/features/auth/store";
import { CartButton, CartDrawer } from "@/features/cart/CartDrawer";
import { cn } from "@/lib/cn";
import { EASE_OUT, springDrawer, springSnappy } from "@/lib/motion";
import { hasRequiredRole, ROLE_LABELS, ROLE_TONES } from "@/lib/roles";

import { Avatar, Badge, Button, Logo } from "./ui";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  label: string;
  to: string;
  icon: IconType;
  end?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

function buildNavigation(role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER"): NavSection[] {
  const sections: NavSection[] = [
    {
      label: "Workspace",
      items: [
        {
          label: "Browse menu",
          to: "/",
          icon: UtensilsCrossed,
          end: true,
        },
        { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
        { label: "Orders", to: "/orders", icon: ReceiptText },
        { label: "Profile", to: "/profile", icon: UserRound },
      ],
    },
  ];

  if (hasRequiredRole(role, ["ADMIN"])) {
    sections.push({
      label: "Administration",
      items: [
        { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
        { label: "Order management", to: "/admin/orders", icon: ClipboardList },
        { label: "Payments", to: "/admin/payments", icon: CreditCard },
        { label: "Contacts", to: "/admin/contacts", icon: MessageSquare },
        { label: "Menu", to: "/admin/menu", icon: ChefHat },
        { label: "Categories", to: "/admin/categories", icon: Tags },
        { label: "Users", to: "/admin/users", icon: Users },
      ],
    });
  }

  return sections;
}

function SidebarNavigation({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const activeIndicatorId = useId();

  if (!user) {
    return null;
  }

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {buildNavigation(user.role).map((section) => (
        <div key={section.label} className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
            {section.label}
          </p>
          {section.items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-brand-800"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <motion.span
                        layoutId={`nav-active-${activeIndicatorId}`}
                        className="absolute inset-0 rounded-xl bg-brand-50 ring-1 ring-inset ring-brand-100"
                        transition={springSnappy}
                      />
                    ) : null}
                    <Icon className="relative size-4" aria-hidden="true" />
                    <span className="relative">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ onSignOut, signingOut }: { onSignOut: () => void; signingOut: boolean }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <div className="border-t border-stone-200 p-3">
      <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
        <Avatar name={user.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-900">
            {user.name}
          </p>
          <p className="truncate text-xs text-stone-500">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          onClick={onSignOut}
          loading={signingOut}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const resendVerification = useResendVerification();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Revalidates the session on mount and when the window regains focus, so a
  // role or status change made by an admin applies without a reload.
  useMe();

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  if (!user) {
    return null;
  }

  const signOut = () => logout.mutate();

  return (
    <div className="min-h-screen bg-stone-50 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-stone-200 px-5">
          <Logo />
        </div>
        <SidebarNavigation />
        <SidebarFooter onSignOut={signOut} signingOut={logout.isPending} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            <div
              className="absolute inset-0 bg-stone-950/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={springDrawer}
            >
              <div className="flex h-16 items-center justify-between border-b border-stone-200 px-4">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex size-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                  aria-label="Close navigation"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <SidebarNavigation onNavigate={() => setMobileOpen(false)} />
              <SidebarFooter onSignOut={signOut} signingOut={logout.isPending} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-stone-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            aria-label="Open navigation"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <Logo compact />
          <div className="flex items-center gap-2">
            <CartButton />
            <Avatar name={user.name} />
          </div>
        </header>

        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between gap-4 border-b border-stone-200 bg-white/80 px-8 backdrop-blur lg:flex">
          <p className="truncate text-sm text-stone-500">
            Signed in as{" "}
            <span className="font-semibold text-stone-800">{user.email}</span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <CartButton />
            <Badge tone={ROLE_TONES[user.role]}>
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {ROLE_LABELS[user.role]}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={signOut}
              loading={logout.isPending}
              leftIcon={<LogOut className="size-4" aria-hidden="true" />}
            >
              Sign out
            </Button>
          </div>
        </header>

        <AnimatePresence initial={false}>
          {!user.isEmailVerified ? (
            <motion.div
              key="verify-banner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 lg:px-8">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-amber-900">
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  <span className="font-semibold">Verify your email</span>
                  <span className="text-amber-800/80">
                    We sent a verification link to {user.email}.
                  </span>
                  <button
                    type="button"
                    onClick={() => resendVerification.mutate()}
                    disabled={resendVerification.isPending}
                    className="font-semibold text-amber-900 underline decoration-amber-400 underline-offset-2 transition-colors hover:text-amber-950 disabled:opacity-60"
                  >
                    {resendVerification.isPending ? "Sending…" : "Resend link"}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-5xl">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>

      <CartDrawer />
    </div>
  );
}
