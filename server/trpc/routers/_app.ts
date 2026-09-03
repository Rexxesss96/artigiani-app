import { router } from "../trpc";
import { companiesRouter } from "./companies";
import { categoriesRouter } from "./categories";

export const appRouter = router({
  companies: companiesRouter,
  categories: categoriesRouter,
});

export type AppRouter = typeof appRouter;
