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

// Life of a quote request sent to ONE company for a job:
//   pending -> quoted (company sent a price) or rejected (company declined)
//   quoted  -> accepted (customer chose it) or not_selected (chose another)
//   any open one -> cancelled (customer cancelled the job)
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
  "quoted",
  "not_selected",
]);

// ---------- Jobs: what the customer needs done ----------
export const jobUrgencyEnum = pgEnum("job_urgency", [
  "urgent", // today / as soon as possible
  "week", // within a week
  "flexible",
]);
export const jobSizeEnum = pgEnum("job_size", ["small", "large"]);
export const visitStatusEnum = pgEnum("visit_status", [
  "proposed",
  "accepted",
  "declined",
]);
export const jobBudgetEnum = pgEnum("job_budget", [
  "under_200",
  "200_1000",
  "1000_5000",
  "over_5000",
  "unknown",
]);
// open: collecting quotes · assigned: a company was chosen ·
// completed: the work is done · cancelled: the customer gave up
export const jobStatusEnum = pgEnum("job_status", [
  "open",
  "assigned",
  "completed",
  "cancelled",
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
    // Does the company handle urgent call-outs ("pronto intervento")?
    emergencyService: boolean("emergency_service").notNull().default(false),
    // How far from its address the company is willing to work, in km.
    serviceRadiusKm: smallint("service_radius_km").notNull().default(20),
    // File name of the logo inside the uploads/ folder (see server/storage.ts).
    logoFile: varchar("logo_file", { length: 100 }),
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
---------- Photos of a company's work ----------
*/

export const companyPhotos = pgTable("company_photos", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
---------- Jobs ----------
A job is posted once by a customer and sent to up to 5 companies:
each of them gets a row in quote_requests (below).
*/

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  city: varchar("city", { length: 60 }).notNull(),
  address: varchar("address", { length: 100 }),
  urgency: jobUrgencyEnum("urgency").notNull(),
  size: jobSizeEnum("size").notNull(),
  budget: jobBudgetEnum("budget").notNull().default("unknown"),
  status: jobStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  // Last time the customer opened the job page: answers that arrived
  // after this moment are "new" (badge in the navbar).
  customerViewedAt: timestamp("customer_viewed_at"),
});

export const jobPhotos = pgTable("job_photos", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 100 }).notNull(),
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
  // The job this request belongs to (null only for old requests made
  // before jobs existed, which carried their own message).
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  message: text("message"),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // The company's answer. Money is stored in CENTS as an integer
  // (€ 150,50 -> 15050): decimal numbers in floating point can't
  // represent every amount exactly, integers can.
  quoteAmountCents: integer("quote_amount_cents"),
  responseMessage: text("response_message"),
  respondedAt: timestamp("responded_at"),
});

/* 
---------- Messages inside a quote request ----------
A small chat between the customer and ONE company about a job.
A message can also be a site-visit proposal ("sopralluogo") from the
company: then visitAt is set and the customer accepts or declines it.
*/

export const requestMessages = pgTable("request_messages", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id")
    .notNull()
    .references(() => quoteRequests.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  body: text("body"),
  visitAt: timestamp("visit_at"),
  visitStatus: visitStatusEnum("visit_status"),
  // When the OTHER person opened the conversation (null = not read yet).
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* 
---------- Relations (for nested queries: db.query.companies.findMany({ with: {...} }))
*/

// Singular "userRelations" / "user" to match the table name (Better Auth's
// convention), unlike our other tables which are plural.
export const userRelations = relations(user, ({ many }) => ({
  companies: many(companies),
  jobs: many(jobs),
  reviews: many(reviews),
  quoteRequests: many(quoteRequests),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(user, {
    fields: [companies.userId],
    references: [user.id],
  }),
  categories: many(companiesCategories),
  photos: many(companyPhotos),
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

export const companyPhotosRelations = relations(companyPhotos, ({ one }) => ({
  company: one(companies, {
    fields: [companyPhotos.companyId],
    references: [companies.id],
  }),
}));

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

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(user, { fields: [jobs.userId], references: [user.id] }),
  category: one(categories, {
    fields: [jobs.categoryId],
    references: [categories.id],
  }),
  photos: many(jobPhotos),
  quoteRequests: many(quoteRequests),
}));

export const jobPhotosRelations = relations(jobPhotos, ({ one }) => ({
  job: one(jobs, { fields: [jobPhotos.jobId], references: [jobs.id] }),
}));

export const requestMessagesRelations = relations(
  requestMessages,
  ({ one }) => ({
    request: one(quoteRequests, {
      fields: [requestMessages.requestId],
      references: [quoteRequests.id],
    }),
    sender: one(user, {
      fields: [requestMessages.senderId],
      references: [user.id],
    }),
  }),
);

export const quoteRequestsRelations = relations(
  quoteRequests,
  ({ one, many }) => ({
    messages: many(requestMessages),
    job: one(jobs, { fields: [quoteRequests.jobId], references: [jobs.id] }),
    company: one(companies, {
      fields: [quoteRequests.companyId],
      references: [companies.id],
    }),
    user: one(user, {
      fields: [quoteRequests.userId],
      references: [user.id],
    }),
  }),
);
