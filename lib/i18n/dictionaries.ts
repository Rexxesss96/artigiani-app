import { en } from "./en";
import { it } from "./it";
import type { Locale } from "./config";

// The type of a dictionary is "whatever shape en.ts has".
export type Dictionary = typeof en;

export const dictionaries: Record<Locale, Dictionary> = { en, it };

// Fills the {placeholders} of a text: format("Hi, {name}", { name: "Mario" }).
// Dictionaries hold plain strings (not functions) because they are passed
// from Server to Client Components, and only plain data can cross that line.
export function format(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

// Translated trade name; falls back to the name stored in the database
// for a category added later and not translated yet.
export function categoryName(
  dict: Dictionary,
  category: { slug: string; name: string },
) {
  return dict.categories[category.slug] ?? category.name;
}
