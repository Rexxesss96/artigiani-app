import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/server/db";
import { companies, quoteRequests, requestMessages } from "@/server/db/schema";
import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// The company side of jobs: every company a job was sent to gets a
// quote request, and answers it with a quote or declines it.
// (The customer side lives in the jobs router.)

// The company of the logged-in user, or an error if there's none.
async function requireMyCompany(userId: string) {
  const myCompany = await db.query.companies.findFirst({
    where: eq(companies.userId, userId),
    columns: { id: true },
  });
  if (!myCompany) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return myCompany;
}

export const quoteRequestsRouter = router({
  // Requests RECEIVED by my company, newest first, with the whole job.
  // Returns an empty list if the user has no company.

  listReceived: protectedProcedure.query(async ({ ctx }) => {
    const myCompany = await db.query.companies.findFirst({
      where: eq(companies.userId, ctx.session.user.id),
      columns: { id: true },
    });
    if (!myCompany) {
      return [];
    }

    const requests = await db.query.quoteRequests.findMany({
      where: eq(quoteRequests.companyId, myCompany.id),
      orderBy: desc(quoteRequests.createdAt),
      with: {
        // Messages to me not read yet (only their ids, to count them)
        messages: {
          columns: { id: true },
          where: and(
            ne(requestMessages.senderId, ctx.session.user.id),
            isNull(requestMessages.readAt),
          ),
        },
        // Only what the company needs to get back to the customer:
        // never the whole user row.
        user: {
          columns: { firstName: true, lastName: true, email: true },
        },
        job: {
          with: {
            category: true,
            photos: { columns: { id: true, fileName: true } },
          },
        },
      },
    });

    return requests.map(({ messages, ...request }) => ({
      ...request,
      unreadCount: messages.length,
    }));
  }),

  // My company answers a request: with a quote (amount + optional
  // message) or by declining it (optional message).

  respond: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        action: z.enum(["quote", "decline"]),
        // Up to 1 million euros, in cents.
        quoteAmountCents: z
          .number()
          .int()
          .positive()
          .max(100_000_000)
          .optional(),
        responseMessage: z.string().trim().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Sending a quote means sending a price: the amount is required.
      if (input.action === "quote" && input.quoteAmountCents === undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.dict.errors.amountRequired,
        });
      }

      const myCompany = await requireMyCompany(ctx.session.user.id);

      // The request must be mine, still pending, and its job still open
      // (the customer may have chosen someone else or cancelled).
      const request = await db.query.quoteRequests.findFirst({
        where: and(
          eq(quoteRequests.id, input.id),
          eq(quoteRequests.companyId, myCompany.id),
          eq(quoteRequests.status, "pending"),
        ),
        with: { job: { columns: { status: true } } },
      });
      if (!request || (request.job && request.job.status !== "open")) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: ctx.dict.errors.requestNotFound,
        });
      }

      const [updated] = await db
        .update(quoteRequests)
        .set({
          status: input.action === "quote" ? "quoted" : "rejected",
          quoteAmountCents:
            input.action === "quote" ? input.quoteAmountCents : null,
          responseMessage: input.responseMessage || null,
          respondedAt: new Date(),
        })
        .where(eq(quoteRequests.id, request.id))
        .returning();

      return updated;
    }),
});
