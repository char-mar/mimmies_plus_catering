import { useId, useState } from "react";
import type {
  InputHTMLAttributes,
  MouseEventHandler,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  Eye,
  EyeOff,
  Info,
  Loader2,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { EASE_OUT, springSnappy } from "@/lib/motion";

const MotionLink = motion.create(Link);

const buttonBase =
  "inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariants = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 focus-visible:outline-brand-600",
  secondary:
    "bg-white text-stone-700 ring-1 ring-inset ring-stone-200 hover:bg-stone-50 focus-visible:outline-stone-400",
  ghost:
    "text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-stone-400",
  danger:
    "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 focus-visible:outline-red-600",
} as const;

const buttonSizes = {
  sm: "h-9 gap-1.5 px-3 text-xs",
  md: "h-11 gap-2 px-4 text-sm",
} as const;

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const interactive = !disabled && !loading;

  return (
    <motion.button
      type={type}
      disabled={!interactive}
      aria-busy={loading}
      whileHover={interactive ? { y: -1 } : undefined}
      whileTap={interactive ? { scale: 0.97 } : undefined}
      transition={springSnappy}
      className={cn(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </motion.button>
  );
}

interface LinkButtonProps {
  to: string;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
}

export function LinkButton({
  to,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  onClick,
  children,
}: LinkButtonProps) {
  return (
    <MotionLink
      to={to}
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      className={cn(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </MotionLink>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightSlot,
  id,
  className,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-stone-700"
      >
        {label}
      </label>
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-stone-50",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border-stone-200 focus:border-brand-500 focus:ring-brand-100",
            leftIcon ? "pl-10" : undefined,
            rightSlot ? "pr-11" : undefined,
            className,
          )}
          {...props}
        />
        {rightSlot ? (
          <span className="absolute inset-y-0 right-2 flex items-center">
            {rightSlot}
          </span>
        ) : null}
      </div>
      {error ? (
        <motion.p
          key="error"
          id={`${inputId}-error`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="text-xs font-medium text-red-600"
        >
          {error}
        </motion.p>
      ) : hint ? (
        <motion.p
          key="hint"
          id={`${inputId}-hint`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="text-xs text-stone-500"
        >
          {hint}
        </motion.p>
      ) : null}
    </div>
  );
}

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const describedBy = error
    ? `${textareaId}-error`
    : hint
      ? `${textareaId}-hint`
      : undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={textareaId}
        className="block text-sm font-medium text-stone-700"
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-stone-50",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
            : "border-stone-200 focus:border-brand-500 focus:ring-brand-100",
          className,
        )}
        {...props}
      />
      {error ? (
        <motion.p
          key="error"
          id={`${textareaId}-error`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="text-xs font-medium text-red-600"
        >
          {error}
        </motion.p>
      ) : hint ? (
        <motion.p
          key="hint"
          id={`${textareaId}-hint`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="text-xs text-stone-500"
        >
          {hint}
        </motion.p>
      ) : null}
    </div>
  );
}

type PasswordInputProps = Omit<InputProps, "type" | "rightSlot">;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="flex size-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
}

export function Select({ label, hint, id, className, children, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-stone-700"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={cn(
          "h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-stone-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200/80 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

type AlertTone = "error" | "success" | "info" | "warning";

const alertStyles: Record<AlertTone, { wrap: string; icon: ReactNode }> = {
  error: {
    wrap: "border-red-200 bg-red-50 text-red-800",
    icon: <AlertCircle className="size-4 shrink-0" aria-hidden="true" />,
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />,
  },
  info: {
    wrap: "border-sky-200 bg-sky-50 text-sky-800",
    icon: <Info className="size-4 shrink-0" aria-hidden="true" />,
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-900",
    icon: <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      role={tone === "error" ? "alert" : "status"}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className={cn(
        "flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        alertStyles[tone].wrap,
        className,
      )}
    >
      <span className="pt-0.5">{alertStyles[tone].icon}</span>
      <div className="space-y-0.5">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-sm opacity-90">{children}</div> : null}
      </div>
    </motion.div>
  );
}

export type BadgeTone = "brand" | "green" | "red" | "stone" | "blue" | "amber";

const badgeStyles: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  stone: "bg-stone-100 text-stone-600 ring-stone-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function Badge({
  tone = "stone",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        badgeStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("size-5 animate-spin text-stone-400", className)}
      aria-hidden="true"
    />
  );
}

export function Logo({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          inverted
            ? "bg-white/10 text-white ring-1 ring-inset ring-white/20"
            : "bg-brand-600 text-white shadow-sm shadow-brand-600/30",
        )}
      >
        <ChefHat className="size-5" aria-hidden="true" />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "text-sm font-semibold tracking-tight",
              inverted ? "text-white" : "text-stone-900",
            )}
          >
            Mimmies Plus
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.2em]",
              inverted ? "text-white/[0.55]" : "text-stone-500",
            )}
          >
            Catering
          </span>
        </span>
      ) : null}
    </div>
  );
}

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800 ring-1 ring-inset ring-brand-200",
        className,
      )}
      aria-hidden="true"
    >
      {initials(name) || "?"}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-stone-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="flex flex-col items-center gap-3 px-6 py-14 text-center"
    >
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...springSnappy, delay: 0.08 }}
        className="flex size-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500"
      >
        {icon}
      </motion.span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-stone-900">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-stone-500">{description}</p>
        ) : null}
      </div>
      {action}
    </motion.div>
  );
}
