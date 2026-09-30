import { router } from "../trpc";
import { companiesRouter } from "./companies";
import { categoriesRouter } from "./categories";
import { quoteRequestsRouter } from "./quoteRequests";

export const appRouter = router({
  companies: companiesRouter,
  categories: categoriesRouter,
  quoteRequests: quoteRequestsRouter,
});

export type AppRouter = typeof appRouter;
