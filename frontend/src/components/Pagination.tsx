import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PaginationMeta } from "@/lib/api";
import { EASE_OUT } from "@/lib/motion";

import { Button } from "./ui";

export function Pagination({
  pagination,
  onPageChange,
  isFetching = false,
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}) {
  if (pagination.total === 0) {
    return null;
  }

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  const totalPages = Math.max(pagination.totalPages, 1);

  return (
    <div className="flex flex-col gap-3 border-t border-stone-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-stone-500">
        Showing <span className="font-semibold text-stone-700">{start}</span>–
        <span className="font-semibold text-stone-700">{end}</span> of{" "}
        <span className="font-semibold text-stone-700">
          {pagination.total}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!pagination.hasPreviousPage || isFetching}
          onClick={() => onPageChange(pagination.page - 1)}
          leftIcon={<ChevronLeft className="size-4" aria-hidden="true" />}
        >
          Previous
        </Button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={pagination.page}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="px-1 text-xs font-medium text-stone-500"
          >
            Page {pagination.page} of {totalPages}
          </motion.span>
        </AnimatePresence>
        <Button
          variant="secondary"
          size="sm"
          disabled={!pagination.hasNextPage || isFetching}
          onClick={() => onPageChange(pagination.page + 1)}
          rightIcon={<ChevronRight className="size-4" aria-hidden="true" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
