// Round badge with the company's initials ("Ferrari Impianti" -> "FI"),
// used instead of a logo since companies can't upload images yet.
export function CompanyAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "md" | "lg";
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-xl bg-accent-soft font-semibold text-accent-soft-foreground ${
        size === "lg" ? "size-16 text-xl" : "size-12 text-base"
      }`}
    >
      {initials}
    </div>
  );
}
