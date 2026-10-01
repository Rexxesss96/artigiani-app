"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/components/i18n-provider";

// Side menu of the company dashboard. On phones it becomes a row of
// tabs above the content (flex-row), on wider screens a column.

const ICONS = {
  overview: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  requests: "M4 4h16v12H5.5L4 17.5zM8 8h8M8 12h5",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  reviews:
    "m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z",
};

export function CompanySidebar() {
  const pathname = usePathname();
  const { dict } = useI18n();
  const d = dict.dashboard;
  const { data: pending } = trpc.quoteRequests.pendingCount.useQuery();

  const items = [
    { href: "/company", label: d.navOverview, icon: ICONS.overview },
    {
      href: "/company/requests",
      label: d.navRequests,
      icon: ICONS.requests,
      badge: pending,
    },
    { href: "/company/profile", label: d.navProfile, icon: ICONS.profile },
    { href: "/company/reviews", label: d.navReviews, icon: ICONS.reviews },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-accent-soft text-accent-soft-foreground"
                : "text-muted hover:bg-card hover:text-foreground"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="size-5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={item.icon} />
            </svg>
            <span className="flex-1">{item.label}</span>
            {!!item.badge && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
