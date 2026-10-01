"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/components/i18n-provider";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/trpc/routers/_app";

// Wraps the dashboard sub-pages: shows a message instead of the page
// if the user isn't logged in or hasn't registered a company yet.
// `children` is a function so it receives the loaded company.

// The type of what companies.getMine returns, read from the router
// itself: if the query changes, this type follows automatically.
type MyCompany = NonNullable<
  inferRouterOutputs<AppRouter>["companies"]["getMine"]
>;

export function RequireCompany({
  children,
}: {
  children: (company: MyCompany) => React.ReactNode;
}) {
  const { dict } = useI18n();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: myCompany, isPending } = trpc.companies.getMine.useQuery(
    undefined,
    { enabled: !!session },
  );

  if (sessionPending || (session && isPending)) {
    return <p className="container-page text-muted">{dict.common.loading}</p>;
  }

  if (!session || !myCompany) {
    return (
      <main className="container-page">
        <p className="card">
          {session ? dict.dashboard.needCompany : dict.dashboard.loginRequired}{" "}
          <Link href={session ? "/company" : "/login"} className="link">
            {session ? dict.dashboard.goRegister : dict.nav.login}
          </Link>
        </p>
      </main>
    );
  }

  return children(myCompany);
}
