"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/components/i18n-provider";

// Client Component: it needs state (the textarea, the "sent!" message)
// and a mutation, so it can't be a Server Component. The profile page
// (a Server Component) renders it and passes the company id as a prop.

export function QuoteRequestForm({ companyId }: { companyId: number }) {
  const { dict } = useI18n();
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
      <p className="success-text">
        {dict.quoteForm.sent}{" "}
        <Link href="/requests" className="link">
          {dict.quoteForm.myRequestsLink}
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
        placeholder={dict.quoteForm.placeholder}
        required
        minLength={10}
        maxLength={2000}
        rows={5}
        className="input"
      />

      {createRequest.error && (
        <p className="error-text">{createRequest.error.message}</p>
      )}

      <button
        type="submit"
        disabled={createRequest.isPending}
        className="btn btn-primary w-full"
      >
        {createRequest.isPending ? dict.quoteForm.sending : dict.quoteForm.send}
      </button>
    </form>
  );
}
