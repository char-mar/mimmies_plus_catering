import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";
import { EASE_OUT } from "@/lib/motion";

const sizeStyles = {
  sm: "w-[min(92vw,24rem)]",
  md: "w-[min(92vw,32rem)]",
  lg: "w-[min(94vw,44rem)]",
  xl: "w-[min(96vw,58rem)]",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof sizeStyles;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);

    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 shadow-2xl backdrop:bg-stone-950/30 backdrop:backdrop-blur-sm",
        sizeStyles[size],
      )}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={false}
        animate={
          open
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 12, scale: 0.98 }
        }
        transition={{ duration: 0.22, ease: EASE_OUT }}
        className="flex max-h-[calc(100dvh-2rem)] flex-col"
      >
        <header className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div className="space-y-1">
            <h2 id={titleId} className="text-base font-semibold text-stone-900">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="text-sm leading-relaxed text-stone-500"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>

        {footer ? (
          <footer className="border-t border-stone-200 bg-stone-50/60 px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </motion.div>
    </dialog>
  );
}
