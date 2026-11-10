import { useEffect, useId, useRef, useState } from "react";
import { playPaper, restoreAmbient, softenAmbient } from "../audio/engine";
import { story } from "../data/story";
import "./SecretEnding.css";

const THREAD =
  "M50 8 C58 16 52 18 46 22 C36 30 28 36 34 42 C44 52 74 52 66 60 C56 70 40 72 48 80 C54 86 52 94 50 96";

const NODES = [
  { x: 46, y: 22 },
  { x: 34, y: 42 },
  { x: 66, y: 60 },
  { x: 48, y: 80 },
];

function stem(x, y, count = 4, gap = 12) {
  return Array.from({ length: count }, (_, index) => [x, y + index * gap]);
}

const DATE_POINTS = [
  [16, 34],
  ...stem(22, 26, 4, 13),
  [34, 34],
  ...stem(40, 26, 4, 13),
  [50, 74],
  [54, 60],
  [58, 46],
  [62, 32],
  [70, 34],
  ...stem(76, 26, 4, 13),
  [84, 34],
  ...stem(90, 26, 4, 13),
];

const SKY_STARS = DATE_POINTS.map((point, index, all) => {
  const angle = -Math.PI / 2 + (index / all.length) * Math.PI * 2;
  const ring = 20 + (index % 3) * 7;
  return {
    x: point[0],
    y: point[1],
    sx: 50 + Math.cos(angle) * ring * 0.82,
    sy: 48 + Math.sin(angle) * ring * 0.6,
    hx: 8 + (index / (all.length - 1)) * 84,
    hy: 16 + Math.sin((index / (all.length - 1)) * Math.PI) * 10,
  };
});

function starPlace(star, mark) {
  if (mark === "date") return [star.x, star.y];
  if (mark === "name" || mark === "both") return [star.hx, star.hy];
  return [star.sx, star.sy];
}

