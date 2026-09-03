// tRPC setup: initializes tRPC with the app's Context, and exports
// the building blocks used across all routers — `router`,
// `publicProcedure` (no auth required), and `protectedProcedure`
// (requires a valid session, guaranteed non-null via middleware).

import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware: block the request if there isn't any valid session
const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      // From here on, inside procedures using protectedProcedure,
      // TypeScript knows ctx.session is not null — no more repeated
      // checks or manual casts needed.

      session: ctx.session,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireAuth);
