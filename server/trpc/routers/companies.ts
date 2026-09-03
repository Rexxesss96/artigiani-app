import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/server/db";
import { companies, companiesCategories, user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const companiesRouter = router({
  // Creates a company for the logged-in user and promotes them to "company".

  create: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(2).max(100),
        vatNumber: z.string().length(11),
        sdiCode: z.string().max(7).optional(),
        address: z.string().min(3).max(100),
        city: z.string().min(2).max(60),
        province: z.string().length(2),
        postalCode: z.string().length(5),
        phone: z.string().max(20).optional(),
        description: z.string().optional(),
        categoryIds: z.array(z.number()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, ...companyData } = input;

      // All three writes below happen in a single transaction: if any
      // of them fails, everything before it in this block is rolled
      // back too — we never end up with a half-created company.
      const company = await db.transaction(async (tx) => {
        const [newCompany] = await tx
          .insert(companies)
          .values({
            ...companyData,
            userId: ctx.session.user.id,
          })
          .returning();

        await tx.insert(companiesCategories).values(
          categoryIds.map((categoryId) => ({
            companyId: newCompany.id,
            categoryId,
          })),
        );

        // Promotes the user to "company" — ONLY here, server-side, as
        // a consequence of actually creating a company.
        // The client never chooses the role.
        await tx
          .update(user)
          .set({ role: "company" })
          .where(eq(user.id, ctx.session.user.id));

        return newCompany;
      });

      return company;
    }),

  // Returns the logged-in user's company (if they have one), with categories.

  getMine: protectedProcedure.query(async ({ ctx }) => {
    return db.query.companies.findFirst({
      where: eq(companies.userId, ctx.session.user.id),
      with: {
        categories: {
          with: { category: true },
        },
      },
    });
  }),
});
