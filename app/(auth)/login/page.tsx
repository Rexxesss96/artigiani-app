"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/components/i18n-provider";
import { authErrorMessage } from "@/lib/i18n/auth-errors";

export default function LoginPage() {
  const router = useRouter();
  const { dict } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // We keep the error CODE, not the text: the text is picked at render
  // time, so it follows the language even if the user switches it later.
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorCode(null);
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorCode(error.code ?? "UNKNOWN");
      return;
    }

    router.push("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 p-6"
      >
        <h1 className="text-2xl font-semibold">{dict.auth.loginTitle}</h1>

        <input
          type="email"
          placeholder={dict.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />

        <input
          type="password"
          placeholder={dict.auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />

        {errorCode && (
          <p className="text-sm text-red-600">
            {authErrorMessage(errorCode, dict)}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-foreground py-2 text-background disabled:opacity-50 cursor-pointer"
        >
          {loading ? dict.auth.loggingIn : dict.auth.login}
        </button>
      </form>
    </main>
  );
}
