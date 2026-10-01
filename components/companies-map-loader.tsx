"use client";

import dynamic from "next/dynamic";
import type { MapCompany } from "@/components/companies-map";

// next/dynamic with ssr: false = "load this component only in the
// browser". Leaflet touches `window` as soon as it's imported, which
// would crash on the server. (ssr: false is allowed only inside a
// Client Component, which is why this small wrapper exists.)
const CompaniesMap = dynamic(() => import("@/components/companies-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] w-full animate-pulse rounded-2xl border border-border bg-card" />
  ),
});

export function CompaniesMapLoader(props: {
  companies: MapCompany[];
  profileLabel: string;
}) {
  return <CompaniesMap {...props} />;
}
