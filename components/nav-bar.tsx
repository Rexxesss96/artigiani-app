"use client";

import Link from "next/link";
import { authClient, useSession } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { format } from "@/lib/i18n/dictionaries";

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const { dict } = useI18n();

  async function handleLogout() {
    await authClient.signOut();
    queryClient.clear();
    router.push("/");
    router.refresh();
  }

  // Highlights the link of the page we're on.
  function navLinkClass(href: string) {
    const active = pathname === href;
    return `rounded-lg px-3 py-1.5 transition ${
      active ? "bg-accent-soft text-accent-soft-foreground" : "hover:bg-border"
    }`;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"
          >
            {/* Simple hammer icon */}
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9" />
              <path d="M17.64 15 22 10.64" />
              <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
            </svg>
          </span>
          Artigiani Directory
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {isPending ? null : session ? (
            <>
              <Link href="/requests" className={navLinkClass("/requests")}>
                {dict.nav.myRequests}
              </Link>
              <Link href="/company" className={navLinkClass("/company")}>
                {dict.nav.myCompany}
              </Link>
              <span className="hidden px-2 text-muted sm:inline">
                {format(dict.nav.hi, { name: session.user.firstName })}
              </span>
              <button
                onClick={handleLogout}
                className="cursor-pointer rounded-lg px-3 py-1.5 transition hover:bg-border"
              >
                {dict.nav.logout}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={navLinkClass("/login")}>
                {dict.nav.login}
              </Link>
              <Link href="/register" className="btn btn-primary py-1.5">
                {dict.nav.signup}
              </Link>
            </>
          )}
          <div className="ml-2">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
}
