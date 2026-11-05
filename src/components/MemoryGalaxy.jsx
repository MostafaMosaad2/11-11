import { useEffect, useId, useRef } from "react";
import { story } from "../data/story";
import Starfield from "./Starfield";

const POS = [
  { x: 50, y: 18 },
  { x: 30, y: 36 },
  { x: 70, y: 34 },
  { x: 50, y: 52 },
  { x: 28, y: 68 },
  { x: 72, y: 66 },
  { x: 38, y: 82 },
  { x: 64, y: 80 },
];

function starPoints(cx, cy, outer, inner, points = 5) {
  const coords = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    coords.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return coords.join(" ");
}

function CelestialIcon({ kind }) {
  const raw = useId().replace(/:/g, "");
  const glow = `glow-${raw}`;
  return (
    <svg className="body-svg" viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6df" stopOpacity="0.95" />
          <stop offset="42%" stopColor="#d6b77a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#d6b77a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="28" fill={`url(#${glow})`} />
      {kind === "pulse" && <circle className="pulse-ring" cx="40" cy="40" r="16" fill="none" stroke="#d6b77a" strokeWidth="1.2" />}
      {kind === "fade" && (
        <circle cx="40" cy="40" r="18" fill="none" stroke="#d6b77a" strokeWidth="1" strokeDasharray="3 4" opacity="0.7" />
      )}
      {kind === "binary" && (
        <g className="orbit-spin">
          <circle cx="40" cy="40" r="15" fill="none" stroke="rgba(214,183,122,0.45)" />
          <circle cx="27" cy="40" r="4.2" fill="#f8f1de" />
          <circle cx="54" cy="36" r="2.6" fill="#d6b77a" />
        </g>
      )}
      {kind === "letter" && (
        <path d="M24 30h32v22H24z M24 30l16 12 16-12" fill="none" stroke="#f3e6c4" strokeWidth="1.6" />
      )}
      {kind === "cluster" && (
        <>
          <polygon points={starPoints(30, 46, 7, 3)} fill="#f3e6c4" />
          <polygon points={starPoints(48, 44, 5, 2)} fill="#d6b77a" />
          <polygon points={starPoints(40, 28, 4, 1.6)} fill="#fff8e8" />
        </>
      )}
      {kind === "wish" && (
        <>
          <circle cx="40" cy="40" r="16" fill="none" stroke="#d6b77a" strokeWidth="1.3" />
          <polygon points={starPoints(40, 40, 7, 3)} fill="#fff8e8" />
        </>
      )}
      {kind === "gift" && (
        <>
          <rect x="26" y="34" width="28" height="18" rx="2" fill="none" stroke="#d6b77a" strokeWidth="1.4" />
          <path d="M26 40h28" stroke="#d6b77a" strokeWidth="1.2" />
          <polygon points={starPoints(40, 30, 5, 2)} fill="#f8f1de" />
        </>
      )}
      {(kind === "star" || kind === "pulse" || kind === "fade" || kind === "binary") && (
        <polygon points={starPoints(40, 40, kind === "fade" ? 8 : 12, kind === "fade" ? 3.2 : 4.6)} fill="#fff8e8" />
      )}
    </svg>
  );
}

function targetOf(node) {
  if (node.scene === "memory") return { scene: "memory", memoryId: node.id };
  return { scene: node.scene };
}

