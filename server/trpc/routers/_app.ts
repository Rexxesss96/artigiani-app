import { router } from "../trpc";
import { companiesRouter } from "./companies";
import { categoriesRouter } from "./categories";
import { quoteRequestsRouter } from "./quoteRequests";
import { reviewsRouter } from "./reviews";
import { jobsRouter } from "./jobs";

export const appRouter = router({
  companies: companiesRouter,
  categories: categoriesRouter,
  quoteRequests: quoteRequestsRouter,
  reviews: reviewsRouter,
  jobs: jobsRouter,
});

export type AppRouter = typeof appRouter;
