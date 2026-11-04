import { useId } from "react";

function starPoints(cx, cy, outer, inner, points = 5, rotation = -Math.PI / 2) {
  const coords = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = rotation + (index * Math.PI) / points;
    coords.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return coords.join(" ");
}

export default function StarIcon({ variant = "nova" }) {
  const rawId = useId().replace(/:/g, "");
  const gradientId = `gold-${rawId}`;

  return (
    <svg viewBox="0 0 64 64" className={`glyph glyph-${variant}`} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F8F1DE" />
          <stop offset="48%" stopColor="#D6B77A" />
          <stop offset="100%" stopColor="#8C6734" />
        </linearGradient>
      </defs>
      {variant === "orb" && (
        <>
          <circle cx="32" cy="32" r="16" fill="#D6B77A" opacity="0.18" />
          <circle cx="32" cy="32" r="7" fill={`url(#${gradientId})`} />
        </>
      )}
      {variant === "ring" && (
        <>
          <circle cx="32" cy="32" r="15" fill="none" stroke="#D6B77A" strokeWidth="1.6" />
          <circle cx="32" cy="32" r="3.2" fill="#F8F1DE" />
        </>
      )}
      {variant === "diamond" && <polygon points="32,7 52,32 32,57 12,32" fill={`url(#${gradientId})`} />}
      {variant === "spark" && <polygon points={starPoints(32, 32, 18, 4, 4)} fill={`url(#${gradientId})`} />}
      {variant === "flare" && (
        <>
          <rect x="6" y="30.2" width="52" height="3.6" rx="1.8" fill="#D6B77A" />
          <polygon points={starPoints(32, 32, 16, 6, 4)} fill={`url(#${gradientId})`} />
        </>
      )}
      {variant === "cross" && (
        <>
          <rect x="29" y="8" width="6" height="48" rx="3" fill="#D6B77A" />
          <rect x="8" y="29" width="48" height="6" rx="3" fill="#D6B77A" />
          <circle cx="32" cy="32" r="4" fill="#F8F1DE" />
        </>
      )}
      {variant === "twin" && (
        <>
          <polygon points={starPoints(24, 34, 14, 6)} fill={`url(#${gradientId})`} />
          <polygon points={starPoints(40, 28, 11, 4.5)} fill="#F3E6C4" />
        </>
      )}
      {variant === "soft" && (
        <>
          <circle cx="32" cy="32" r="18" fill="#D6B77A" opacity="0.16" />
          <circle cx="32" cy="32" r="10" fill="#D6B77A" opacity="0.35" />
          <circle cx="32" cy="32" r="4" fill="#F8F1DE" />
        </>
      )}
      {variant === "cluster" && (
        <>
          <polygon points={starPoints(22, 38, 10, 4)} fill={`url(#${gradientId})`} />
          <polygon points={starPoints(40, 36, 8, 3)} fill="#E7D3A4" />
          <polygon points={starPoints(32, 20, 7, 2.6)} fill="#F8F1DE" />
        </>
      )}
      {variant === "heartstar" && (
        <>
          <path
            d="M32 50 C32 50 14 38 14 26 C14 18 20 14 26 18 C29 14 35 14 38 18 C44 14 50 18 50 26 C50 38 32 50 32 50 Z"
            fill="none"
            stroke="#A51D42"
            strokeWidth="1.4"
          />
          <polygon points={starPoints(32, 30, 12, 5)} fill={`url(#${gradientId})`} />
        </>
      )}
      {variant === "nova" && <polygon points={starPoints(32, 32, 22, 8, 8)} fill={`url(#${gradientId})`} />}
    </svg>
  );
}
