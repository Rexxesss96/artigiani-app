"use client";

import { useI18n } from "@/components/i18n-provider";
import { dateLocales } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/money";

// The company's answer to a request (amount + message), shown both to
// the customer ("Reply from the company") and to the company itself.

export function QuoteResponse({
  request,
  viewer,
}: {
  request: {
    quoteAmountCents: number | null;
    responseMessage: string | null;
    respondedAt: Date | string | null;
  };
  viewer: "customer" | "company";
}) {
  const { dict, locale } = useI18n();

  if (!request.respondedAt) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-background p-3 text-sm">
      <p className="text-xs text-muted">
        {viewer === "customer"
          ? dict.response.companyReply
          : dict.response.yourReply}{" "}
        ·{" "}
        {new Date(request.respondedAt).toLocaleDateString(dateLocales[locale])}
      </p>
      {request.quoteAmountCents !== null && (
        <p className="mt-1 text-base font-semibold">
          {format(dict.response.quote, {
            amount: formatMoney(request.quoteAmountCents, locale),
          })}
        </p>
      )}
      {request.responseMessage && (
        <p className="mt-1 whitespace-pre-line">{request.responseMessage}</p>
      )}
    </div>
  );
}
