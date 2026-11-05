import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { playPaper } from "../audio/engine";
import { story } from "../data/story";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { visualQuality } from "../utils/quality";
import "./HiddenLoveLetter.css";

const SHARDS = [
  { clip: "polygon(50% 50%, 48% 6%, 76% 16%, 70% 42%)", x: 16, y: 92, r: 24, delay: 0 },
  { clip: "polygon(50% 50%, 76% 16%, 96% 42%, 74% 60%)", x: 42, y: 118, r: 42, delay: 0.04 },
  { clip: "polygon(50% 50%, 74% 60%, 88% 84%, 56% 98%)", x: 18, y: 148, r: 30, delay: 0.02 },
  { clip: "polygon(50% 50%, 56% 98%, 34% 90%, 26% 64%)", x: -14, y: 156, r: -28, delay: 0.05 },
  { clip: "polygon(50% 50%, 26% 64%, 6% 40%, 22% 18%)", x: -40, y: 124, r: -48, delay: 0.03 },
  { clip: "polygon(50% 50%, 22% 18%, 48% 6%, 34% 32%)", x: -22, y: 86, r: -16, delay: 0.06 },
];

const cardVariants = {
  rest: {
    y: [0, -8, 0],
    rotateX: [14, 12, 14],
    rotateY: [-13, -9, -13],
    scale: 1,
    transition: { duration: 5.6, repeat: Infinity, ease: "easeInOut" },
  },
  near: {
    y: 0,
    rotateX: 18,
    rotateY: -12,
    scale: 1.05,
    transition: { duration: 0.7, ease: [0.22, 0.75, 0.24, 1] },
  },
  open: {
    y: 10,
    rotateX: 9,
    rotateY: -6,
    scale: 1,
    transition: { duration: 1.15, ease: [0.22, 0.7, 0.2, 1] },
  },
  flat: {
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 0.7, 0.2, 1] },
  },
};

const flapVariants = {
  shut: { rotateX: 0 },
  open: { rotateX: 186, transition: { duration: 1.05, ease: [0.5, 0.02, 0.16, 1] } },
};

const bottomFold = {
  closed: { rotateX: -180 },
  unfolding: { rotateX: 0, transition: { duration: 0.8, delay: 0.05, ease: [0.5, 0.02, 0.18, 1] } },
  reading: { rotateX: 0, transition: { duration: 0.01 } },
};

const topFold = {
  closed: { rotateX: 180 },
  unfolding: { rotateX: 0, transition: { duration: 0.78, delay: 0.78, ease: [0.5, 0.02, 0.18, 1] } },
  reading: { rotateX: 0, transition: { duration: 0.01 } },
};

function cardKey(phase) {
  if (phase === "reading") return "flat";
  if (phase === "unfolding" || phase === "extracting") return "open";
  if (phase === "idle") return "rest";
  return "near";
}

function flapKey(phase) {
  if (phase === "idle" || phase === "focusing" || phase === "sealBreaking") return "shut";
  return "open";
}

function foldKey(phase) {
  if (phase === "unfolding") return "unfolding";
  if (phase === "reading") return "reading";
  return "closed";
}

function Dust({ count }) {
  const specks = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: `${(index * 37 + 11) % 100}%`,
        top: `${(index * 53 + 7) % 100}%`,
        delay: `${(index % 8) * 0.45}s`,
        duration: `${8 + (index % 6)}s`,
        size: 1 + (index % 3),
        opacity: 0.35 + (index % 4) * 0.12,
      })),
    [count],
  );

  if (!count) return null;

  return (
    <div className="cine-dust" aria-hidden="true">
      {specks.map((speck) => (
        <i
          key={speck.id}
          style={{
            left: speck.left,
            top: speck.top,
            width: speck.size,
            height: speck.size,
            opacity: speck.opacity,
            animationDuration: speck.duration,
            animationDelay: speck.delay,
          }}
        />
      ))}
    </div>
  );
}

