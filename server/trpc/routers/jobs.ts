import { z } from "zod";
import { and, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/server/db";
import {
  companies,
  jobs,
  quoteRequests,
  requestMessages,
} from "@/server/db/schema";

// Jobs: the customer describes what they need ONCE and sends it to up
// to 5 companies. Each company answers with a quote (quoteRequests
// router); the customer compares them, chooses one, and at the end
// marks the job as completed.

export const MAX_COMPANIES_PER_JOB = 5;

// Was this answer given after the customer last opened the job?
function isNewAnswer(
  request: { status: string; respondedAt: Date | null },
  viewedAt: Date | null,
) {
  return (
    (request.status === "quoted" || request.status === "rejected") &&
    request.respondedAt !== null &&
    (viewedAt === null || request.respondedAt > viewedAt)
  );
}

// Average of a list of ratings, or null if there are none.
function average(ratings: { rating: number }[]) {
  return ratings.length === 0
    ? null
    : ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
}

export const jobsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        categoryId: z.number().int().positive(),
        title: z.string().trim().min(3).max(100),
        description: z.string().trim().min(10).max(4000),
        city: z.string().trim().min(2).max(60),
        address: z.string().trim().max(100).optional(),
        urgency: z.enum(["urgent", "week", "flexible"]),
        size: z.enum(["small", "large"]),
        budget: z.enum([
          "under_200",
          "200_1000",
          "1000_5000",
          "over_5000",
          "unknown",
        ]),
        // Set: no duplicates; at least one company, at most 5.
        companyIds: z
          .array(z.number().int().positive())
          .min(1)
          .max(MAX_COMPANIES_PER_JOB)
          .refine((ids) => new Set(ids).size === ids.length),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { companyIds, ...jobData } = input;

      // The chosen companies must exist and can't include my own.
      const chosen = await db.query.companies.findMany({
        where: inArray(companies.id, companyIds),
        columns: { id: true, userId: true },
      });
      if (chosen.length !== companyIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: ctx.dict.errors.companyNotFound,
        });
      }
      if (chosen.some((c) => c.userId === ctx.session.user.id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.dict.errors.ownCompanyQuote,
        });
      }

      // Job + one request per company, all or nothing.
      return db.transaction(async (tx) => {
        const [job] = await tx
          .insert(jobs)
          .values({
            ...jobData,
            address: jobData.address || null,
            userId: ctx.session.user.id,
          })
          .returning();

        await tx.insert(quoteRequests).values(
          companyIds.map((companyId) => ({
            jobId: job.id,
            companyId,
            userId: ctx.session.user.id,
          })),
        );

        return job;
      });
    }),

  // "My jobs": every job I posted, with a short summary of the quotes.

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const myJobs = await db.query.jobs.findMany({
      where: eq(jobs.userId, ctx.session.user.id),
      orderBy: desc(jobs.createdAt),
      with: {
        category: true,
        quoteRequests: {
          columns: { status: true, respondedAt: true },
          with: {
            company: { columns: { businessName: true } },
            // Messages to me not read yet (only their ids, to count them)
            messages: {
              columns: { id: true },
              where: and(
                ne(requestMessages.senderId, ctx.session.user.id),
                isNull(requestMessages.readAt),
              ),
            },
          },
        },
      },
    });

    return myJobs.map(({ quoteRequests: requests, ...job }) => ({
      ...job,
      // Something happened since I last looked: a new answer or message.
      hasNews: requests.some(
        (r) => isNewAnswer(r, job.customerViewedAt) || r.messages.length > 0,
      ),
      companyCount: requests.length,
      quoteCount: requests.filter((r) =>
        ["quoted", "accepted", "not_selected"].includes(r.status),
      ).length,
      chosenCompany:
        requests.find((r) => r.status === "accepted")?.company.businessName ??
        null,
    }));
  }),

  // One of my jobs, with photos and every company's answer.

  getMine: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const job = await db.query.jobs.findFirst({
        where: and(eq(jobs.id, input.id), eq(jobs.userId, ctx.session.user.id)),
        with: {
          category: true,
          photos: { columns: { id: true, fileName: true } },
          quoteRequests: {
            with: {
              messages: {
                columns: { id: true },
                where: and(
                  ne(requestMessages.senderId, ctx.session.user.id),
                  isNull(requestMessages.readAt),
                ),
              },
              company: {
                columns: {
                  id: true,
                  businessName: true,
                  city: true,
                  province: true,
                  logoFile: true,
                },
                with: { reviews: { columns: { rating: true } } },
              },
            },
          },
        },
      });

      if (!job) {
        return null;
      }

      // Opening the job = seeing its answers: remember when, so the
      // navbar badge only counts what arrives after now.
      await db
        .update(jobs)
        .set({ customerViewedAt: new Date() })
        .where(eq(jobs.id, job.id));

      return {
        ...job,
        quoteRequests: job.quoteRequests.map(
          ({ company, messages, ...request }) => ({
            ...request,
            isNew: isNewAnswer(request, job.customerViewedAt),
            unreadCount: messages.length,
            company: {
              id: company.id,
              businessName: company.businessName,
              city: company.city,
              province: company.province,
              logoFile: company.logoFile,
              reviewCount: company.reviews.length,
              averageRating: average(company.reviews),
            },
          }),
        ),
      };
    }),

  // The customer picks the winning quote: that company is "accepted",
  // every other still-open request becomes "not_selected", and the job
  // becomes "assigned". One transaction: all of it or nothing.

  chooseQuote: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async (tx) => {
        const request = await tx.query.quoteRequests.findFirst({
          where: eq(quoteRequests.id, input.requestId),
          with: { job: true },
        });

        if (
          !request?.job ||
          request.job.userId !== ctx.session.user.id ||
          request.job.status !== "open" ||
          request.status !== "quoted"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: ctx.dict.errors.cannotChoose,
          });
        }

        await tx
          .update(quoteRequests)
          .set({ status: "accepted" })
          .where(eq(quoteRequests.id, request.id));

        await tx
          .update(quoteRequests)
          .set({ status: "not_selected" })
          .where(
            and(
              eq(quoteRequests.jobId, request.job.id),
              ne(quoteRequests.id, request.id),
              inArray(quoteRequests.status, ["pending", "quoted"]),
            ),
          );

        await tx
          .update(jobs)
          .set({ status: "assigned" })
          .where(eq(jobs.id, request.job.id));
      });
    }),

  // The work is done: from now on the customer can review the company.

  complete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const [job] = await db
        .update(jobs)
        .set({ status: "completed", completedAt: new Date() })
        .where(
          and(
            eq(jobs.id, input.id),
            eq(jobs.userId, ctx.session.user.id),
            eq(jobs.status, "assigned"),
          ),
        )
        .returning();
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: ctx.dict.errors.jobNotFound,
        });
      }
      return job;
    }),

  // The customer gives up while still collecting quotes.

  cancel: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async (tx) => {
        const [job] = await tx
          .update(jobs)
          .set({ status: "cancelled" })
          .where(
            and(
              eq(jobs.id, input.id),
              eq(jobs.userId, ctx.session.user.id),
              eq(jobs.status, "open"),
            ),
          )
          .returning();
        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: ctx.dict.errors.jobNotFound,
          });
        }
        await tx
          .update(quoteRequests)
          .set({ status: "cancelled" })
          .where(
            and(
              eq(quoteRequests.jobId, job.id),
              inArray(quoteRequests.status, ["pending", "quoted"]),
            ),
          );
        return job;
      });
    }),
});
