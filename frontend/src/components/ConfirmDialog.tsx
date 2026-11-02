import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion } from "motion/react";

import { EASE_OUT } from "@/lib/motion";

import { Button } from "./ui";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  loading = false,
  children,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

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
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-stone-200 bg-white p-0 shadow-2xl backdrop:bg-stone-950/30 backdrop:backdrop-blur-sm"
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
            : { opacity: 0, y: 12, scale: 0.97 }
        }
        transition={{ duration: 0.22, ease: EASE_OUT }}
        className="space-y-4 p-6"
      >
        <div className="space-y-1.5">
          <h2
            id={titleId}
            className="text-base font-semibold text-stone-900"
          >
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-stone-500">
            {description}
          </p>
        </div>
        {children ? <div>{children}</div> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </dialog>
  );
}
