"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <main className="container-page flex justify-center py-12">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {dict.auth.registerTitle}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {dict.auth.registerSubtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">{dict.auth.firstName}</span>
            <input
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">{dict.auth.lastName}</span>
            <input
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="input"
            />
          </label>
        </div>

        <label className="block">
          <span className="label">{dict.auth.email}</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
        </label>

        <label className="block">
          <span className="label">{dict.auth.password}</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="input"
          />
        </label>

        {errorCode && (
          <p className="error-text">{authErrorMessage(errorCode, dict)}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? dict.auth.creatingAccount : dict.auth.signup}
        </button>

        <p className="text-center text-sm text-muted">
          {dict.auth.haveAccount}{" "}
          <Link href="/login" className="link">
            {dict.auth.login}
          </Link>
        </p>
      </form>
    </main>
  );
}
