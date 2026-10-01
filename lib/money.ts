import { dateLocales, type Locale } from "@/lib/i18n/config";

// 15050 cents -> "150,50 €" (it) / "€150.50" (en)
export function formatMoney(cents: number, locale: Locale) {
  return new Intl.NumberFormat(dateLocales[locale], {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

// What the user typed -> cents, or null if it isn't a valid amount.
// Accepts both "150,50" (Italian) and "150.50" (English).
export function parseMoneyToCents(text: string): number | null {
  const normalized = text.trim().replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}
