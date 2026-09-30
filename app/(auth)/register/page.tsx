"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/components/i18n-provider";
import { authErrorMessage } from "@/lib/i18n/auth-errors";

export default function RegisterPage() {
  const router = useRouter();
  const { dict } = useI18n();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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

    const { error } = await authClient.signUp.email({
      email,
      password,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
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
        <h1 className="text-2xl font-semibold">{dict.auth.registerTitle}</h1>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder={dict.auth.firstName}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-1/2 rounded border border-gray-300 px-3 py-2"
          />
          <input
            type="text"
            placeholder={dict.auth.lastName}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-1/2 rounded border border-gray-300 px-3 py-2"
          />
        </div>

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
          minLength={8}
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
          {loading ? dict.auth.creatingAccount : dict.auth.signup}
        </button>
      </form>
    </main>
  );
}
