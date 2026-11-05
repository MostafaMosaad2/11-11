function mulberry32(seed) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeShadows(seed, count, color) {
  const random = mulberry32(seed);
  const shadows = [];
  for (let index = 0; index < count; index += 1) {
    const x = (random() * 100).toFixed(2);
    const y = (random() * 100).toFixed(2);
    const alpha = (0.35 + random() * 0.6).toFixed(2);
    shadows.push(`${x}vw ${y}vh 0 ${color.replace("ALPHA", alpha)}`);
  }
  return shadows.join(", ");
}

const smallStars = makeShadows(11, 54, "rgba(245, 240, 234, ALPHA)");
const mediumStars = makeShadows(1111, 22, "rgba(214, 183, 122, ALPHA)");
const brightStars = makeShadows(2026, 9, "rgba(245, 240, 234, ALPHA)");

export default function GalaxyBackground({ mood = "opening" }) {
  return (
    <div className={`sky mood-${mood}`} aria-hidden="true">
      <div className="sky-glow" />
      <div className="sky-stars sky-stars-sm" style={{ boxShadow: smallStars }} />
      <div className="sky-stars sky-stars-md" style={{ boxShadow: mediumStars }} />
      <div className="sky-stars sky-stars-lg" style={{ boxShadow: brightStars }} />
      <svg className="sky-constellation" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="#D6B77A" strokeWidth="0.6" opacity="0.45">
          <path d="M48 90 L96 150 L74 230 L140 286" />
          <path d="M286 70 L332 132 L304 198 L348 246" />
          <path d="M70 520 L120 574 L96 650" />
          <path d="M250 560 L300 620 L270 700" />
        </g>
        <g fill="#D6B77A">
          <circle cx="48" cy="90" r="1.5" />
          <circle cx="96" cy="150" r="1.2" />
          <circle cx="74" cy="230" r="1.4" />
          <circle cx="140" cy="286" r="1.7" />
          <circle cx="286" cy="70" r="1.4" />
          <circle cx="332" cy="132" r="1.2" />
          <circle cx="304" cy="198" r="1.6" />
          <circle cx="348" cy="246" r="1.3" />
          <circle cx="70" cy="520" r="1.3" />
          <circle cx="120" cy="574" r="1.5" />
          <circle cx="96" cy="650" r="1.2" />
          <circle cx="250" cy="560" r="1.4" />
          <circle cx="300" cy="620" r="1.6" />
          <circle cx="270" cy="700" r="1.3" />
        </g>
      </svg>
      <div className="sky-vignette" />
    </div>
  );
}
