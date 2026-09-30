"use client";

import { useI18n } from "@/components/i18n-provider";

// Small colored label for a quote request's status.
// A Record maps every possible status to its classes: if a new status
// is ever added to the enum, TypeScript will complain here until we
// give it a color too.

const STATUS_STYLES: Record<"pending" | "accepted" | "rejected", string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function StatusBadge({
  status,
}: {
  status: keyof typeof STATUS_STYLES;
}) {
  const { dict } = useI18n();
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {dict.status[status]}
    </span>
  );
}
