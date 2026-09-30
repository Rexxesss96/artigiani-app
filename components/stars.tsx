// Read-only star rating, e.g. rating 3 -> ★★★☆☆
// `label` is the text read by screen readers ("3 out of 5" / "3 su 5").
export function Stars({ rating, label }: { rating: number; label: string }) {
  const full = Math.round(rating);
  return (
    <span className="text-yellow-500" role="img" aria-label={label}>
      {"★".repeat(full)}
      <span className="text-gray-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}
