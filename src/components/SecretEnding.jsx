import { useEffect, useState } from "react";
import { story } from "../data/story";

function EndingSky({ phase, memories }) {
  if (phase === "reveal") return null;
  return (
    <div className="ending-sky" aria-hidden="true">
      {phase === "travel" ? (
        <div className="ending-streaks">
          {Array.from({ length: 14 }, (_, index) => (
            <i key={index} style={{ "--i": index }} />
          ))}
        </div>
      ) : null}
      {phase === "wait" || phase === "hold" || phase === "ask" ? <span className="ending-spark" /> : null}
      {phase === "travel" ? (
        <ul className="ending-memories">
          {memories.map((item) => (
            <li key={item.id}>{item.short || item.title}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function SecretEnding({ visited, onRestart, onGalaxy, reduced }) {
  const [phase, setPhase] = useState(reduced ? "ask" : "wait");
  const memories = story.memories.filter((item) => visited.includes(item.id));

  useEffect(() => {
    if (reduced) return undefined;
    const hold = window.setTimeout(() => setPhase("hold"), 900);
    const ask = window.setTimeout(() => setPhase("ask"), 2600);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(ask);
    };
  }, [reduced]);

  function more() {
    if (reduced) {
      setPhase("reveal");
      return;
    }
    setPhase("travel");
    window.setTimeout(() => setPhase("reveal"), 2100);
  }

  function skip() {
    if (phase === "travel") setPhase("reveal");
    else setPhase("ask");
  }

  const showWait = phase === "hold" || phase === "ask";

  return (
    <section className="scene ending" aria-labelledby="ending-title">
      <EndingSky phase={phase} memories={memories} />
      <div className="ending-copy" aria-live="polite">
        <h2 id="ending-title" tabIndex={-1} className={showWait ? "ending-line" : "sr-only"}>
          {story.ending.wait}
        </h2>
        {phase === "ask" ? <p className="ending-line">{story.ending.ask}</p> : null}
        {phase === "ask" ? (
          <button type="button" className="btn btn-solid" onClick={more}>
            {story.ending.more}
          </button>
        ) : null}
        {phase === "reveal" ? (
          <>
            <div className="ending-ring">
              {Array.from({ length: 11 }, (_, index) => (
                <i key={index} style={{ "--i": index }} />
              ))}
              <div className="ending-date">
                <p className="ending-mark numeral" dir="ltr">
                  {story.ending.mark}
                </p>
                <p className="ending-year numeral" dir="ltr">
                  {story.ending.year}
                </p>
              </div>
            </div>
            <p className="prose is-center ending-final">{story.ending.final}</p>
            <div className="chapter-nav">
              <button type="button" className="btn btn-solid" onClick={onRestart}>
                {story.ending.again}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onGalaxy}>
                {story.ending.galaxy}
              </button>
            </div>
          </>
        ) : null}
        {phase === "wait" || phase === "hold" || phase === "travel" ? (
          <button type="button" className="btn-text" onClick={skip}>
            {story.ui.skip}
          </button>
        ) : null}
      </div>
    </section>
  );
}
