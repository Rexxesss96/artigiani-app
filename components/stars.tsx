// Read-only star rating, e.g. rating 3 -> ★★★☆☆
export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-yellow-500" aria-label={`${rating} out of 5`}>
      {"★".repeat(full)}
      <span className="text-gray-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}
