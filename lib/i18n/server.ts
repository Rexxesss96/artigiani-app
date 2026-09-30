import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { dictionaries } from "./dictionaries";

// Which language to show, in order of priority:
// 1. the one the user picked with the switcher (cookie)
// 2. the browser's preferred language (Accept-Language header)
// 3. Italian
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) {
    return fromCookie;
  }

  // e.g. "en-US,en;q=0.9,it;q=0.8" -> first supported language wins
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  for (const part of acceptLanguage.split(",")) {
    const language = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(language)) {
      return language;
    }
  }

  return defaultLocale;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] };
}
