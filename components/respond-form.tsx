"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { parseMoneyToCents } from "@/lib/money";

// Inside a pending request in the company dashboard: the company writes
// an amount and a message, then accepts (sending the quote) or rejects.

type Response = {
  id: number;
  status: "accepted" | "rejected";
  quoteAmountCents?: number;
  responseMessage?: string;
};

export function RespondForm({
  requestId,
  isPending,
  onRespond,
}: {
  requestId: number;
  isPending: boolean;
  onRespond: (response: Response) => void;
}) {
  const { dict } = useI18n();
  const d = dict.dashboard;
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [amountError, setAmountError] = useState(false);

  function accept() {
    const cents = parseMoneyToCents(amount);
    if (cents === null) {
      setAmountError(true);
      return;
    }
    setAmountError(false);
    onRespond({
      id: requestId,
      status: "accepted",
      quoteAmountCents: cents,
      responseMessage: message || undefined,
    });
  }

  function reject() {
    onRespond({
      id: requestId,
      status: "rejected",
      responseMessage: message || undefined,
    });
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <label className="block max-w-xs">
        <span className="label">{d.amountLabel}</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={d.amountPlaceholder}
          aria-invalid={amountError}
          className="input"
        />
      </label>
      {amountError && <p className="error-text">{d.invalidAmount}</p>}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={d.responsePlaceholder}
        maxLength={2000}
        rows={3}
        className="input"
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={accept}
          disabled={isPending}
          className="btn bg-green-700 text-white hover:bg-green-800"
        >
          {d.acceptWithQuote}
        </button>
        <button
          onClick={reject}
          disabled={isPending}
          className="btn btn-secondary text-red-700 dark:text-red-400"
        >
          {d.reject}
        </button>
      </div>
    </div>
  );
}
