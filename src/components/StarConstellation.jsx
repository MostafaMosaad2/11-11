import { useEffect, useState } from "react";
import { starLayout, story } from "../data/story";
import { scrollToId } from "../utils/scroll";
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

export default function StarConstellation({ onUnlock, reduced }) {
  const [found, setFound] = useState(() => Array(story.stars.messages.length).fill(false));
  const [active, setActive] = useState(null);
  const count = found.filter(Boolean).length;
  const complete = count === story.stars.messages.length;

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (found.every(Boolean)) onUnlock();
  }, [found, onUnlock]);

  function choose(index) {
    setActive(index);
    setFound((current) => {
      if (current[index]) return current;
      const next = current.slice();
      next[index] = true;
      return next;
    });
  }

  function onStarKey(event, index) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }
    event.preventDefault();
    const forward = event.key === "ArrowLeft" || event.key === "ArrowDown";
    const next = (index + (forward ? 1 : -1) + starLayout.length) % starLayout.length;
    document.getElementById(`star-${next}`)?.focus();
  }

  function continueStory() {
    scrollToId("wish", reduced);
    document.getElementById("wish-title")?.focus({ preventScroll: true });
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
        <div className="constellation" role="group" aria-label={story.stars.groupLabel}>
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
              className={`star-btn${found[index] ? " is-found" : ""}${active === index ? " is-active" : ""}`}
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

        <div className="star-card" id="star-message" role="status">
          {active == null ? (
            <p className="star-hint">{story.stars.hint}</p>
          ) : (
            <>
              <p className="star-kicker">{story.stars.starLabel(active + 1)}</p>
              <p className="star-copy">{story.stars.messages[active]}</p>
              <button type="button" className="btn-text" onClick={() => setActive(null)}>
                {story.stars.close}
              </button>
            </>
          )}
        </div>

        {complete ? (
          <div className="unlock" role="status">
            <div className="unlock-line" aria-hidden="true" />
            <p>{story.stars.unlocked}</p>
            <button type="button" className="btn btn-gold" onClick={continueStory}>
              {story.stars.continue}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
