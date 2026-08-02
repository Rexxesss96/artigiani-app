import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
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
---------- Auth (Better Auth) ----------
This table is owned by Better Auth: it manages id (text, not serial),
email, sessions, etc. We extend it with our own domain fields
(role, firstName, lastName) via Better Auth's "additionalFields".
*/

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: roleEnum("role").notNull().default("customer"),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Active login sessions. Better Auth reads/writes this table itself —
// we don't query it directly in our own code.
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// Login providers (email+password counts as one "account" too).
// Needed even though we only use email+password for now — it's how
// Better Auth stores the hashed password.
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Email verification / password reset tokens.
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
    // text, not integer: points to Better Auth's user.id (also text)
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
  // text, not integer: points to Better Auth's user.id
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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
  // text, not integer: points to Better Auth's user.id
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* 
---------- Relations (for nested queries: db.query.companies.findMany({ with: {...} }))
*/

// Singular "userRelations" / "user" to match the table name (Better Auth's
// convention), unlike our other tables which are plural.
export const userRelations = relations(user, ({ many }) => ({
  companies: many(companies),
  reviews: many(reviews),
  quoteRequests: many(quoteRequests),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(user, {
    fields: [companies.userId],
    references: [user.id],
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
  user: one(user, {
    fields: [reviews.userId],
    references: [user.id],
  }),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ one }) => ({
  company: one(companies, {
    fields: [quoteRequests.companyId],
    references: [companies.id],
  }),
  user: one(user, {
    fields: [quoteRequests.userId],
    references: [user.id],
  }),
}));
