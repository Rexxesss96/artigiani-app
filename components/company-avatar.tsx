import Image from "next/image";
import { uploadUrl } from "@/lib/uploads";

// The company's logo if it has one, otherwise a round badge with its
// initials ("Ferrari Impianti" -> "FI").
export function CompanyAvatar({
  name,
  logoFile,
  size = "md",
}: {
  name: string;
  logoFile?: string | null;
  size?: "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "size-16 text-xl" : "size-12 text-base";

  if (logoFile) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl border border-border bg-card ${sizeClass}`}
      >
        {/* next/image resizes the logo: the browser downloads a small file */}
        <Image
          src={uploadUrl(logoFile)}
          alt={name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-xl bg-accent-soft font-semibold text-accent-soft-foreground ${sizeClass}`}
    >
      {initials}
    </div>
  );
}
