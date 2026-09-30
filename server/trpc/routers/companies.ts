import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { db } from "@/server/db";
import { companies, companiesCategories, user } from "@/server/db/schema";
import { and, asc, eq, ilike, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { geocodeAddress } from "@/server/geocode";

// Fields a company can fill in, shared by `create` and `update`.
// (The VAT number is only set once, at creation: it identifies the company.)
const companyFields = {
  businessName: z.string().trim().min(2).max(100),
  sdiCode: z.string().trim().max(7).optional(),
  address: z.string().trim().min(3).max(100),
  city: z.string().trim().min(2).max(60),
  province: z.string().trim().length(2),
  postalCode: z.string().trim().length(5),
  phone: z.string().trim().max(20).optional(),
  description: z.string().trim().max(2000).optional(),
  categoryIds: z.array(z.number().int().positive()).min(1),
};

export const companiesRouter = router({
  // Creates a company for the logged-in user and promotes them to "company".

  create: protectedProcedure
    .input(
      z.object({
        ...companyFields,
        vatNumber: z.string().trim().length(11),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, ...companyData } = input;

      // Coordinates for the map, computed from the address. Done BEFORE
      // the transaction: a slow network call shouldn't keep it open.
      const coordinates = await geocodeAddress(companyData);

      // All three writes below happen in a single transaction: if any
      // of them fails, everything before it in this block is rolled
      // back too — we never end up with a half-created company.
      const company = await db.transaction(async (tx) => {
        const existing = await tx.query.companies.findFirst({
          where: eq(companies.userId, ctx.session.user.id),
          columns: { id: true },
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: ctx.dict.errors.companyAlreadyExists,
          });
        }

        const [newCompany] = await tx
          .insert(companies)
          .values({
            ...companyData,
            ...coordinates,
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

  // Updates the logged-in user's company and replaces its categories.

  update: protectedProcedure
    .input(z.object(companyFields))
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, ...companyData } = input;

      const current = await db.query.companies.findFirst({
        where: eq(companies.userId, ctx.session.user.id),
        columns: {
          address: true,
          postalCode: true,
          city: true,
          province: true,
        },
      });
      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: ctx.dict.errors.companyNotFound,
        });
      }

      // Recompute the coordinates only if the address changed. If the
      // lookup fails we clear them rather than keep a wrong position.
      const addressChanged = (
        ["address", "postalCode", "city", "province"] as const
      ).some((field) => current[field] !== companyData[field]);
      const coordinates = addressChanged
        ? ((await geocodeAddress(companyData)) ?? {
            latitude: null,
            longitude: null,
          })
        : {};

      return db.transaction(async (tx) => {
        const [updated] = await tx
          .update(companies)
          .set({
            ...companyData,
            // An emptied optional field is saved as NULL, not "".
            sdiCode: companyData.sdiCode || null,
            phone: companyData.phone || null,
            description: companyData.description || null,
            ...coordinates,
          })
          .where(eq(companies.userId, ctx.session.user.id))
          .returning();

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: ctx.dict.errors.companyNotFound,
          });
        }

        // Simplest way to "change" a many-to-many list: delete the old
        // links and insert the new ones, inside the same transaction.
        await tx
          .delete(companiesCategories)
          .where(eq(companiesCategories.companyId, updated.id));
        await tx.insert(companiesCategories).values(
          categoryIds.map((categoryId) => ({
            companyId: updated.id,
            categoryId,
          })),
        );

        return updated;
      });
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

  // Public search: lists companies, optionally filtered by city and/or
  // category. Both filters are optional — with no filters it returns
  // every company (capped by `limit`).

  search: publicProcedure
    .input(
      z.object({
        city: z.string().trim().max(60).optional(),
        categoryId: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ input }) => {
      // Each filter becomes one SQL condition; `and()` skips the
      // undefined ones, so a missing filter simply doesn't apply.
      const conditions = [
        // ilike = case-insensitive LIKE: "rom" matches "Roma" and "ROMA".
        // "%" and "_" are wildcards in LIKE, so we escape them (and "\")
        // to search for them as plain characters.
        input.city
          ? ilike(companies.city, `%${input.city.replace(/[\\%_]/g, "\\$&")}%`)
          : undefined,

        // The category lives in the join table, so we keep only the
        // companies whose id appears there next to the chosen category.
        input.categoryId
          ? inArray(
              companies.id,
              db
                .select({ id: companiesCategories.companyId })
                .from(companiesCategories)
                .where(eq(companiesCategories.categoryId, input.categoryId)),
            )
          : undefined,
      ];

      const results = await db.query.companies.findMany({
        where: and(...conditions),
        orderBy: asc(companies.businessName),
        limit: 50,
        columns: {
          id: true,
          businessName: true,
          city: true,
          province: true,
          description: true,
        },
        with: {
          categories: {
            with: { category: true },
          },
          // Only the ratings, to show the average in the result cards.
          reviews: { columns: { rating: true } },
        },
      });

      return results.map(({ reviews, ...company }) => ({
        ...company,
        reviewCount: reviews.length,
        averageRating:
          reviews.length === 0
            ? null
            : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
      }));
    }),

  // Returns a company by id with its linked categories (public query).

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.query.companies.findFirst({
        where: eq(companies.id, input.id),
        columns: {
          id: true,
          businessName: true,
          address: true,
          city: true,
          province: true,
          postalCode: true,
          phone: true,
          description: true,
          latitude: true,
          longitude: true,
        },
        with: {
          categories: {
            with: { category: true },
          },
        },
      });
    }),
});
