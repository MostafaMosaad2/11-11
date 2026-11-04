function heartPoint(t) {
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [100 + x * 5.15, 108 - y * 5.15];
}

function buildHeart(samples) {
  const points = [];
  for (let index = 0; index < samples; index += 1) {
    points.push(heartPoint((index / samples) * Math.PI * 2));
  }
  const path = `${points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point[0].toFixed(2)} ${point[1].toFixed(2)}`)
    .join(" ")} Z`;
  return { points, path };
}

const formed = buildHeart(90);
const stars = buildHeart(18);

function miniStar(cx, cy) {
  const outer = 3.1;
  const inner = 1.25;
  const coords = [];
  for (let index = 0; index < 8; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / 4;
    coords.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return coords.join(" ");
}

export default function HeartFromStars({ steady = false, caption = "" }) {
  return (
    <div className={`heart-scene${steady ? " is-steady" : ""}`}>
      <svg viewBox="0 0 200 200" className="heart-svg" aria-hidden="true">
        <path className="heart-path" d={formed.path} />
        {stars.points.map(([x, y], index) => (
          <polygon
            key={`${x.toFixed(1)}-${y.toFixed(1)}`}
            points={miniStar(x, y)}
            className="heart-star"
            style={{ animationDelay: `${0.15 + index * 0.12}s` }}
          />
        ))}
      </svg>
      {caption ? <p className="heart-caption" aria-hidden="true">{caption}</p> : null}
    </div>
  );
}
