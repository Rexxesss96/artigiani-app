"use server";

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "./config";

// Server Action: a function that runs on the server but can be called
// from a Client Component like a normal function. When it sets a cookie,
// Next re-renders the current page on the server, so every text switches
// to the new language without a full reload.
export async function setLocale(locale: string) {
  // Anyone can call a Server Action with any value: check it first.
  if (!isLocale(locale)) {
    return;
  }

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // one year, in seconds
    sameSite: "lax",
  });
}
