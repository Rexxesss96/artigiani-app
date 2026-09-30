"use client";

import Link from "next/link";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { format } from "@/lib/i18n/dictionaries";

export function NavBar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const { dict } = useI18n();

  async function handleLogout() {
    await authClient.signOut();
    queryClient.clear();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <Link href="/" className="font-semibold">
        Artigiani Directory
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        {isPending ? null : session ? (
          <>
            <Link href="/requests" className="underline">
              {dict.nav.myRequests}
            </Link>
            <Link href="/company" className="underline">
              {dict.nav.myCompany}
            </Link>
            <span className="text-gray-600">
              {format(dict.nav.hi, { name: session.user.firstName })}
            </span>
            <button onClick={handleLogout} className="underline cursor-pointer">
              {dict.nav.logout}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="underline cursor-pointer">
              {dict.nav.login}
            </Link>
            <Link href="/register" className="underline cursor-pointer">
              {dict.nav.signup}
            </Link>
          </>
        )}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