function FinaleSky({ phase, shown, mark, paused, reduced, starWord, flowerSrc }) {
  const raw = useId().replace(/:/g, "");
  const glowId = `finale-glow-${raw}`;
  const moving = phase === "memories" && !paused && !reduced;
  const [flowerOk, setFlowerOk] = useState(true);

  return (
    <div className="finale-sky">
      <div className="finale-sky-inner">
        <svg className="finale-thread" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path className="finale-thread-glow" d={THREAD} pathLength="1" />
          <path className="finale-thread-path" d={THREAD} pathLength="1" />
          {moving ? (
            <circle r="2.15" fill="#fff8ea" filter={`url(#${glowId})`}>
              <animateMotion dur="8.5s" fill="freeze" path={THREAD} />
            </circle>
          ) : null}
        </svg>

        <div className="memory-nodes" aria-hidden="true">
          {NODES.map((node, index) => {
            const lit = phase === "sky" || phase === "return" || (phase === "memories" && shown > index);
            return (
              <i
                key={`${node.x}-${node.y}`}
                className={`memory-node${lit ? " is-on" : ""}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              />
            );
          })}
        </div>

        {phase === "arrive" || phase === "invite" || phase === "return" ? (
          <span className="finale-seed" aria-hidden="true" />
        ) : null}

        {phase === "sky" || phase === "return" ? (
          <div className="finale-constellation">
            <div className="finale-starfield" aria-hidden="true">
              {SKY_STARS.map((star) => {
                const [x, y] = starPlace(star, mark);
                return <i key={`${star.x}-${star.y}`} className="sky-star" style={{ left: `${x}%`, top: `${y}%` }} />;
              })}
            </div>
            <span className="her-star-wrap">
              <i className="her-star" aria-hidden="true" />
              {starWord ? <span className="her-caption">{starWord}</span> : null}
            </span>
            {flowerOk ? (
              <img className="finale-far-flower" src={flowerSrc} alt="" onError={() => setFlowerOk(false)} />
            ) : null}
            <div className="finale-sky-copy">
              {mark === "date" || mark === "both" ? (
                <p className="ending-mark finale-date-mark" dir="ltr">
                  {story.ending.mark}
                </p>
              ) : null}
              {mark === "name" || mark === "both" ? <p className="finale-sky-name">{story.ending.name}</p> : null}
            </div>
            {!reduced && phase === "sky" ? (
              <div className="finale-motes" aria-hidden="true">
                {Array.from({ length: 6 }, (_, index) => (
                  <i key={index} style={{ "--n": index }} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StoryBook({ open, turning, page, turningFrom, allPages, blank, center, pages, title, showDust, children }) {
  if (allPages) {
    return (
      <div className="book is-flat">
        <p className="book-flat-title">{title}</p>
        <ol className="book-flat-pages">
          {pages.map((item) => (
            <li key={item.date}>
              <p className="book-date">{item.date}</p>
              <p className="book-line">{item.line}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const face = pages[page] ?? pages[0];
  const leaf = turningFrom == null ? null : pages[turningFrom];

  return (
    <div className={`book${open ? " is-open" : ""}${turning ? " is-turning" : ""}${blank ? " is-blank" : ""}`}>
      <div className="book-glow" aria-hidden="true" />
      {showDust ? (
        <div className="book-dust" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <i key={index} style={{ "--n": index }} />
          ))}
        </div>
      ) : null}
      <div className="book-shell">
        <div
          className={`book-page${blank ? " is-blank" : ""}${center ? " is-rise" : ""}`}
          aria-hidden={open ? undefined : true}
        >
          {blank ? (
            children
          ) : (
            <>
              <p className="book-date">{face.date}</p>
              <p className="book-line">{face.line}</p>
            </>
          )}
        </div>
        {leaf ? (
          <div className="book-leaf" key={turningFrom}>
            <p className="book-date">{leaf.date}</p>
            <p className="book-line">{leaf.line}</p>
          </div>
        ) : null}
        <div className="book-cover" aria-hidden={open ? true : undefined}>
          <svg className="book-ornament" viewBox="0 0 48 16" aria-hidden="true">
            <path d="M24 1.5 26.2 7.2 32 8 26.2 8.8 24 14.5 21.8 8.8 16 8 21.8 7.2Z" fill="#f0deb4" />
          </svg>
          <span>{title}</span>
        </div>
      </div>
    </div>
  );
}

export default function SecretEnding({ onRestart, onGalaxy, reduced }) {
  const copy = story.ending;
  const run = useRef(0);
  const exitTimer = useRef(0);
  const leaving = useRef(false);
  const [phase, setPhase] = useState(reduced ? "invite" : "arrive");
  const [shown, setShown] = useState(reduced ? 2 : 0);
  const [paused, setPaused] = useState(false);
  const [nameOn, setNameOn] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookPage, setBookPage] = useState(0);
  const [turningFrom, setTurningFrom] = useState(null);
  const [showAllPages, setShowAllPages] = useState(false);
  const [mark, setMark] = useState("gather");
  const [flowerOk, setFlowerOk] = useState(true);
  const [starWord, setStarWord] = useState("");

  useEffect(
    () => () => {
      window.clearTimeout(exitTimer.current);
      restoreAmbient();
    },
    [],
  );

  useEffect(() => {
    if (reduced || paused || phase === "invite" || phase === "return") return undefined;
    const id = run.current + 1;
    run.current = id;
    const timers = [];
    const live = () => run.current === id;
    const wait = (ms) =>
      new Promise((resolve) => {
        const timer = window.setTimeout(() => resolve(live()), ms);
        timers.push(timer);
      });

    const go = (next) => {
      if (!live()) return;
      setNameOn(false);
      setShowAllPages(false);
      setTurningFrom(null);
      if (next === "book") {
        setBookOpen(false);
        setBookPage(0);
      }
      if (next === "sky") setMark("gather");
      setShown(next === "blank" ? 1 : 0);
      setPhase(next);
    };

    async function play() {
      if (phase === "arrive") {
        if (!(await wait(900))) return;
        if (!live()) return;
        setShown(1);
        if (!(await wait(1900))) return;
        if (!live()) return;
        setShown(2);
        if (!(await wait(1600))) return;
        if (live()) setPhase("invite");
        return;
      }

      if (phase === "memories") {
        const gaps = [2800, 2800, 3300, 3400];
        for (let index = 1; index <= 4; index += 1) {
          if (!live()) return;
          setShown(index);
          if (!(await wait(gaps[index - 1]))) return;
        }
        if (!live()) return;
        setShown(5);
        if (!(await wait(1800))) return;
        if (!live()) return;
        setShown(6);
        if (!(await wait(2300))) return;
        go("flower");
        return;
      }

      if (phase === "flower") {
        if (!live()) return;
        setNameOn(true);
        if (!(await wait(2500))) return;
        const after = [1700, 1600, 1900, 2200];
        for (let index = 0; index < after.length; index += 1) {
          if (!live()) return;
          setShown(index + 4);
          if (!(await wait(after[index]))) return;
        }
        go("book");
        return;
      }

      if (phase === "book") {
        setShowAllPages(false);
        setBookOpen(false);
        setBookPage(0);
        setTurningFrom(null);
        if (!(await wait(900))) return;
        if (!live()) return;
        setBookOpen(true);
        playPaper();
        if (!(await wait(1800))) return;
        for (let next = 1; next <= 3; next += 1) {
          if (!live()) return;
          setTurningFrom(next - 1);
          setBookPage(next);
          if (!(await wait(1150))) return;
          if (!live()) return;
          setTurningFrom(null);
          if (!(await wait(1750))) return;
        }
        go("blank");
        return;
      }

      if (phase === "blank") {
        setShown(1);
        if (!(await wait(2400))) return;
        if (!live()) return;
        setStarWord("");
        setShown(0);
        setPhase("rise");
        return;
      }

      if (phase === "rise") {
        setShown(1);
        if (!(await wait(900))) return;
        if (!live()) return;
        setShown(2);
        if (!(await wait(1300))) return;
        if (!live()) return;
        setShown(3);
        if (!(await wait(2800))) return;
        go("sky");
        return;
      }

      if (phase === "sky") {
        setMark("gather");
        if (!(await wait(900))) return;
        if (!live()) return;
        setMark("date");
        if (!(await wait(3600))) return;
        if (!live()) return;
        setMark("name");
        if (!(await wait(4000))) return;
        go("vow");
        return;
      }

      if (phase === "vow") {
        for (let index = 0; index < copy.vow.length; index += 1) {
          if (!live()) return;
          setShown(index + 1);
          if (!(await wait(copy.vow[index].hold || 1800))) return;
        }
      }
    }

    play();
    return () => {
      run.current += 1;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [copy.vow, paused, phase, reduced]);

  const stage = reduced && phase === "arrive" ? "invite" : phase;
  const view = !reduced
    ? shown
    : stage === "memories"
      ? 6
      : stage === "flower"
        ? 7
        : stage === "blank"
          ? 4
          : stage === "rise"
            ? 3
            : stage === "vow" || stage === "return"
              ? copy.vow.length
              : Math.max(shown, stage === "invite" ? 2 : 0);
  const scriptOn = nameOn || (reduced && stage === "flower");
  const flatPages = stage === "book" && (showAllPages || reduced);
  const coverOpen = bookOpen || reduced || stage !== "book";
  const skyMark = reduced && (stage === "sky" || stage === "return") ? "both" : mark;

  useEffect(() => {
    if (stage !== "vow" || view < 1) return undefined;
    const node = document.getElementById("vow-latest");
    const root = document.getElementById("stage-root");
    if (!node || !root) return undefined;
    const top = node.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - root.clientHeight * 0.42;
    root.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
    return undefined;
  }, [reduced, stage, view]);

  function beginJourney() {
    softenAmbient();
    setPaused(false);
    setShown(0);
    setNameOn(false);
    setMark("gather");
    setPhase("memories");
  }

  function skip() {
    if (phase === "arrive") {
      setShown(2);
      setPhase("invite");
      return;
    }
    setPaused(true);
    if (phase === "memories") setShown(6);
    if (phase === "flower") {
      setNameOn(true);
      setShown(7);
    }
    if (phase === "book") {
      setBookOpen(true);
      setTurningFrom(null);
      setBookPage(3);
      setShowAllPages(true);
    }
    if (phase === "blank") setShown(4);
    if (phase === "rise") setShown(3);
    if (phase === "sky") setMark("both");
    if (phase === "vow") setShown(copy.vow.length);
  }

  function advance() {
    const order = ["memories", "flower", "book", "blank", "rise", "sky", "vow"];
    const index = order.indexOf(phase);
    if (index < 0 || index >= order.length - 1) return;
    const next = order[index + 1];
    setPaused(false);
    setShowAllPages(false);
    setTurningFrom(null);
    setNameOn(next === "flower" && reduced);
    if (next === "book") {
      setBookOpen(reduced);
      setBookPage(reduced ? 3 : 0);
      if (reduced) setShowAllPages(true);
    }
    if (next === "sky") setMark(reduced ? "both" : "gather");
    if (next === "blank") setShown(reduced ? 4 : 0);
    else if (reduced && next === "memories") setShown(6);
    else if (reduced && next === "flower") setShown(7);
    else if (reduced && next === "rise") setShown(3);
    else if (reduced && next === "vow") setShown(copy.vow.length);
    else setShown(0);
    setPhase(next);
  }

  function goOpening() {
    if (leaving.current) return;
    leaving.current = true;
    setPaused(true);
    setPhase("return");
    window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => onRestart(), reduced ? 80 : 1500);
  }

  const invite = stage === "arrive" || stage === "invite";
  const showSky = invite || stage === "memories" || stage === "sky";
  const vowDone = (stage === "vow" && view >= copy.vow.length) || stage === "return";
  const cinematic = ["memories", "flower", "book", "blank", "rise", "sky"].includes(stage);
  const showSkip =
    !reduced &&
    !paused &&
    (stage === "arrive" ||
      cinematic ||
      (stage === "blank" && view < 4) ||
      (stage === "vow" && view < copy.vow.length));
  const showNext = (reduced || paused) && cinematic;
  const memory = stage === "memories" && view >= 1 && view <= 4 ? copy.memories[view - 1] : null;

  return (
    <section
      className="scene ending finale"
      data-phase={stage}
      data-step={view}
      data-reduced={reduced ? "true" : "false"}
      data-paused={paused ? "true" : "false"}
      data-dim={stage === "memories" && view === 3 ? "true" : "false"}
      data-pulse={stage === "memories" && view === 4 ? "true" : "false"}
      data-mark={skyMark}
      aria-labelledby="ending-title"
    >
      <div className="finale-backdrop" />
      <div className="finale-burgundy" />
      <div className="finale-lamp" />
      <div className="finale-dim" />
      {stage === "return" ? (
        <>
          <div className="finale-return-sky">
            <FinaleSky
              phase="sky"
              shown={view}
              mark={skyMark === "gather" ? "name" : skyMark}
              paused
              reduced={reduced}
              starWord={starWord}
              flowerSrc={story.letter.still}
            />
          </div>
          <span className="finale-seed finale-seed-home" aria-hidden="true" />
        </>
      ) : null}

      <div className="finale-column">
        {showSky ? (
          <FinaleSky
            phase={stage}
            shown={view}
            mark={skyMark}
            paused={paused}
            reduced={reduced}
            starWord={starWord}
            flowerSrc={story.letter.still}
          />
        ) : null}

        {stage === "flower" ? (
          <div className="finale-flower-wrap">
            {flowerOk ? (
              <img
                className="finale-flower"
                src={story.letter.still}
                alt={copy.flowerAlt}
                onError={() => setFlowerOk(false)}
              />
            ) : null}
            {scriptOn ? (
              <svg className="finale-ink" viewBox="0 0 240 46" aria-hidden="true">
                <path d="M16 30 C 70 8, 128 42, 224 14" pathLength="1" />
              </svg>
            ) : null}
          </div>
        ) : null}

        {stage === "book" || stage === "blank" || stage === "rise" ? (
          <StoryBook
            open={coverOpen}
            turning={turningFrom != null}
            page={reduced && stage === "book" ? 3 : bookPage}
            turningFrom={turningFrom}
            allPages={flatPages}
            blank={stage !== "book"}
            center={stage === "rise"}
            pages={copy.pages}
            title={copy.bookTitle}
            showDust={!reduced && (stage === "book" || stage === "blank")}
          >
            {stage === "blank" ? (
              <div className="blank-page">
                {copy.blank.slice(0, Math.min(view, 3)).map((line) => (
                  <p key={line} className="blank-line">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className={`finale-rise${view >= 1 ? " is-lit" : ""}`}>
                {starWord ? <p className={`finale-rise-word${view >= 2 ? " is-set" : ""}`}>{starWord}</p> : null}
                <span className={`finale-rise-light${view >= 2 ? " is-on" : ""}${view >= 3 ? " is-up" : ""}`} />
              </div>
            )}
          </StoryBook>
        ) : null}

        <div className="finale-copy">
          <h2 id="ending-title" tabIndex={-1} className={invite ? "finale-title" : "sr-only"}>
            {copy.title}
          </h2>
          {invite && view >= 1 ? <p className="finale-line">{copy.remember}</p> : null}
          {invite && view >= 2 ? <p className="finale-line">{copy.invite}</p> : null}
          {stage === "invite" ? (
            <button type="button" className="btn btn-solid" onClick={beginJourney}>
              {copy.watch}
            </button>
          ) : null}

          {stage === "memories" && (reduced || paused) ? (
            <div className="finale-memory-list">
              {copy.memories.map((item) => (
                <div key={item.lines[0]} className="finale-memory">
                  {item.date ? <p className="finale-date">{item.date}</p> : null}
                  {item.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ))}
            </div>
          ) : memory ? (
            <div className="finale-memory" aria-live="polite">
              {memory.date ? <p className="finale-date">{memory.date}</p> : null}
              {memory.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
          {stage === "memories" && view >= 5 ? (
            <div className="finale-close" aria-live="polite">
              {copy.memoryClose.slice(0, view - 4).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}

          {stage === "flower" && (scriptOn || view >= 4) ? (
            <div className="finale-flower-copy" aria-live="polite">
              {scriptOn ? <p className={`finale-script${reduced ? "" : " is-written"}`}>{copy.name}</p> : null}
              {view >= 4
                ? copy.flowerAfter.slice(0, view - 3).map((line) => (
                    <p key={line}>{line}</p>
                  ))
                : null}
            </div>
          ) : null}

          {stage === "rise" && view >= 3 && starWord ? (
            <p className="finale-star-line" role="status">
              {copy.starLine}
            </p>
          ) : null}
          {stage === "rise" && view >= 3 && !starWord ? <p className="sr-only">{copy.starQuiet}</p> : null}
          {stage === "sky" && skyMark === "gather" && starWord ? <p className="finale-star-line">{copy.starLine}</p> : null}

          {(stage === "vow" || stage === "return") && view > 0 ? (
            <div className="finale-vow">
              {copy.vow.slice(0, view).map((line, index) => (
                <p
                  key={line.text}
                  id={index === view - 1 ? "vow-latest" : undefined}
                  className={line.large ? "is-large" : line.date ? "is-date numeral" : undefined}
                  dir={line.date ? "ltr" : undefined}
                >
                  {line.text}
                </p>
              ))}
            </div>
          ) : null}

          {vowDone ? (
            <div className="chapter-nav finale-controls">
              <button type="button" className="btn btn-solid" onClick={goOpening} disabled={stage === "return"}>
                {copy.again}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onGalaxy} disabled={stage === "return"}>
                {copy.galaxy}
              </button>
            </div>
          ) : null}

          {showSkip || showNext ? (
            <div className="finale-controls">
              {showNext ? (
                <button type="button" className="btn btn-solid" onClick={advance}>
                  {copy.continue}
                </button>
              ) : null}
              {showSkip ? (
                <button type="button" className="btn-text" onClick={skip}>
                  {story.ui.skip}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
