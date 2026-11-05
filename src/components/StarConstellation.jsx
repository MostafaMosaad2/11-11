import { useEffect, useState } from "react";
import { starLayout, story } from "../data/story";
import HeartFromStars from "./HeartFromStars";
import StarIcon from "./StarIcon";

const LINES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 4],
  [3, 5],
  [4, 6],
  [5, 7],
  [6, 8],
  [7, 9],
  [8, 10],
  [9, 10],
];

function point(index) {
  return {
    x: Number.parseFloat(starLayout[index].left),
    y: Number.parseFloat(starLayout[index].top),
  };
}

export default function StarConstellation({ found, onFound, onContinue, reduced }) {
  const flags = found?.length === story.stars.messages.length ? found : Array(story.stars.messages.length).fill(false);
  const [active, setActive] = useState(null);
  const count = flags.filter(Boolean).length;
  const complete = count === story.stars.messages.length;

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const stage = document.getElementById("stage-root");
    if (!stage || active == null) return undefined;
    const previous = stage.style.overflow;
    stage.style.overflow = "hidden";
    const opener = document.getElementById(`star-${active}`);
    document.getElementById("star-close")?.focus();
    return () => {
      stage.style.overflow = previous;
      opener?.focus();
    };
  }, [active]);

  function choose(index) {
    setActive(index);
    onFound(index);
  }

  function onStarKey(event, index) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const forward = event.key === "ArrowLeft" || event.key === "ArrowDown";
    const next = (index + (forward ? 1 : -1) + starLayout.length) % starLayout.length;
    document.getElementById(`star-${next}`)?.focus();
  }

  return (
    <section className="scene stars-scene" id="stars" aria-labelledby="stars-title">
      <div className="chapter-inner">
        <p className="eyebrow">{story.stars.kicker}</p>
        <h2 id="stars-title" tabIndex={-1}>
          {story.stars.title}
        </h2>
        <p className="progress" aria-live="polite">
          {story.stars.progress(count)}
        </p>
        <div className={`constellation${complete ? " is-complete" : ""}`} role="group" aria-label={story.stars.groupLabel}>
          <svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {LINES.map(([from, to]) => {
              const start = point(from);
              const end = point(to);
              return (
                <line
                  key={`${from}-${to}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  pathLength="1"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          {starLayout.map((spot, index) => (
            <button
              key={story.stars.messages[index]}
              id={`star-${index}`}
              type="button"
              className={`star-btn${flags[index] ? " is-found" : ""}${active === index ? " is-active" : ""}`}
              style={{ top: spot.top, left: spot.left, "--star-size": `${spot.size}px` }}
              aria-label={story.stars.starLabel(index + 1)}
              aria-pressed={active === index}
              aria-describedby={active === index ? "star-message" : undefined}
              onClick={() => choose(index)}
              onKeyDown={(event) => onStarKey(event, index)}
            >
              <StarIcon variant={spot.variant} />
            </button>
          ))}
        </div>

        {active == null ? (
          complete ? null : (
            <div className="star-card" id="star-message">
              <p className="star-hint">{story.stars.hint}</p>
            </div>
          )
        ) : (
          <div className="star-overlay" role="presentation" onClick={() => setActive(null)}>
            <div
              className="star-card star-dialog"
              id="star-message"
              role="dialog"
              aria-modal="true"
              aria-labelledby="star-dialog-title"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="star-kicker" id="star-dialog-title">
                {story.stars.starLabel(active + 1)}
              </p>
              <p className="star-copy">{story.stars.messages[active]}</p>
              <button type="button" id="star-close" className="btn-text" onClick={() => setActive(null)}>
                {story.stars.close}
              </button>
            </div>
          </div>
        )}

        {complete ? (
          <div className="unlock" role="status">
            {reduced ? null : <HeartFromStars steady />}
            <div className="unlock-line" aria-hidden="true" />
            <p>{story.stars.unlocked}</p>
            <button type="button" className="btn btn-solid" onClick={onContinue}>
              {story.stars.continue}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
