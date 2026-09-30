"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

// Client Component: it needs state (the textarea, the "sent!" message)
// and a mutation, so it can't be a Server Component. The profile page
// (a Server Component) renders it and passes the company id as a prop.

export function QuoteRequestForm({ companyId }: { companyId: number }) {
  const [message, setMessage] = useState("");
  const utils = trpc.useUtils();

  const createRequest = trpc.quoteRequests.create.useMutation({
    onSuccess: () => {
      setMessage("");
      // The "My requests" page caches listSent: mark it stale so it
      // shows the new request next time it's opened.
      utils.quoteRequests.listSent.invalidate();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createRequest.mutate({ companyId, message });
  }

  if (createRequest.isSuccess) {
    return (
      <p className="text-sm text-green-700">
        Request sent! You can follow it in{" "}
        <Link href="/requests" className="underline">
          My requests
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe the job: what you need, where, and when."
        required
        minLength={10}
        maxLength={2000}
        rows={4}
        className="w-full rounded border border-gray-300 px-3 py-2"
      />

      {createRequest.error && (
        <p className="text-sm text-red-600">{createRequest.error.message}</p>
      )}

      <button
        type="submit"
        disabled={createRequest.isPending}
        className="cursor-pointer rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {createRequest.isPending ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}
