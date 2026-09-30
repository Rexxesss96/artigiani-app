"use client";

import { useTransition } from "react";
import { locales } from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/actions";
import { useI18n } from "@/components/i18n-provider";

// IT / EN buttons in the navbar. The choice is saved in a cookie by the
// setLocale Server Action; useTransition gives us `isPending` to disable
// the buttons while the page re-renders in the new language.

export function LanguageSwitcher() {
  const { locale, dict } = useI18n();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-1" role="group" aria-label={dict.nav.language}>
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => startTransition(() => setLocale(l))}
          disabled={isPending}
          aria-pressed={l === locale}
          className={`cursor-pointer rounded px-2 py-1 text-xs uppercase disabled:opacity-50 ${
            l === locale
              ? "bg-foreground text-background"
              : "border border-gray-300"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
