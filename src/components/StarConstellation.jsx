import { useEffect, useRef, useState } from "react";
import { story } from "../data/story";
import "./StarConstellation.css";

const VIEW_W = 100;
const VIEW_H = 140;
const POINTS = [
  [50, 12],
  [26, 26],
  [74, 36],
  [40, 50],
  [16, 64],
  [62, 72],
  [82, 86],
  [44, 96],
  [18, 110],
  [68, 118],
  [46, 132],
];

const DUST = [
  [8, 9, 0.28],
  [91, 14, 0.22],
  [12, 44, 0.2],
  [90, 52, 0.22],
  [7, 84, 0.2],
  [93, 100, 0.18],
  [34, 70, 0.16],
  [76, 78, 0.16],
  [52, 102, 0.16],
  [30, 128, 0.2],
  [86, 126, 0.18],
  [58, 42, 0.14],
];

function completedPrefix(flags) {
  let count = 0;
  for (const opened of flags) {
    if (!opened) break;
    count += 1;
  }
  return count;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function threadPath(index) {
  const [x1, y1] = POINTS[index];
  const [x2, y2] = POINTS[index + 1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const bend = (index % 2 === 0 ? 1 : -1) * Math.min(12, length * 0.26);
  const cx = clamp((x1 + x2) / 2 + (-dy / length) * bend, 6, 94);
  const cy = clamp((y1 + y2) / 2 + (dx / length) * bend, 6, 136);
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function hideLivePath(node) {
  if (!node) return;
  const length = node.getTotalLength() || 1;
  node.style.strokeDasharray = `${length}`;
  node.style.strokeDashoffset = `${length}`;
}

export default function StarConstellation({ found, onFound, onContinue, onGalaxy, reduced }) {
  const flags = found?.length === story.stars.messages.length ? found : Array(story.stars.messages.length).fill(false);
  const prefix = completedPrefix(flags);
  const [active, setActive] = useState(null);
  const [phase, setPhase] = useState(() => (completedPrefix(flags) >= POINTS.length ? "finale" : "awaiting"));
  const [held, setHeld] = useState(null);
  const [drawingFrom, setDrawingFrom] = useState(null);
  const [born, setBorn] = useState(null);
  const lock = useRef(false);
  const closeRef = useRef(() => {});
  const openerRef = useRef(null);

  const lastVisible = held != null ? held - 1 : Math.min(prefix, POINTS.length - 1);
  const complete = prefix >= POINTS.length;
  const progressNumber = complete ? POINTS.length : prefix + 1;
  const showInvite = prefix === 0 && (phase === "awaiting" || (phase === "reading" && active === 0));
  const showDedication = phase === "finale" || phase === "finale-intro";
  const origin = active == null ? "50% 42%" : `${POINTS[active][0]}% ${(POINTS[active][1] / VIEW_H) * 100}%`;

  closeRef.current = () => {
    if (active == null || lock.current) return;
    const index = active;
    const isNew = index === prefix && !flags[index];
    setActive(null);
    if (!isNew) {
      setPhase(prefix >= POINTS.length ? "finale" : "awaiting");
      return;
    }
    lock.current = true;
    onFound(index);
    if (index >= POINTS.length - 1) {
      setPhase("finale-intro");
      lock.current = false;
      return;
    }
    setHeld(index + 1);
    setDrawingFrom(index);
    setPhase("drawing");
  };

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") closeRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const stage = document.getElementById("stage-root");
    if (!stage || active == null) return undefined;
    const previous = stage.style.overflow;
    stage.style.overflow = "hidden";
      openerRef.current = document.getElementById(`star-${active}`);
    document.getElementById("star-close")?.focus();
    return () => {
      stage.style.overflow = previous;
      openerRef.current?.focus({ preventScroll: true });
    };
  }, [active]);

  useEffect(() => {
    const frontier = Math.min(POINTS.length - 1, completedPrefix(flags));
    document.getElementById(`star-${frontier}`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    // Bring the saved next star into view once. Later stars scroll in as they are revealed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "drawing" || drawingFrom == null) return undefined;
    let cancelled = false;
    let raf = 0;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const path = document.getElementById("thread-live");
      const spark = document.getElementById("thread-spark");
      if (!path) {
        lock.current = false;
        setHeld(null);
        setDrawingFrom(null);
        setPhase("awaiting");
        return;
      }
      const length = path.getTotalLength() || 1;
      const duration = reduced ? 0 : 1650;
      const start = performance.now();
      const frame = (now) => {
        if (cancelled) return;
        const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        path.style.strokeDashoffset = `${length * (1 - eased)}`;
        if (spark) {
          const point = path.getPointAtLength(length * eased);
          spark.setAttribute("cx", String(point.x));
          spark.setAttribute("cy", String(point.y));
          spark.style.opacity = t > 0.96 ? "0" : "1";
        }
        if (t < 1) {
          raf = requestAnimationFrame(frame);
          return;
        }
        if (spark) spark.style.opacity = "0";
        lock.current = false;
        setHeld(null);
        setBorn(drawingFrom + 1);
        setPhase("revealing");
      };
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.opacity = "1";
      if (duration === 0) frame(performance.now());
      else raf = requestAnimationFrame(frame);
    }, reduced ? 0 : 420);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [phase, drawingFrom, reduced]);

  useEffect(() => {
    if (phase !== "revealing" || born == null) return undefined;
    const star = born;
    const focusTimer = window.setTimeout(() => {
      const node = document.getElementById(`star-${star}`);
      node?.scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
      node?.focus({ preventScroll: true });
    }, 40);
    const timer = window.setTimeout(() => {
      setBorn(null);
      setDrawingFrom(null);
      setPhase((current) => (current === "revealing" ? "awaiting" : current));
      lock.current = false;
    }, reduced ? 0 : 800);
    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(timer);
    };
  }, [phase, born, reduced]);

  useEffect(() => {
    if (phase !== "finale-intro") return undefined;
    document.querySelector(".stars-scene .sky-map")?.scrollIntoView({
      block: "start",
      behavior: reduced ? "auto" : "smooth",
    });
    const timer = window.setTimeout(() => {
      setPhase("finale");
      document.getElementById("sky-dedication")?.scrollIntoView({
        block: "nearest",
        behavior: reduced ? "auto" : "smooth",
      });
    }, reduced ? 0 : 2100);
    return () => window.clearTimeout(timer);
  }, [phase, reduced]);

  function choose(index) {
    if (index > lastVisible || index < 0) return;
    if (phase === "drawing" || lock.current) return;
    setActive(index);
    setPhase("reading");
  }

  function onStarKey(event, index) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const visible = [];
    for (let star = 0; star <= lastVisible; star += 1) visible.push(star);
    const place = visible.indexOf(index);
    if (place < 0) return;
    const forward = event.key === "ArrowLeft" || event.key === "ArrowDown";
    const next = visible[(place + (forward ? 1 : -1) + visible.length) % visible.length];
    document.getElementById(`star-${next}`)?.focus();
  }

  const mapClass = [
    "sky-map",
    active != null ? "is-reading" : "",
    active === POINTS.length - 1 ? "is-reading-last" : "",
    phase === "finale-intro" ? "is-finale-intro" : "",
    showDedication ? "is-finale" : "",
    drawingFrom === POINTS.length - 2 ? "is-last-thread" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={`scene stars-scene${complete ? " is-complete" : ""}`} id="stars" aria-labelledby="stars-title">
      <div className="chapter-inner">
        <p className="eyebrow">{story.stars.kicker}</p>
        <h2 id="stars-title" tabIndex={-1}>
          {story.stars.title}
        </h2>
        <p className="sky-progress" aria-live="polite">
          {story.stars.progress(progressNumber)}
        </p>
        {showInvite ? <p className="sky-invite">{story.stars.invite}</p> : null}

        <div className="sky-frame">
          <div className="sky-nebula" aria-hidden="true" />
          <div
            className={mapClass}
            style={{ transformOrigin: origin }}
            role="group"
            aria-label={story.stars.groupLabel}
            aria-busy={phase === "drawing" || phase === "revealing"}
          >
            <svg className="sky-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" aria-hidden="true">
              {DUST.map(([x, y, radius]) => (
                <circle key={`${x}-${y}`} className="sky-dust" cx={x} cy={y} r={radius} />
              ))}
              {Array.from({ length: Math.max(0, lastVisible) }, (_, index) => (
                <path key={`thread-${index}`} className="thread-path" d={threadPath(index)} style={{ "--i": index }} />
              ))}
              {drawingFrom != null ? (
                <>
                  <path
                    id="thread-live"
                    className="thread-path is-live"
                    d={threadPath(drawingFrom)}
                    ref={hideLivePath}
                  />
                  <circle id="thread-spark" className="thread-spark" r="1.7" cx={POINTS[drawingFrom][0]} cy={POINTS[drawingFrom][1]} />
                </>
              ) : null}
            </svg>

            {POINTS.slice(0, lastVisible + 1).map((_, index) => {
              const [x, y] = POINTS[index];
              const foundStar = Boolean(flags[index]);
              const isNext = index === prefix && !complete && held == null;
              return (
                <button
                  key={`star-${index}`}
                  id={`star-${index}`}
                  type="button"
                  className={[
                    "sky-star",
                    foundStar ? "is-found" : "",
                    isNext ? "is-next" : "",
                    active === index ? "is-active" : "",
                    index === POINTS.length - 1 ? "is-last" : "",
                    born === index ? "is-born" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ left: `${x}%`, top: `${(y / VIEW_H) * 100}%`, "--i": index }}
                  aria-label={
                    foundStar
                      ? `${story.stars.starLabel(index + 1)}، ${story.stars.titles[index]}`
                      : story.stars.starLabel(index + 1)
                  }
                  aria-pressed={active === index}
                  aria-describedby={active === index ? "star-message" : undefined}
                  disabled={phase === "drawing"}
                  onClick={() => choose(index)}
                  onKeyDown={(event) => onStarKey(event, index)}
                >
                  <span className="sky-star-halo" aria-hidden="true" />
                  <span className="sky-star-core" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>

        {showDedication ? (
          <div className={`sky-dedication${phase === "finale" ? " is-shown" : " is-entering"}`} id="sky-dedication" role="status">
            <p className="sky-name">{story.stars.dedicationName}</p>
            <p className="sky-line">{story.stars.dedication}</p>
            <button type="button" className="btn btn-solid" onClick={onContinue}>
              {story.stars.continue}
            </button>
          </div>
        ) : null}

        {onGalaxy ? (
          <div className="chapter-nav">
            <button type="button" className="btn btn-ghost" onClick={onGalaxy}>
              {story.ui.toGalaxy}
            </button>
          </div>
        ) : null}
      </div>

      {active != null ? (
        <>
          <div className="sky-scrim" onClick={() => closeRef.current()} />
          <div className="sky-overlay" role="presentation">
            <div
              className={`sky-dialog${active === POINTS.length - 1 ? " is-finale" : ""}`}
              id="star-message"
              role="dialog"
              aria-modal="true"
              aria-labelledby="star-dialog-title"
            >
              <h3 className="sky-heading" id="star-dialog-title">
                <span className="sky-kicker">{story.stars.starLabel(active + 1)}</span>
                <span className="sky-title">{story.stars.titles[active]}</span>
              </h3>
              <p className="sky-copy">{story.stars.messages[active]}</p>
              <button type="button" id="star-close" className="btn-text" onClick={() => closeRef.current()}>
                {story.stars.close}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
