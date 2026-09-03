// tRPC context: runs once per incoming request.
// Resolves the current Better Auth session (or null) and makes it
// available to every tRPC procedure via `ctx.session`.

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return {
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
