import { router, publicProcedure } from "../trpc";
import { db } from "@/server/db";

export const categoriesRouter = router({
  list: publicProcedure.query(async () => {
    return db.query.categories.findMany();
  }),
});
