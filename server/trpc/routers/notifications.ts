import { and, count, eq, gt, inArray, isNull, ne, or } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/server/db";
import {
  companies,
  jobs,
  quoteRequests,
  requestMessages,
} from "@/server/db/schema";

// The numbers behind the badges in the navbar: what's new for me as a
// customer and as a company. Each is a single COUNT query with JOINs.

export const notificationsRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;

    // Messages written to me, not read yet, in a request where I'm...
    const unreadTo = (side: "customer" | "company") =>
      db
        .select({ value: count() })
        .from(requestMessages)
        .innerJoin(
          quoteRequests,
          eq(quoteRequests.id, requestMessages.requestId),
        )
        .innerJoin(companies, eq(companies.id, quoteRequests.companyId))
        .where(
          and(
            ne(requestMessages.senderId, me),
            isNull(requestMessages.readAt),
            side === "customer"
              ? eq(quoteRequests.userId, me)
              : eq(companies.userId, me),
          ),
        );

    const [[newQuotes], [customerUnread], [pendingRequests], [companyUnread]] =
      await Promise.all([
        // Answers to my jobs that arrived after I last opened the job.
        db
          .select({ value: count() })
          .from(quoteRequests)
          .innerJoin(jobs, eq(jobs.id, quoteRequests.jobId))
          .where(
            and(
              eq(jobs.userId, me),
              inArray(quoteRequests.status, ["quoted", "rejected"]),
              or(
                isNull(jobs.customerViewedAt),
                gt(quoteRequests.respondedAt, jobs.customerViewedAt),
              ),
            ),
          ),
        unreadTo("customer"),
        // Requests my company hasn't answered yet.
        db
          .select({ value: count() })
          .from(quoteRequests)
          .innerJoin(companies, eq(companies.id, quoteRequests.companyId))
          .where(
            and(eq(companies.userId, me), eq(quoteRequests.status, "pending")),
          ),
        unreadTo("company"),
      ]);

    return {
      customer: newQuotes.value + customerUnread.value,
      company: pendingRequests.value + companyUnread.value,
    };
  }),
});