function WaxSeal({ stage }) {
  if (stage === "shattered") {
    return SHARDS.map((shard) => (
      <motion.span
        key={shard.clip}
        className="wax-shard"
        style={{ clipPath: shard.clip }}
        initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        animate={{ x: shard.x, y: shard.y, rotate: shard.r, opacity: 0 }}
        transition={{ duration: 0.74, delay: shard.delay, ease: [0.2, 0.65, 0.3, 1] }}
      />
    ));
  }

  const hot = stage === "cracking";
  return (
    <svg className={hot ? "wax-svg is-cracking" : "wax-svg"} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id="ll-wax" cx="36%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#d86b80" />
          <stop offset="42%" stopColor="#8d2340" />
          <stop offset="100%" stopColor="#4c1024" />
        </radialGradient>
        <linearGradient id="ll-heart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0d7a6" />
          <stop offset="100%" stopColor="#a4783e" />
        </linearGradient>
      </defs>
      <path
        fill="url(#ll-wax)"
        d="M60 10c14 0 24 6 32 16 8 10 14 18 14 32 0 16-8 28-18 36-8 6-16 12-28 12s-20-6-28-12C22 86 14 74 14 58c0-14 6-22 14-32C36 16 46 10 60 10z"
      />
      <circle cx="60" cy="58" r="24" fill="none" stroke="#e7c98a" strokeWidth="1.3" opacity="0.8" />
      <path
        d="M60 74c-9-7-16-13-16-21 0-6 4-10 9-10 3 0 6 2 7 5 1-3 4-5 7-5 5 0 9 4 9 10 0 8-7 14-16 21z"
        fill="#5c142c"
        stroke="url(#ll-heart)"
        strokeWidth="1.15"
      />
      <path d="M60 18 L56 40 L66 54 L52 78" className="wax-crack" />
      <path d="M30 52 L46 56 L40 74" className="wax-crack late" />
      <path d="M92 46 L74 56 L82 76" className="wax-crack later" />
    </svg>
  );
}

function Flap() {
  return (
    <>
      <div className="flap-face flap-outer">
        <svg viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="ll-flap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbf6ee" />
              <stop offset="48%" stopColor="#f0e4d2" />
              <stop offset="100%" stopColor="#e4d3bc" />
            </linearGradient>
          </defs>
          <polygon points="0,0 100,0 50,64" fill="#c6ae8e" transform="translate(0 0.8)" />
          <polygon points="1.2,0.6 98.8,0.6 50,62.2" fill="url(#ll-flap)" stroke="#d7b98a" strokeWidth="0.6" />
          <polygon points="8,1 92,1 50,52" fill="none" stroke="rgba(166,124,70,0.35)" strokeWidth="0.45" />
        </svg>
      </div>
      <div className="flap-face flap-inner">
        <svg viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="ll-liner" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#4a1226" />
              <stop offset="100%" stopColor="#8d2a46" />
            </linearGradient>
          </defs>
          <polygon points="0,0 100,0 50,64" fill="url(#ll-liner)" />
          <polygon points="7,1 93,1 50,50" fill="none" stroke="rgba(231,201,138,0.45)" strokeWidth="0.5" />
        </svg>
      </div>
    </>
  );
}

function GoldHeart() {
  return (
    <svg className="sig-heart" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="ll-sig" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e2b8" />
          <stop offset="100%" stopColor="#b88945" />
        </linearGradient>
      </defs>
      <path
        fill="url(#ll-sig)"
        d="M12 20s-7-4.35-7-9.05C5 8.05 6.8 6.3 9 6.3c1.3 0 2.4.62 3 1.62.6-1 1.7-1.62 3-1.62 2.2 0 4 1.75 4 4.65C19 15.65 12 20 12 20z"
      />
    </svg>
  );
}

