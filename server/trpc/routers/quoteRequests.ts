import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/server/db";
import { companies, quoteRequests } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const quoteRequestsRouter = router({
  // A logged-in user sends a quote request to a company.
  // It always starts as "pending": only the company can change it.

  create: protectedProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        message: z.string().trim().min(10).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, input.companyId),
        columns: { userId: true },
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: ctx.dict.errors.companyNotFound,
        });
      }

      if (company.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.dict.errors.ownCompanyQuote,
        });
      }

      // One open request per company is enough: this stops a customer
      // from flooding a company with duplicates while it hasn't answered.
      const pendingRequest = await db.query.quoteRequests.findFirst({
        where: and(
          eq(quoteRequests.userId, ctx.session.user.id),
          eq(quoteRequests.companyId, input.companyId),
          eq(quoteRequests.status, "pending"),
        ),
        columns: { id: true },
      });

      if (pendingRequest) {
        throw new TRPCError({
          code: "CONFLICT",
          message: ctx.dict.errors.pendingRequestExists,
        });
      }

      const [request] = await db
        .insert(quoteRequests)
        .values({
          companyId: input.companyId,
          userId: ctx.session.user.id,
          message: input.message,
        })
        .returning();

      return request;
    }),

  // Requests the logged-in user has SENT, newest first.

  listSent: protectedProcedure.query(async ({ ctx }) => {
    return db.query.quoteRequests.findMany({
      where: eq(quoteRequests.userId, ctx.session.user.id),
      orderBy: desc(quoteRequests.createdAt),
      with: {
        company: {
          columns: { id: true, businessName: true, city: true },
        },
      },
    });
  }),

  // Requests RECEIVED by the logged-in user's company, newest first.
  // Returns an empty list if the user has no company.

  listReceived: protectedProcedure.query(async ({ ctx }) => {
    const myCompany = await db.query.companies.findFirst({
      where: eq(companies.userId, ctx.session.user.id),
      columns: { id: true },
    });

    if (!myCompany) {
      return [];
    }

    return db.query.quoteRequests.findMany({
      where: eq(quoteRequests.companyId, myCompany.id),
      orderBy: desc(quoteRequests.createdAt),
      with: {
        // Only what the company needs to get back to the customer:
        // never the whole user row.
        user: {
          columns: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }),

  // The company answers a request it received: it accepts it with a
  // quote (amount + optional message) or rejects it (optional message).

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["accepted", "rejected"]),
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
      // Accepting means sending a price: the amount is required.
      if (input.status === "accepted" && input.quoteAmountCents === undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.dict.errors.amountRequired,
        });
      }

      const myCompany = await db.query.companies.findFirst({
        where: eq(companies.userId, ctx.session.user.id),
        columns: { id: true },
      });

      if (!myCompany) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // The WHERE checks three things at once: the right request,
      // that it belongs to MY company, and that it's still pending.
      // If any of them is false, nothing is updated.
      const [updated] = await db
        .update(quoteRequests)
        .set({
          status: input.status,
          quoteAmountCents:
            input.status === "accepted" ? input.quoteAmountCents : null,
          responseMessage: input.responseMessage || null,
          respondedAt: new Date(),
        })
        .where(
          and(
            eq(quoteRequests.id, input.id),
            eq(quoteRequests.companyId, myCompany.id),
            eq(quoteRequests.status, "pending"),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: ctx.dict.errors.requestNotFound,
        });
      }

      return updated;
    }),
});
