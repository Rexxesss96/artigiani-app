// Line drawing of a small building site (crane, house under
// construction, bricks and tools), drawn by hand in SVG.
// It uses `currentColor` and the accent color, so it follows the
// light/dark theme automatically. aria-hidden: it's only decoration.

export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Sun */}
      <circle cx="330" cy="60" r="22" className="text-accent" />

      {/* Ground */}
      <path d="M10 260h380" />

      {/* Crane: tower, jib, counterweight, cable and a hanging beam */}
      <path d="M70 260V70M90 260V70M70 70h20" />
      <path d="M70 100l20 20M90 100l-20 20M70 140l20 20M90 140l-20 20M70 180l20 20M90 180l-20 20M70 220l20 20M90 220l-20 20" />
      <path d="M40 70h190M80 70l-40-25h80z" />
      <rect x="40" y="70" width="22" height="16" className="text-accent" />
      <path d="M200 70v60" strokeDasharray="4 5" />
      <rect x="175" y="130" width="50" height="10" className="text-accent" />

      {/* House under construction, with scaffolding */}
      <path d="M200 260v-90l70-50 70 50v90" />
      <path d="M200 170h140" />
      <rect x="225" y="190" width="28" height="28" />
      <path d="M239 190v28M225 204h28" />
      <path d="M290 260v-45h28v45" className="text-accent" />
      <path d="M350 260V150M380 260V150M350 175h30M350 210h30M350 245h30M350 175l30 35" />

      {/* Bricks */}
      <path d="M110 260v-14h36v14M110 246v-14h36v14M128 232v-14h36v28M146 246h18M164 246v14" />

      {/* Crossed hammer and wrench */}
      <g className="text-accent">
        <path d="M150 205l40-40" />
        <path d="M182 160l14 14-6 6-14-14z" />
        <path d="M190 205l-40-40" />
        <circle cx="146" cy="161" r="7" />
      </g>
    </svg>
  );
}
