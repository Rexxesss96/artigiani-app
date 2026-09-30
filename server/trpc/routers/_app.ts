import { router } from "../trpc";
import { companiesRouter } from "./companies";
import { categoriesRouter } from "./categories";
import { quoteRequestsRouter } from "./quoteRequests";
import { reviewsRouter } from "./reviews";

export const appRouter = router({
  companies: companiesRouter,
  categories: categoriesRouter,
  quoteRequests: quoteRequestsRouter,
  reviews: reviewsRouter,
});

export type AppRouter = typeof appRouter;