export default function HiddenLoveLetter({ onNext, onGalaxy }) {
  const reduced = usePrefersReducedMotion();
  const lines = useMemo(() => story.letter.body.split("\n"), []);
  const greetingIndex = useMemo(() => lines.findIndex((line) => line.trim()), [lines]);
  const signatureIndex = useMemo(() => {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (lines[index].trim()) return index;
    }
    return -1;
  }, [lines]);
  const dustCount = useMemo(() => {
    if (reduced) return 0;
    const quality = visualQuality();
    if (quality === "low") return 0;
    if (quality === "medium") return 9;
    return 18;
  }, [reduced]);

  const [phase, setPhase] = useState("idle");
  const [sealStage, setSealStage] = useState("whole");
  const [count, setCount] = useState(0);
  const [instant, setInstant] = useState(false);
  const [seen, setSeen] = useState(false);
  const [playId, setPlayId] = useState(0);
  const token = useRef(0);
  const timer = useRef(0);
  const lineTimer = useRef(0);
  const lock = useRef(false);

  useEffect(
    () => () => {
      token.current += 1;
      window.clearTimeout(timer.current);
      window.clearTimeout(lineTimer.current);
    },
    [],
  );

  function arm() {
    token.current += 1;
    window.clearTimeout(timer.current);
    window.clearTimeout(lineTimer.current);
    return token.current;
  }

  function wait(ms, id) {
    return new Promise((resolve) => {
      timer.current = window.setTimeout(() => resolve(token.current === id), ms);
    });
  }

  function startInk(id) {
    let current = 0;
    const step = () => {
      if (token.current !== id) return;
      current += 1;
      setCount(current);
      if (current < lines.length) {
        const pause = lines[current - 1] === "" ? 200 : 430;
        lineTimer.current = window.setTimeout(step, pause);
      }
    };
    lineTimer.current = window.setTimeout(step, 360);
  }

  async function run(id) {
    const steps = [
      ["focusing", 740],
      ["sealBreaking", 900],
      ["flapOpening", 1080],
      ["extracting", 1280],
      ["unfolding", 2000],
    ];

    for (const [name, ms] of steps) {
      if (token.current !== id) return;
      setPhase(name);
      if (name === "sealBreaking") {
        setSealStage("cracking");
        const cracked = await wait(420, id);
        if (!cracked) return;
        setSealStage("shattered");
        const settled = await wait(ms - 420, id);
        if (!settled) return;
        continue;
      }
      const alive = await wait(ms, id);
      if (!alive) return;
    }

    if (token.current !== id) return;
    setPhase("reading");
    lock.current = false;
    startInk(id);
  }

  function showLetterNow() {
    arm();
    lock.current = false;
    setSeen(true);
    setInstant(true);
    setSealStage("shattered");
    setCount(lines.length);
    setPhase("reading");
  }

  function openLetter() {
    if (lock.current || phase !== "idle") return;
    lock.current = true;
    setSeen(true);
    setInstant(false);
    setCount(0);
    if (reduced) {
      showLetterNow();
      return;
    }
    playPaper();
    const id = arm();
    lock.current = true;
    run(id);
  }

  function skip() {
    showLetterNow();
  }

  function closeLetter() {
    arm();
    lock.current = false;
    setInstant(false);
    setCount(0);
    setSealStage("whole");
    setPlayId((value) => value + 1);
    setPhase("idle");
  }

  function replay() {
    if (lock.current) return;
    lock.current = true;
    const id = arm();
    setInstant(false);
    setCount(0);
    setSealStage("whole");
    setPlayId((value) => value + 1);
    setPhase("idle");
    if (reduced) {
      showLetterNow();
      return;
    }
    playPaper();
    timer.current = window.setTimeout(() => {
      if (token.current !== id) return;
      run(id);
    }, 70);
  }

  const folds = foldKey(phase);
  const busy = phase !== "idle" && phase !== "reading";
  const textDone = count >= lines.length;

  return (
    <section
      className="scene letter-scene"
      data-phase={phase}
      aria-labelledby="letter-title"
      aria-busy={busy}
    >
      <div className="cine-atmo" aria-hidden="true">
        <div className="cine-spot" />
        <div className="cine-vignette" />
        <Dust count={dustCount} />
      </div>
      <div className="chapter-inner letter-inner">
        <header className="letter-head">
          <p className="sr-only">{story.letter.body}</p>
        <p className="eyebrow">{story.letter.kicker}</p>
          <h2 id="letter-title" tabIndex={-1}>
            {story.letter.title}
          </h2>
        </header>
        <div className="cine-intro">
          <div className="ll-stage">
            <div className="desk-plane" aria-hidden="true" />
            <div className="desk-velvet" aria-hidden="true" />
            <div className="contact-shadow" aria-hidden="true" />
            <div className="ll-center">
              <motion.div
                key={playId}
                className="env-card"
                initial="rest"
                animate={cardKey(phase)}
                variants={cardVariants}
              >
                <div className="env-back paper-skin" />
                <div className="env-lining" />
                <div className="env-side left" />
                <div className="env-side right" />
                <div className="env-bottom" />
                <div className="letter-rig">
                  <div className="ll-bend">
                    <div className="ll-sheet">
                      <motion.div
                        className="ll-panel ll-panel-a"
                        style={{ transformOrigin: "50% 100%", transformStyle: "preserve-3d" }}
                        initial="closed"
                        animate={folds}
                        variants={topFold}
                      >
                        <div className="ll-face ll-face-front paper-skin" />
                        <div className="ll-face ll-face-back" />
                        <i className="fold-shade" />
                      </motion.div>
                      <div className="ll-panel ll-panel-b">
                        <div className="ll-face ll-face-front paper-skin" />
                      </div>
                      <motion.div
                        className="ll-panel ll-panel-c"
                        style={{ transformOrigin: "50% 0%", transformStyle: "preserve-3d" }}
                        initial="closed"
                        animate={folds}
                        variants={bottomFold}
                      >
                        <div className="ll-face ll-face-front paper-skin" />
                        <div className="ll-face ll-face-back" />
                        <i className="fold-shade" />
                      </motion.div>
                      <div className="ll-copy" aria-hidden={phase !== "reading"}>
                        <div>
                          {lines.slice(0, count).map((line, index) => {
                            const classes = ["ll-line"];
                            if (instant) classes.push("is-shown");
                            if (index === greetingIndex) classes.push("is-greeting");
                            if (line === "أنا بحبك يا يارا.") classes.push("is-vow");
                            if (index === signatureIndex) classes.push("is-signature");
                            return (
                              <span className={classes.join(" ")} key={`${index}-${line}`}>
                                {line || "\u00A0"}
                                {index === signatureIndex ? <GoldHeart /> : null}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="env-front paper-skin">
                  <div className="env-lip" />
                  <div className="env-shade" />
                  <div className="env-address">
                    <span className="env-mark">✦</span>
                    <p className="env-to">إلى يارا ❤️</p>
                    <p className="env-late">رسالة اتأخرت كتير...</p>
                  </div>
                </div>
                <motion.div
                  className="flap-hinge"
                  style={{ transformOrigin: "50% 0%", transformStyle: "preserve-3d" }}
                  initial="shut"
                  animate={flapKey(phase)}
                  variants={flapVariants}
                >
                  <Flap />
                </motion.div>
                <div className="seal-anchor">
                  <WaxSeal stage={sealStage} />
                </div>
              </motion.div>
            </div>
            <button
              type="button"
              className="ll-hit"
              onClick={openLetter}
              disabled={phase !== "idle"}
              aria-label={story.letter.hint}
            />
          </div>
        </div>
        <p className="ll-caption">{story.letter.seal}</p>
        <p className="ll-hint">{seen && phase === "idle" ? "اضغطي عشان تفتحيها تاني" : story.letter.hint}</p>
        <div className="ll-controls">
          {textDone ? null : (
            <button type="button" className="btn-text" onClick={skip}>
              {phase === "reading" ? story.letter.skip : "تخطي إلى الرسالة"}
            </button>
          )}
          {phase === "reading" ? (
            <button type="button" className="btn btn-ghost" onClick={closeLetter}>
              أقفلي الرسالة
            </button>
          ) : null}
          {seen && phase === "idle" ? (
            <button type="button" className="btn btn-ghost" onClick={openLetter}>
              افتحي الرسالة
            </button>
          ) : null}
          {seen && !busy ? (
            <button type="button" className="btn btn-ghost" onClick={replay}>
              أعيدي الحركة
            </button>
          ) : null}
        </div>
        {phase === "reading" || (seen && phase === "idle") ? (
          <div className="chapter-nav">
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
