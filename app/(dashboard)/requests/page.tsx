"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";

// "My requests": the quote requests the logged-in user has sent.

export default function MyRequestsPage() {
  const { data: session, isPending: sessionPending } = useSession();

  const { data: requests, isPending: requestsPending } =
    trpc.quoteRequests.listSent.useQuery(undefined, {
      enabled: !!session,
    });

  if (sessionPending) {
    return <p className="p-8">Loading...</p>;
  }

  if (!session) {
    return (
      <main className="p-8">
        <p>You need to be logged in to see your requests.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">My requests</h1>

      {requestsPending && <p className="mt-4">Loading...</p>}

      {requests?.length === 0 && (
        <p className="mt-4 text-gray-600">
          You haven&apos;t sent any requests yet.{" "}
          <Link href="/" className="underline">
            Find a company
          </Link>
          .
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-4">
        {requests?.map((request) => (
          <li key={request.id} className="rounded border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <Link
                href={`/companies/${request.company.id}`}
                className="font-semibold underline"
              >
                {request.company.businessName}
              </Link>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(request.createdAt).toLocaleDateString()} ·{" "}
              {request.company.city}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm">
              {request.message}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
