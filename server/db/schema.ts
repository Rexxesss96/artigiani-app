import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  smallint,
  timestamp,
  pgEnum,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* 
---------- Enums ----------
*/

export const roleEnum = pgEnum("role", ["customer", "company"]);

export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "accepted",
  "rejected",
]);

/* 
---------- Users ----------
*/

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    firstName: varchar("first_name", { length: 50 }).notNull(),
    lastName: varchar("last_name", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    role: roleEnum("role").notNull().default("customer"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_idx").on(table.email),
  }),
);

/* 
---------- Categories (trades: mason, plumber, electrician, ...) ----------
*/

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("categories_slug_idx").on(table.slug),
  }),
);

/* 
---------- Companies ----------
*/

export const companies = pgTable(
  "companies",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessName: varchar("business_name", { length: 100 }).notNull(),
    vatNumber: varchar("vat_number", { length: 11 }).notNull(),
    sdiCode: varchar("sdi_code", { length: 7 }),
    address: varchar("address", { length: 100 }).notNull(),
    city: varchar("city", { length: 60 }).notNull(),
    province: varchar("province", { length: 2 }).notNull(),
    postalCode: varchar("postal_code", { length: 5 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    description: text("description"),
    latitude: varchar("latitude", { length: 20 }),
    longitude: varchar("longitude", { length: 20 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    vatNumberUnique: uniqueIndex("companies_vat_number_idx").on(
      table.vatNumber,
    ),
  }),
);

/* 
---------- Many-to-many: a company can offer more than one trade
*/

export const companiesCategories = pgTable(
  "companies_categories",
  {
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.categoryId] }),
  }),
);

/* 
---------- Reviews ----------
*/

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: smallint("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* 
---------- Quote requests ----------
*/

export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* 
---------- Relations (for nested queries: db.query.companies.findMany({ with: {...} }))
*/

export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  reviews: many(reviews),
  quoteRequests: many(quoteRequests),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  categories: many(companiesCategories),
  reviews: many(reviews),
  quoteRequests: many(quoteRequests),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  companies: many(companiesCategories),
}));

export const companiesCategoriesRelations = relations(
  companiesCategories,
  ({ one }) => ({
    company: one(companies, {
      fields: [companiesCategories.companyId],
      references: [companies.id],
    }),
    category: one(categories, {
      fields: [companiesCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  company: one(companies, {
    fields: [reviews.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ one }) => ({
  company: one(companies, {
    fields: [quoteRequests.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [quoteRequests.userId],
    references: [users.id],
  }),
}));
