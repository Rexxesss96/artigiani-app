// Small line icons for each trade, chosen by category slug.
// Drawn by hand like the hero illustration; unknown slugs get a toolbox.

const PATHS: Record<string, React.ReactNode> = {
  // wrench
  plumber: (
    <path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4z" />
  ),
  // lightning bolt
  electrician: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  // bricks
  mason: (
    <path d="M3 5h18v14H3zM3 9.7h18M3 14.3h18M9 5v4.7M15 9.7v4.6M9 14.3V19" />
  ),
  // brush
  painter: (
    <path d="M18 3l3 3-9 9-3-3zM9 12c-3 0-5 2-5 5 0 1.5-1 3-1 3s5 0 7-2c1.5-1.5 2-3 2-3" />
  ),
  // paint roller
  "house-painter": <path d="M4 4h13v5H4zM17 6.5h3v6h-8v3M10 15.5h4V21h-4z" />,
  // tiles
  tiler: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  // saw
  carpenter: (
    <path d="M3 17 15 5l4 4L7 21zM6 17l1 1M9 14l1 1M12 11l1 1M17 3l4 4" />
  ),
  // key
  locksmith: <path d="M8 15a4 4 0 1 1 0-.1zM11 12l9-9M17 6l2 2M15 8l2 2" />,
  // leaf
  gardener: <path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15M5 19l8-8" />,
  // window
  "window-installer": <path d="M5 3h14v18H5zM12 3v18M5 12h14" />,
};

export function TradeIcon({
  slug,
  className = "size-6",
}: {
  slug: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[slug] ?? (
        // toolbox
        <path d="M3 9h18v10H3zM8 9V6h8v3M3 13h18" />
      )}
    </svg>
  );
}
