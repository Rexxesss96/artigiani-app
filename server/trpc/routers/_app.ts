import { router } from "../trpc";
import { companiesRouter } from "./companies";
import { categoriesRouter } from "./categories";
import { quoteRequestsRouter } from "./quoteRequests";
import { reviewsRouter } from "./reviews";
import { jobsRouter } from "./jobs";
import { messagesRouter } from "./messages";
import { notificationsRouter } from "./notifications";

export const appRouter = router({
  companies: companiesRouter,
  categories: categoriesRouter,
  quoteRequests: quoteRequestsRouter,
  reviews: reviewsRouter,
  jobs: jobsRouter,
  messages: messagesRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
