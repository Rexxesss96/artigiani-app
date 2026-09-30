// Languages the app supports. "as const" turns the array into the
// literal types "it" | "en" instead of a generic string[].
export const locales = ["it", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "it";

// The chosen language is remembered in this cookie, so every page
// (server or client) can read it without changing the URLs.
export const LOCALE_COOKIE = "lang";

// Used by toLocaleDateString() to format dates the local way.
export const dateLocales: Record<Locale, string> = {
  it: "it-IT",
  en: "en-GB",
};

// Type guard: after `if (isLocale(x))`, TypeScript knows x is a Locale.
export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}
