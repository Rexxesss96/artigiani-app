import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { db } from "@/server/db";
import { quoteRequests, reviews } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Who can leave a review? Only a customer who CHOSE that company for a
// job and marked the job as completed (so they actually worked
// together), and only once per company. Used both to show/hide the form and, again,
// inside `create` — the server never trusts the UI.
// `reason` is a dictionary key (profile.*), so each page shows it in
// the visitor's language.
async function getReviewEligibility(userId: string, companyId: number) {
  const hiredRequests = await db.query.quoteRequests.findMany({
    where: and(
      eq(quoteRequests.userId, userId),
      eq(quoteRequests.companyId, companyId),
      eq(quoteRequests.status, "accepted"),
    ),
    columns: { id: true },
    with: { job: { columns: { status: true } } },
  });
  // Old requests made before jobs existed have no job: they count too.
  const workedTogether = hiredRequests.some(
    (r) => !r.job || r.job.status === "completed",
  );

  if (!workedTogether) {
    return { canReview: false, reason: "reviewNeedsAccepted" } as const;
  }

  const existingReview = await db.query.reviews.findFirst({
    where: and(eq(reviews.userId, userId), eq(reviews.companyId, companyId)),
    columns: { id: true },
  });

  if (existingReview) {
    return { canReview: false, reason: "alreadyReviewed" } as const;
  }

  return { canReview: true, reason: null } as const;
}

export const reviewsRouter = router({
  // Public: a company's reviews (newest first) plus the average rating.

  listByCompany: publicProcedure
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const list = await db.query.reviews.findMany({
        where: eq(reviews.companyId, input.companyId),
        orderBy: desc(reviews.createdAt),
        columns: { id: true, rating: true, comment: true, createdAt: true },
        with: {
          // Public page: show "Mario R.", never the email or full last name.
          user: { columns: { firstName: true, lastName: true } },
        },
      });

      const average =
        list.length === 0
          ? null
          : list.reduce((sum, review) => sum + review.rating, 0) / list.length;

      return {
        average,
        reviews: list.map(({ user, ...review }) => ({
          ...review,
          author: `${user.firstName} ${user.lastName.charAt(0)}.`,
        })),
      };
    }),

  // Can the logged-in user review this company? (drives the form)

  canReview: protectedProcedure
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return getReviewEligibility(ctx.session.user.id, input.companyId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const eligibility = await getReviewEligibility(
        ctx.session.user.id,
        input.companyId,
      );

      if (!eligibility.canReview) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: ctx.dict.profile[eligibility.reason],
        });
      }

      const [review] = await db
        .insert(reviews)
        .values({
          companyId: input.companyId,
          userId: ctx.session.user.id,
          rating: input.rating,
          comment: input.comment || null,
        })
        .returning();

      return review;
    }),
});
