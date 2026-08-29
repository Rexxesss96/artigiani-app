"use client";

import Link from "next/link";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function NavBar() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  async function handleLogout() {
    await authClient.signOut();
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
            <span className="text-gray-600">Hi, {session.user.firstName}</span>
            <button onClick={handleLogout} className="underline cursor-pointer">
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="underline cursor-pointer">
              Log in
            </Link>
            <Link href="/register" className="underline cursor-pointer">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
