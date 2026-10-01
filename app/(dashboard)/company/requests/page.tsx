"use client";

import { useState } from "react";
import { ReceivedRequests } from "@/components/received-requests";
import { RequireCompany } from "@/components/require-company";
import { useI18n } from "@/components/i18n-provider";

type Filter = "all" | "pending" | "quoted" | "accepted";

// /company/requests: requests received, with tabs to filter by status.

export default function CompanyRequestsPage() {
  const { dict } = useI18n();
  const [filter, setFilter] = useState<Filter>("pending");

  const tabs: { value: Filter; label: string }[] = [
    { value: "pending", label: dict.status.pending },
    { value: "quoted", label: dict.status.quoted },
    { value: "accepted", label: dict.status.accepted },
    { value: "all", label: dict.dashboard.filterAll },
  ];

  return (
    <RequireCompany>
      {() => (
        <main>
          <h1 className="text-2xl font-bold tracking-tight">
            {dict.dashboard.quoteRequests}
          </h1>

          <div className="mt-4 mb-6 flex flex-wrap gap-2" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={filter === tab.value}
                onClick={() => setFilter(tab.value)}
                className={`btn py-1.5 ${
                  filter === tab.value
                    ? "bg-foreground text-background"
                    : "btn-secondary"
                }`}
              >
                {/* Capital first letter only: "In attesa", not "In Attesa" */}
                <span className="inline-block first-letter:uppercase">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          <ReceivedRequests status={filter === "all" ? undefined : filter} />
        </main>
      )}
    </RequireCompany>
  );
}