export default function MemoryGalaxy({ visited, starsComplete, reduced, onOpen }) {
  const offsetRef = useRef({ x: 0, y: 0 });
  const layerRef = useRef(null);
  const stageRef = useRef(null);
  const pointer = useRef(null);
  const suppressClick = useRef(false);
  const lockedRef = useRef(false);
  const frameRef = useRef(0);

  const nodes = [
    ...story.memories.map((memory) => ({
      id: memory.id,
      scene: "memory",
      label: memory.short || memory.title,
      date: memory.date,
      kind: memory.kind,
      unlock: true,
    })),
    { id: "letter", scene: "letter", label: story.letter.nav, kind: "letter", unlock: visited.includes("memory-4") },
    { id: "stars", scene: "stars", label: story.stars.nav, kind: "cluster", unlock: visited.includes("letter") },
    {
      id: "wish",
      scene: "wish",
      label: story.wish.nav,
      kind: "wish",
      unlock: visited.includes("stars") && starsComplete,
    },
    { id: "gift", scene: "gift", label: story.gift.nav, kind: "gift", unlock: visited.includes("wish") },
  ].filter((node) => node.unlock);

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), []);

  function paint(x, y, scale = 1) {
    offsetRef.current = { x, y };
    if (layerRef.current) {
      layerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }
  }

  function openNode(node, animated, element) {
    if (lockedRef.current) return;
    if (!animated || reduced) {
      onOpen(targetOf(node));
      return;
    }
    const stage = stageRef.current?.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    if (!stage) {
      onOpen(targetOf(node));
      return;
    }
    const dx = stage.left + stage.width / 2 - (rect.left + rect.width / 2);
    const dy = stage.top + stage.height / 2 - (rect.top + rect.height / 2);
    const fromX = offsetRef.current.x;
    const fromY = offsetRef.current.y;
    const toX = fromX + dx;
    const toY = fromY + dy;
    lockedRef.current = true;
    element.classList.add("is-focus");
    const start = performance.now();
    const run = (now) => {
      const t = Math.min(1, (now - start) / 680);
      const eased = 1 - (1 - t) ** 3;
      paint(fromX + (toX - fromX) * eased, fromY + (toY - fromY) * eased, 1 + 0.18 * eased);
      if (t < 1) frameRef.current = window.requestAnimationFrame(run);
      else onOpen(targetOf(node));
    };
    frameRef.current = window.requestAnimationFrame(run);
  }

  function onPointerDown(event) {
    if (lockedRef.current) return;
    pointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId || lockedRef.current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (Math.hypot(dx, dy) > 8) current.moved = true;
    const x = Math.max(-110, Math.min(110, current.ox + dx));
    const y = Math.max(-80, Math.min(80, current.oy + dy));
    if (layerRef.current) layerRef.current.style.transition = "none";
    paint(x, y);
  }

  function onPointerUp(event) {
    const current = pointer.current;
    pointer.current = null;
    if (!current || current.id !== event.pointerId) return;
    if (current.moved) {
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }
  }

  return (
    <section className="scene galaxy" aria-labelledby="galaxy-title">
      <Starfield offsetRef={offsetRef} reduced={reduced} />
      <header className="galaxy-copy">
        <p className="eyebrow">{story.galaxy.kicker}</p>
        <h2 id="galaxy-title" tabIndex={-1}>
          {story.galaxy.title}
        </h2>
        <p className="galaxy-hint">{story.galaxy.hint}</p>
      </header>
      <div
        className="galaxy-stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="galaxy-layer" ref={layerRef} role="group" aria-label={story.galaxy.title}>
          {nodes.map((node, index) => {
            const spot = POS[index] ?? POS[POS.length - 1];
            return (
              <button
                key={node.id}
                type="button"
                className={`celestial${visited.includes(node.id) ? " is-visited" : ""}`}
                data-kind={node.kind}
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                onClick={(event) => {
                  if (suppressClick.current) return;
                  openNode(node, true, event.currentTarget);
                }}
              >
                <span className="celestial-body">
                  <CelestialIcon kind={node.kind} />
                </span>
                <span className="celestial-label">{node.label}</span>
                {node.date ? <span className="celestial-date">{node.date}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
      <nav className="chapter-fallback" aria-label={story.galaxy.listLabel}>
        {nodes.map((node) => (
          <button key={`list-${node.id}`} type="button" onClick={() => openNode(node, false)}>
            {node.label}
          </button>
        ))}
      </nav>
    </section>
  );
}
