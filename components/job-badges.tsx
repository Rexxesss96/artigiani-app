"use client";

import { useI18n } from "@/components/i18n-provider";
import { categoryName } from "@/lib/i18n/dictionaries";

// Small labels describing a job at a glance: trade, urgency, size,
// budget. "Urgent" is red so companies notice it immediately.

type Job = {
  urgency: "urgent" | "week" | "flexible";
  size: "small" | "large";
  budget: "under_200" | "200_1000" | "1000_5000" | "over_5000" | "unknown";
  category: { slug: string; name: string };
};

export function JobBadges({ job }: { job: Job }) {
  const { dict } = useI18n();
  const j = dict.jobs;

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="chip">{categoryName(dict, job.category)}</span>
      <span
        className={`chip ${
          job.urgency === "urgent"
            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
            : ""
        }`}
      >
        {job.urgency === "urgent" && "⚡ "}
        {j[`urgency_${job.urgency}`]}
      </span>
      <span className="chip">{j[`size_${job.size}`]}</span>
      {job.budget !== "unknown" && (
        <span className="chip">{j[`budget_${job.budget}`]}</span>
      )}
    </div>
  );
}

// "Collecting quotes" / "Company chosen" / ... with a matching color.
export function JobStatusBadge({
  status,
}: {
  status: "open" | "assigned" | "completed" | "cancelled";
}) {
  const { dict } = useI18n();
  const styles = {
    open: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    assigned: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    cancelled:
      "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {dict.jobs[`status_${status}`]}
    </span>
  );
}
