"use client";

import { useI18n } from "@/components/i18n-provider";

// Small colored label for a quote request's status.
// A Record maps every possible status to its classes: if a new status
// is ever added to the enum, TypeScript will complain here until we
// give it a color too.

const STATUS_STYLES: Record<"pending" | "accepted" | "rejected", string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function StatusBadge({
  status,
}: {
  status: keyof typeof STATUS_STYLES;
}) {
  const { dict } = useI18n();
  return (
    <span
      className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {dict.status[status]}
    </span>
  );
}
