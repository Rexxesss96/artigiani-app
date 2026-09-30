// tRPC context: runs once per incoming request.
// Resolves the current Better Auth session (or null) and makes it
// available to every tRPC procedure via `ctx.session`, together with
// the user's language (`ctx.locale`, `ctx.dict`).

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDictionary } from "@/lib/i18n/server";

export async function createContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // The user's language, so procedures can reply with translated errors.
  const { locale, dict } = await getDictionary();

  return {
    session,
    locale,
    dict,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
