import { useEffect, useRef, useState } from "react";
import { story } from "../data/story";
import { visualQuality } from "../utils/quality";
import "./SecretEnding.css";

const MARK = [
  [18, 22],
  [18, 42],
  [18, 62],
  [34, 22],
  [34, 42],
  [34, 62],
  [48, 28],
  [58, 56],
  [72, 22],
  [72, 62],
  [86, 42],
];

function ringSpot(index) {
  const angle = (index / MARK.length) * Math.PI * 2 - Math.PI / 2;
  return [50 + Math.cos(angle) * 34, 48 + Math.sin(angle) * 30];
}

function butterflies() {
  const quality = visualQuality();
  if (quality === "low") return 3;
  if (quality === "high") return 7;
  return 5;
}

export default function SecretEnding({ stars, onRestart, onGalaxy, reduced }) {
  const copy = story.ending;
  const timers = useRef([]);
  const token = useRef(0);
  const [phase, setPhase] = useState(reduced ? "ask" : "wait");
  const [recap, setRecap] = useState(reduced ? copy.recap.length : 0);
  const [lines, setLines] = useState(0);
  const formed = phase === "form" || phase === "words" || phase === "done" || phase === "return";
  const showFlower = phase === "flower" || phase === "stars" || formed;
  const showStars = phase === "stars" || formed;

  useEffect(() => {
    if (reduced) return undefined;
    const hold = window.setTimeout(() => setPhase("hold"), 900);
    const ask = window.setTimeout(() => setPhase("ask"), 2400);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(ask);
    };
  }, [reduced]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  function wait(ms, id) {
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => resolve(token.current === id), ms);
      timers.current.push(timer);
    });
  }

  async function play() {
    const id = token.current + 1;
    token.current = id;
    if (reduced) {
      setRecap(copy.recap.length);
      setLines(copy.lines.length);
      setPhase("done");
      return;
    }
    setPhase("journey");
    for (let index = 0; index < copy.recap.length; index += 1) {
      if (!(await wait(index === 0 ? 400 : 900, id))) return;
      setRecap(index + 1);
    }
    if (!(await wait(700, id))) return;
    setPhase("flower");
    if (!(await wait(1600, id))) return;
    setPhase("stars");
    if (!(await wait(1500, id))) return;
    setPhase("form");
    if (!(await wait(1700, id))) return;
    setPhase("words");
    for (let index = 0; index < copy.lines.length; index += 1) {
      if (!(await wait(index === 0 ? 500 : 1400, id))) return;
      setLines(index + 1);
    }
    if (!(await wait(700, id))) return;
    if (token.current === id) setPhase("done");
  }

  function finish() {
    token.current += 1;
    timers.current.forEach((id) => window.clearTimeout(id));
    setRecap(copy.recap.length);
    setLines(copy.lines.length);
    setPhase("done");
  }
  function restart() {
    token.current += 1;
    setPhase("return");
    window.setTimeout(() => onRestart(), reduced ? 0 : 900);
  }

  const showWait = phase === "hold" || phase === "ask";

  return (
    <section className="scene ending finale" data-phase={phase} aria-labelledby="ending-title">
      <div className="finale-sky" aria-hidden="true">
        {showStars
          ? MARK.map((spot, index) => {
              const place = formed ? spot : ringSpot(index);
              const lit = Array.isArray(stars) && stars[index];
              return (
                <i
                  key={index}
                  className={`finale-star${lit ? " is-lit" : ""}`}
                  style={{ left: `${place[0]}%`, top: `${place[1]}%` }}
                />
              );
            })
          : null}
        {showFlower ? <FinaleFlower /> : null}
        {phase === "journey" ? <span className="finale-light" /> : null}
      </div>

      <div className="ending-copy" aria-live="polite">
        <h2 id="ending-title" tabIndex={-1} className={showWait ? "ending-line" : "sr-only"}>
          {copy.wait}
        </h2>
        {phase === "ask" ? <p className="ending-line">{copy.ask}</p> : null}
        {phase === "ask" ? (
          <button type="button" className="btn btn-solid" onClick={play}>
            {copy.watch}
          </button>
        ) : null}

        {phase === "journey" && recap > 0 ? (
          <p className="finale-label">
            <span>{copy.recap[recap - 1].label}</span>
            <small>{copy.recap[recap - 1].date}</small>
          </p>
        ) : null}

        {formed ? (
          <div className="finale-mark">
            <p className="ending-mark numeral" dir="ltr">
              11 / 11
            </p>
            <p className="finale-name">{copy.name}</p>
          </div>
        ) : null}

        {lines > 0 ? (
          <div className="finale-lines">
            {copy.lines.slice(0, lines).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}

        {phase === "done" ? (
          <>
            <p className="finale-date numeral" dir="ltr">
              {copy.dateLine}
            </p>
            <p className="ending-dedication">{copy.dedication}</p>
            <div className="chapter-nav">
              <button type="button" className="btn btn-solid" onClick={restart}>
                {copy.again}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onGalaxy}>
                {copy.galaxy}
              </button>
            </div>
          </>
        ) : null}

        {phase === "journey" || phase === "flower" || phase === "stars" || phase === "form" || phase === "words" ? (
          <button type="button" className="btn-text" onClick={finish}>
            {story.ui.skip}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function FinaleFlower() {
  return (
    <div className="finale-flower" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        {Array.from({ length: 12 }, (_, index) => (
          <ellipse
            key={index}
            cx="60"
            cy="28"
            rx="8"
            ry="18"
            fill={index % 2 ? "#c9841c" : "#e2b23c"}
            transform={`rotate(${index * 30} 60 60)`}
          />
        ))}
        <circle cx="60" cy="60" r="14" fill="#4a2914" />
      </svg>
      {Array.from({ length: butterflies() }, (_, index) => (
        <span key={index} className="finale-butterfly" style={{ "--i": index }} />
      ))}
    </div>
  );
}
