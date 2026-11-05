import { useEffect, useMemo, useRef, useState } from "react";
import { playPaper } from "../audio/engine";
import { story } from "../data/story";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export default function HiddenLoveLetter({ onNext, onGalaxy }) {
  const reduced = usePrefersReducedMotion();
  const lines = useMemo(() => story.letter.body.split("\n"), []);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const timer = useRef(0);
  const done = count >= lines.length;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return undefined;
    if (reduced) {
      timer.current = window.setTimeout(() => setCount(lines.length), 0);
      return () => window.clearTimeout(timer.current);
    }
    let current = 0;
    const step = () => {
      current += 1;
      setCount(current);
      if (current < lines.length) {
        const pause = lines[current - 1] === "" ? 260 : 480;
        timer.current = window.setTimeout(step, pause);
      }
    };
    timer.current = window.setTimeout(step, 860);
    return () => window.clearTimeout(timer.current);
  }, [lines, open, reduced]);

  function openLetter() {
    if (open) return;
    playPaper();
    setOpen(true);
  }

  function skip() {
    window.clearTimeout(timer.current);
    setCount(lines.length);
  }

  return (
    <section className="scene letter-scene" aria-labelledby="letter-title">
      <div className="chapter-inner">
        <p className="eyebrow">{story.letter.kicker}</p>
        <h2 id="letter-title" tabIndex={-1}>
          {story.letter.title}
        </h2>
        <div className={`letter-layout${open ? " is-open" : ""}`}>
          <div className="letter-slot">
            <article className="letter-sheet">
              <p className="sr-only">{story.letter.body}</p>
              <div className="letter-body" aria-hidden="true">
                {lines.slice(0, count).map((line, index) => (
                  <span className="letter-line" key={`${index}-${line}`}>
                    {line || "\u00A0"}
                  </span>
                ))}
              </div>
            </article>
          </div>
          <button type="button" className="envelope-button" onClick={openLetter} disabled={open}>
            <span className="envelope" aria-hidden="true">
              <span className="envelope-flap" />
              <span className="envelope-body">
                <span className="seal" />
              </span>
            </span>
            <span className="envelope-caption">{story.letter.seal}</span>
            {open ? null : <span className="envelope-hint">{story.letter.hint}</span>}
          </button>
        </div>
        {open ? (
          <div className="chapter-nav">
            {done ? null : (
              <button type="button" className="btn-text" onClick={skip}>
                {story.letter.skip}
              </button>
            )}
            <button type="button" className="btn btn-solid" onClick={onNext}>
              {story.ui.next}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onGalaxy}>
              {story.ui.toGalaxy}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
