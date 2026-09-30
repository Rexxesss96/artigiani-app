// Read-only star rating, e.g. rating 3 -> ★★★☆☆
// `label` is the text read by screen readers ("3 out of 5" / "3 su 5").
export function Stars({ rating, label }: { rating: number; label: string }) {
  const full = Math.round(rating);
  return (
    <span
      className="whitespace-nowrap text-amber-500"
      role="img"
      aria-label={label}
    >
      {"★".repeat(full)}
      <span className="text-stone-300 dark:text-stone-600">
        {"★".repeat(5 - full)}
      </span>
    </span>
  );
}
