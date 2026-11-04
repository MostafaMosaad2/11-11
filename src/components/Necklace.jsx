function starPoints(cx, cy, outer, inner) {
  const coords = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    coords.push(`${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`);
  }
  return coords.join(" ");
}

function chainLinks() {
  const links = [];
  const count = 19;
  for (let index = 0; index < count; index += 1) {
    const angle = Math.PI * 0.16 + ((Math.PI * 0.68) * index) / (count - 1);
    const cx = 150 + Math.cos(angle) * 98;
    const cy = 34 + Math.sin(angle) * 72;
    const rotation = (angle * 180) / Math.PI + 90;
    links.push({ cx, cy, rotation, index });
  }
  return links;
}

const LINKS = chainLinks();

export default function Necklace() {
  return (
    <svg className="necklace-svg" viewBox="0 0 300 250" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="chain-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F8F1DE" />
          <stop offset="42%" stopColor="#D6B77A" />
          <stop offset="100%" stopColor="#8C6734" />
        </linearGradient>
        <linearGradient id="pendant-gold" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#FFF8E8" />
          <stop offset="38%" stopColor="#E4C98A" />
          <stop offset="72%" stopColor="#B89045" />
          <stop offset="100%" stopColor="#F3E2B4" />
        </linearGradient>
        <radialGradient id="pendant-glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#F8F1DE" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#D6B77A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D6B77A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="150" cy="168" rx="34" ry="10" fill="rgba(214,183,122,0.18)" />
      <circle cx="150" cy="162" r="46" fill="url(#pendant-glow)" />

      {LINKS.map((link) => (
        <ellipse
          key={link.index}
          cx={link.cx}
          cy={link.cy}
          rx="4.3"
          ry="6.4"
          fill="none"
          stroke="url(#chain-gold)"
          strokeWidth="1.5"
          transform={`rotate(${link.rotation} ${link.cx} ${link.cy})`}
        />
      ))}

      <rect x="147.2" y="104" width="5.6" height="22" rx="2.4" fill="url(#chain-gold)" />
      <circle cx="150" cy="128" r="3.2" fill="#F8F1DE" />
      <polygon points={starPoints(150, 164, 32, 13.5)} fill="url(#pendant-gold)" />
      <polygon points={starPoints(150, 164, 16, 6.5)} fill="#FFF8E8" opacity="0.55" />
      <circle cx="140" cy="152" r="2.2" fill="#FFF8E8" />
    </svg>
  );
}
