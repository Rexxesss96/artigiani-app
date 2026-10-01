"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/components/i18n-provider";
import { dateLocales } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/dictionaries";

// The conversation between the customer and one company about a job,
// shown (folded) inside a quote card. The company can also propose a
// site visit, which the customer confirms or declines.

export function RequestThread({
  requestId,
  viewer,
  closed = false,
  unread = 0,
}: {
  requestId: number;
  viewer: "customer" | "company";
  // A cancelled request can be read but not written to anymore.
  closed?: boolean;
  // Messages not read yet, shown on the button while folded.
  unread?: number;
}) {
  const { dict, locale } = useI18n();
  const c = dict.chat;
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [proposing, setProposing] = useState(false);
  const [visitAt, setVisitAt] = useState("");
  const [visitNote, setVisitNote] = useState("");

  const { data: messages } = trpc.messages.list.useQuery(
    { requestId },
    // Only while open; check for new messages every 10 seconds.
    { enabled: open, refetchInterval: 10_000 },
  );

  // Reading the messages marks them as read on the server: refresh the
  // badges (navbar, job list) when new messages have been loaded.
  const lastMessageId = messages?.at(-1)?.id;
  useEffect(() => {
    if (lastMessageId !== undefined) {
      utils.notifications.invalidate();
      utils.jobs.listMine.invalidate();
      utils.quoteRequests.listReceived.invalidate();
    }
  }, [lastMessageId, utils]);

  // After any change: reload the conversation and the unread badges.
  const refresh = () =>
    Promise.all([
      utils.messages.list.invalidate({ requestId }),
      utils.notifications.invalidate(),
    ]);
  const send = trpc.messages.send.useMutation({
    onSuccess: () => {
      setText("");
      return refresh();
    },
  });
  const proposeVisit = trpc.messages.proposeVisit.useMutation({
    onSuccess: () => {
      setProposing(false);
      setVisitAt("");
      setVisitNote("");
      return refresh();
    },
  });
  const answerVisit = trpc.messages.answerVisit.useMutation({
    onSuccess: refresh,
  });
  const error = send.error ?? proposeVisit.error ?? answerVisit.error;

  const formatDateTime = (date: Date | string) =>
    new Date(date).toLocaleString(dateLocales[locale], {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-secondary mt-3 py-1.5"
      >
        {c.open}
        {unread > 0 && (
          <span className="rounded-full bg-accent px-1.5 text-xs text-accent-foreground">
            {unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-background p-3">
      <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {messages?.length === 0 && (
          <li className="text-sm text-muted">{c.empty}</li>
        )}
        {messages?.map((message) => (
          <li
            key={message.id}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              message.mine
                ? "self-end bg-accent-soft text-accent-soft-foreground"
                : "self-start border border-border bg-card"
            }`}
          >
            <p className="text-xs opacity-70">
              {message.mine ? c.you : message.senderName} ·{" "}
              {formatDateTime(message.createdAt)}
            </p>

            {message.visitAt && (
              <div className="mt-1">
                <p className="font-semibold">
                  {format(c.visitProposed, {
                    date: formatDateTime(message.visitAt),
                  })}
                </p>
                {message.visitStatus === "accepted" && (
                  <p className="text-green-700 dark:text-green-400">
                    ✓ {c.visitAccepted}
                  </p>
                )}
                {message.visitStatus === "declined" && (
                  <p className="text-red-700 dark:text-red-400">
                    ✗ {c.visitDeclined}
                  </p>
                )}
                {message.visitStatus === "proposed" &&
                  (viewer === "customer" ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          answerVisit.mutate({
                            messageId: message.id,
                            accept: true,
                          })
                        }
                        disabled={answerVisit.isPending}
                        className="btn btn-primary px-3 py-1"
                      >
                        {c.confirm}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          answerVisit.mutate({
                            messageId: message.id,
                            accept: false,
                          })
                        }
                        disabled={answerVisit.isPending}
                        className="btn btn-secondary px-3 py-1"
                      >
                        {c.decline}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs opacity-70">{c.visitWaiting}</p>
                  ))}
              </div>
            )}

            {message.body && (
              <p className="mt-1 whitespace-pre-line">{message.body}</p>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="error-text mt-2">{error.message}</p>}

      {!closed && !proposing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) {
              send.mutate({ requestId, body: text });
            }
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={c.placeholder}
            maxLength={2000}
            className="input"
          />
          <button
            type="submit"
            disabled={send.isPending || !text.trim()}
            className="btn btn-primary"
          >
            {c.send}
          </button>
        </form>
      )}

      {!closed && viewer === "company" && !proposing && (
        <button
          type="button"
          onClick={() => setProposing(true)}
          className="link mt-2 text-sm"
        >
          {c.proposeVisit}
        </button>
      )}

      {proposing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // datetime-local gives "2026-10-03T10:00" in local time;
            // new Date() turns it into an exact moment for the server.
            proposeVisit.mutate({
              requestId,
              visitAt: new Date(visitAt),
              body: visitNote || undefined,
            });
          }}
          className="mt-3 space-y-2"
        >
          <label className="block max-w-xs">
            <span className="label">{c.visitWhen}</span>
            <input
              type="datetime-local"
              required
              value={visitAt}
              onChange={(e) => setVisitAt(e.target.value)}
              className="input"
            />
          </label>
          <input
            value={visitNote}
            onChange={(e) => setVisitNote(e.target.value)}
            placeholder={c.visitNote}
            maxLength={2000}
            className="input"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={proposeVisit.isPending}
              className="btn btn-primary"
            >
              {c.sendProposal}
            </button>
            <button
              type="button"
              onClick={() => setProposing(false)}
              className="btn btn-secondary"
            >
              {c.cancel}
            </button>
          </div>
        </form>
      )}

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-3 block text-xs text-muted underline"
      >
        {c.hide}
      </button>
    </div>
  );
}
