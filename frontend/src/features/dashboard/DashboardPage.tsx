import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Mail,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  Card,
  LinkButton,
} from "@/components/ui";
import { useResendVerification } from "@/features/auth/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { UserRole } from "@/features/auth/types";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  EASE_OUT,
  springSnappy,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";
import {
  hasRequiredRole,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_TONES,
} from "@/lib/roles";

const CAPABILITIES: Record<UserRole, string[]> = {
  CUSTOMER: [
    "Place orders and follow every delivery",
    "Update your profile and password",
    "Verify your email for secure account recovery",
  ],
  ADMIN: [
    "Manage the menu and categories",
    "Move orders through fulfilment",
    "Activate or deactivate customer accounts",
  ],
  SUPER_ADMIN: [
    "Everything admins can do",
    "Change roles across the team",
    "Manage every account, including admins",
  ],
};

function greeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const resendVerification = useResendVerification();

  if (!user) {
    return null;
  }

  const firstName = user.name.split(" ")[0];
  const canManageUsers = hasRequiredRole(user.role, ["ADMIN"]);

  const stats = [
    {
      icon: ShieldCheck,
      label: "Access level",
      value: ROLE_LABELS[user.role],
      iconClass: "bg-brand-50 text-brand-700",
    },
    {
      icon: BadgeCheck,
      label: "Account",
      value: user.isActive ? "Active" : "Disabled",
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: Mail,
      label: "Email",
      value: user.isEmailVerified ? "Verified" : "Unverified",
      iconClass: "bg-sky-50 text-sky-700",
    },
    {
      icon: UserRound,
      label: "Member since",
      value: formatDate(user.createdAt),
      iconClass: "bg-stone-100 text-stone-600",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative overflow-hidden rounded-3xl bg-stone-950 px-6 py-7 text-white shadow-sm sm:px-8"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand-600/25 blur-3xl"
          animate={{ x: [0, -14, 0], y: [0, 16, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-amber-500/10 blur-3xl"
          animate={{ x: [0, 12, 0], y: [0, -12, 0] }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={staggerItem} className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">
              {ROLE_LABELS[user.role]} workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting()}, {firstName}.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/[0.55]">
              Here is a quick view of your access level and account health.
            </p>
          </motion.div>
          <motion.div variants={staggerItem} className="flex flex-wrap gap-2">
            <LinkButton
              to="/profile"
              variant="secondary"
              size="sm"
              leftIcon={<UserRound className="size-4" aria-hidden="true" />}
            >
              Profile
            </LinkButton>
            {canManageUsers ? (
              <LinkButton
                to="/admin/users"
                size="sm"
                rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
              >
                Manage users
              </LinkButton>
            ) : null}
          </motion.div>
        </motion.div>
      </motion.div>

      {!user.isEmailVerified ? (
        <Alert tone="warning" title="Your email is not verified yet">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              We sent a link to {user.email}. Verify it to secure account
              recovery.
            </span>
            <button
              type="button"
              onClick={() => resendVerification.mutate()}
              disabled={resendVerification.isPending}
              className="font-semibold underline decoration-amber-400 underline-offset-2 hover:text-amber-950 disabled:opacity-60"
            >
              {resendVerification.isPending ? "Sending…" : "Resend link"}
            </button>
          </div>
        </Alert>
      ) : null}

      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {stats.map(({ icon: Icon, label, value, iconClass }) => (
          <motion.div
            key={label}
            variants={staggerItem}
            whileHover={{ y: -3 }}
            transition={springSnappy}
          >
            <Card className="h-full p-5">
              <span
                className={`flex size-9 items-center justify-center rounded-xl ${iconClass}`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold text-stone-900">
                {value}
              </p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={staggerItem} whileHover={{ y: -2 }} transition={springSnappy}>
          <Card className="h-full p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-stone-900">
                  What you can do
                </h2>
                <p className="text-sm leading-relaxed text-stone-500">
                  {ROLE_DESCRIPTIONS[user.role]}
                </p>
              </div>
              <Badge tone={ROLE_TONES[user.role]}>
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>

            <motion.ul
              className="mt-5 space-y-2.5"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {CAPABILITIES[user.role].map((capability) => (
                <motion.li
                  key={capability}
                  variants={staggerItem}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span className="text-stone-700">{capability}</span>
                </motion.li>
              ))}
            </motion.ul>

            {canManageUsers ? (
              <div className="mt-6 border-t border-stone-100 pt-4">
                <LinkButton
                  to="/admin/users"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Users className="size-4" aria-hidden="true" />}
                  rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
                >
                  Open user management
                </LinkButton>
              </div>
            ) : null}
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} whileHover={{ y: -2 }} transition={springSnappy}>
          <Card className="h-full p-6">
            <h2 className="text-base font-semibold text-stone-900">
              Account checklist
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-500">
              Keep these in good shape to stay secure and reachable.
            </p>

            <motion.ul
              className="mt-5 space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <ChecklistRow
                done={user.isEmailVerified}
                title="Email verified"
                description={
                  user.isEmailVerified
                    ? "Your address is confirmed."
                    : "Verify your address to enable account recovery."
                }
                action={
                  !user.isEmailVerified ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={resendVerification.isPending}
                      onClick={() => resendVerification.mutate()}
                    >
                      Resend
                    </Button>
                  ) : null
                }
              />
              <ChecklistRow
                done={user.isActive}
                title="Account active"
                description={
                  user.isActive
                    ? "Your account can sign in and place orders."
                    : "Contact a super admin to restore access."
                }
              />
              <ChecklistRow
                done
                title="Role assigned"
                description={`${ROLE_LABELS[user.role]} · ${ROLE_DESCRIPTIONS[user.role]}`}
              />
            </motion.ul>

            <div className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                  Last sign-in
                </p>
                <p className="truncate text-sm font-medium text-stone-700">
                  {formatDateTime(user.lastLogin)}
                </p>
              </div>
              <LinkButton to="/profile" variant="ghost" size="sm">
                Review profile
              </LinkButton>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ChecklistRow({
  done,
  title,
  description,
  action,
}: {
  done: boolean;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <motion.li variants={staggerItem} className="flex items-start gap-3">
      <span
        className={
          done
            ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
            : "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
        }
      >
        {done ? (
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
        ) : (
          <span className="size-1.5 rounded-full bg-current" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-800">{title}</p>
        <p className="text-xs leading-relaxed text-stone-500">{description}</p>
      </div>
      {action}
    </motion.li>
  );
}
