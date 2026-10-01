"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";
import { useI18n } from "@/components/i18n-provider";
import { dateLocales } from "@/lib/i18n/config";
import { QuoteResponse } from "@/components/quote-response";

// "My requests": the quote requests the logged-in user has sent.

export default function MyRequestsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const { dict, locale } = useI18n();

  const { data: requests, isPending: requestsPending } =
    trpc.quoteRequests.listSent.useQuery(undefined, {
      enabled: !!session,
    });

  if (sessionPending) {
    return <p className="container-page text-muted">{dict.common.loading}</p>;
  }

  if (!session) {
    return (
      <main className="container-page">
        <p className="card">
          {dict.requestsPage.loginRequired}{" "}
          <Link href="/login" className="link">
            {dict.nav.login}
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container-page max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">
        {dict.requestsPage.title}
      </h1>
      <p className="mt-1 text-muted">{dict.requestsPage.subtitle}</p>

      {requestsPending && (
        <p className="mt-6 text-muted">{dict.common.loading}</p>
      )}

      {requests?.length === 0 && (
        <p className="card mt-6">
          {dict.requestsPage.empty}{" "}
          <Link href="/" className="link">
            {dict.requestsPage.findCompany}
          </Link>
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-4">
        {requests?.map((request) => (
          <li key={request.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/companies/${request.company.id}`}
                  className="font-semibold hover:text-accent"
                >
                  {request.company.businessName}
                </Link>
                <p className="text-xs text-muted">
                  {request.company.city} ·{" "}
                  {new Date(request.createdAt).toLocaleDateString(
                    dateLocales[locale],
                  )}
                </p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">
              {request.message}
            </p>
            <QuoteResponse request={request} viewer="customer" />
          </li>
        ))}
      </ul>
    </main>
  );
}
