"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authClient, useSession } from "@/lib/auth-client";
import { useI18n } from "@/components/i18n-provider";
import { authErrorMessage } from "@/lib/i18n/auth-errors";

// /account: personal details, password change and account deletion.
// All three talk directly to Better Auth (authClient), not to tRPC:
// users, passwords and sessions are Better Auth's job.

type Session = NonNullable<ReturnType<typeof useSession>["data"]>;

function PersonalDetails({ user }: { user: Session["user"] }) {
  const { dict } = useI18n();
  const a = dict.account;
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorCode(null);
    const { error } = await authClient.updateUser({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
    });
    if (error) {
      setErrorCode(error.code ?? "UNKNOWN");
      setStatus("idle");
      return;
    }
    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold">{a.personal}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">{dict.auth.firstName}</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            maxLength={50}
            className="input"
          />
        </label>
        <label className="block">
          <span className="label">{dict.auth.lastName}</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            maxLength={50}
            className="input"
          />
        </label>
      </div>
      <label className="block">
        <span className="label">{dict.auth.email}</span>
        <input value={user.email} disabled className="input opacity-60" />
        <span className="mt-1 block text-xs text-muted">{a.emailHint}</span>
      </label>
      {errorCode && (
        <p className="error-text">{authErrorMessage(errorCode, dict)}</p>
      )}
      {status === "saved" && <p className="success-text">{a.saved}</p>}
      <button
        type="submit"
        disabled={status === "saving"}
        className="btn btn-primary"
      >
        {status === "saving" ? a.saving : a.save}
      </button>
    </form>
  );
}

function ChangePassword() {
  const { dict } = useI18n();
  const a = dict.account;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorCode(null);
    setDone(false);
    if (next !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setLoading(true);
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      // Logs out every other device: if someone knew the old password,
      // they are kicked out.
      revokeOtherSessions: true,
    });
    setLoading(false);
    if (error) {
      setErrorCode(error.code ?? "UNKNOWN");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold">{a.passwordTitle}</h2>
      <label className="block">
        <span className="label">{a.currentPassword}</span>
        <input
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          className="input"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">{a.newPassword}</span>
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            minLength={8}
            className="input"
          />
        </label>
        <label className="block">
          <span className="label">{a.confirmPassword}</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            className="input"
          />
        </label>
      </div>
      {mismatch && <p className="error-text">{a.passwordsDontMatch}</p>}
      {errorCode && (
        <p className="error-text">{authErrorMessage(errorCode, dict)}</p>
      )}
      {done && <p className="success-text">{a.passwordChanged}</p>}
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? a.saving : a.changePassword}
      </button>
    </form>
  );
}

function DeleteAccount() {
  const { dict } = useI18n();
  const a = dict.account;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorCode(null);
    setLoading(true);
    const { error } = await authClient.deleteUser({ password });
    setLoading(false);
    if (error) {
      setErrorCode(error.code ?? "UNKNOWN");
      return;
    }
    // Same cleanup as logging out: no cached data of a deleted user.
    queryClient.clear();
    router.push("/");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card space-y-4 border-red-300 dark:border-red-900"
    >
      <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
        {a.dangerTitle}
      </h2>
      <p className="text-sm text-muted">{a.dangerText}</p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="accent-red-700"
        />
        {a.confirmDelete}
      </label>
      {confirmed && (
        <label className="block">
          <span className="label">{a.deletePasswordLabel}</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />
        </label>
      )}
      {errorCode && (
        <p className="error-text">
          {errorCode === "INVALID_PASSWORD"
            ? dict.auth.wrongPassword
            : authErrorMessage(errorCode, dict)}
        </p>
      )}
      <button
        type="submit"
        disabled={!confirmed || !password || loading}
        className="btn bg-red-700 text-white hover:bg-red-800"
      >
        {loading ? a.deleting : a.deleteAccount}
      </button>
    </form>
  );
}

export default function AccountPage() {
  const { dict } = useI18n();
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <p className="container-page text-muted">{dict.common.loading}</p>;
  }

  if (!session) {
    return (
      <main className="container-page">
        <p className="card">
          {dict.requestsPage.loginRequired}{" "}
          <Link href="/login" className="link">
            {dict.nav.login}
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container-page max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {dict.account.title}
        </h1>
        <p className="mt-1 text-muted">{dict.account.subtitle}</p>
      </div>
      <PersonalDetails user={session.user} />
      <ChangePassword />
      <DeleteAccount />
    </main>
  );
}
