import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const PETALS = [
  { left: "7%", delay: "0s", duration: "14s", size: 12, rotate: -18 },
  { left: "18%", delay: "2.4s", duration: "16s", size: 16, rotate: 16 },
  { left: "34%", delay: "5s", duration: "15s", size: 10, rotate: 8 },
  { left: "58%", delay: "1.2s", duration: "17s", size: 13, rotate: -24 },
  { left: "72%", delay: "3.6s", duration: "13s", size: 15, rotate: 22 },
  { left: "84%", delay: "0.8s", duration: "16s", size: 11, rotate: -8 },
  { left: "93%", delay: "4.5s", duration: "14s", size: 9, rotate: 14 },
];

export default function Petals() {
  const reduced = usePrefersReducedMotion();
  if (reduced) return null;

  return (
    <div className="petal-layer" aria-hidden="true">
      {PETALS.map((petal) => (
        <span
          key={`${petal.left}-${petal.delay}`}
          className="petal"
          style={{
            left: petal.left,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
          }}
        >
          <i
            style={{
              width: petal.size,
              height: petal.size * 1.35,
              transform: `rotate(${petal.rotate}deg)`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
