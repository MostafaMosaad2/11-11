import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { restoreAmbient, softenAmbient } from "../audio/engine";
import "./GiftReveal.css";
import { story } from "../data/story";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const MOTES = [
  { top: "8%", left: "10%", delay: "0s" },
  { top: "16%", left: "88%", delay: "1.4s" },
  { top: "58%", left: "4%", delay: "0.7s" },
  { top: "74%", left: "90%", delay: "2s" },
  { top: "42%", left: "93%", delay: "1.1s" },
  { top: "86%", left: "18%", delay: "1.8s" },
];

function holdFor(line, { last, night }) {
  if (last && night) return 0;
  if (last) return 3200;
  if (line.pause) return 2700;
  if (line.style === "english") return 2500;
  if (line.style === "finale") return 2100;
  return 1900;
}

function buildSteps(gift) {
  const steps = [
    { phase: "photo", frame: 0, lines: 0, hold: 2600 },
  ];
  const push = (lines, phase, frame) => {
    lines.forEach((line, index) => {
      const last = index === lines.length - 1;
      steps.push({
        phase,
        frame,
        lines: index + 1,
        hold: holdFor(line, { last, night: phase === "night" }),
      });
    });
  };
  push(gift.revealLines, "photo", 1);
  push(gift.sunflowerLines, "photo", 2);
  steps.push({ phase: "night", frame: 2, lines: 0, hold: 1800 });
  push(gift.encoreLines, "night", null);
  return steps;
}

function linesFor(gift, step) {
  if (!step || step.lines < 1) return [];
  if (step.phase === "photo" && step.frame === 1) return gift.revealLines.slice(0, step.lines);
  if (step.phase === "photo" && step.frame === 2) return gift.sunflowerLines.slice(0, step.lines);
  if (step.phase === "night") return gift.encoreLines.slice(0, step.lines);
  return [];
}

function CssGiftBox({ open }) {
  return (
    <div className={`box-scene${open ? " is-open" : ""}`}>
      <div className="box-light" aria-hidden="true" />
      <div className="box" aria-hidden="true">
        <div className="box-lid">
          <div className="lid-face">
            <span>✦</span>
          </div>
        </div>
        <div className="box-body" />
      </div>
    </div>
  );
}

function GiftLine({ line }) {
  if (line.style !== "english") {
    return <p className={`bracelet-line is-${line.style}`}>{line.text}</p>;
  }
  const mark = line.text.match(/\s*(?:☀️|❤️)\s*$/u);
  const words = mark ? line.text.slice(0, mark.index) : line.text;
  const yara = words.match(/^(.*?\s)(Yara\.?)$/);
  if (yara) {
    return (
      <p className="bracelet-line is-english is-stacked" dir="ltr" lang="en">
        <span className="bracelet-english">{yara[1].trim()}</span>
        <span className="bracelet-tail">
          <span className="bracelet-english">{yara[2]}</span>
          {mark ? <span className="bracelet-mark">{mark[0].trim()}</span> : null}
        </span>
      </p>
    );
  }
  return (
    <p className="bracelet-line is-english" dir="ltr" lang="en">
      <span className="bracelet-english">{words}</span>
      {mark ? <span className="bracelet-mark">{mark[0].trim()}</span> : null}
    </p>
  );
}

export default function GiftReveal({ onSurprise, onGalaxy }) {
  const reduced = usePrefersReducedMotion();
  const gift = story.gift;
  const steps = useMemo(() => buildSteps(gift), [gift]);
  const [step, setStep] = useState(-1);
  const leaving = useRef(false);
  const current = step >= 0 ? steps[step] : null;
  const phase = current?.phase ?? "closed";
  const lines = linesFor(gift, current);
  const open = step >= 0;
  const photo = phase === "photo" || phase === "night";
  const settled = phase === "night" && (current?.lines ?? 0) > 0;
  const finished = step === steps.length - 1;

  useEffect(() => {
    gift.images.forEach((image) => {
      const preload = new Image();
      preload.src = image.src;
    });
  }, [gift.images]);

  useEffect(() => {
    if (step < 0 || step >= steps.length - 1) return undefined;
    const wait = reduced ? Math.min(steps[step].hold, 720) : steps[step].hold;
    const timer = window.setTimeout(() => setStep((value) => value + 1), wait);
    return () => window.clearTimeout(timer);
  }, [reduced, step, steps]);

  useEffect(() => {
    if (phase === "night") softenAmbient();
  }, [phase]);

  useEffect(() => {
    const root = document.getElementById("stage-root");
    if (!root) return undefined;
    if (phase === "night") {
      root.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      return undefined;
    }
    const last = root.querySelector(".bracelet-copy .bracelet-line:last-child");
    if (!last) return undefined;
    const overflow = last.getBoundingClientRect().bottom - (root.getBoundingClientRect().bottom - 18);
    if (overflow > 8) {
      root.scrollTo({ top: root.scrollTop + overflow, behavior: reduced ? "auto" : "smooth" });
    }
    return undefined;
  }, [lines.length, phase, reduced]);

  function continueStory() {
    if (leaving.current) return;
    leaving.current = true;
    restoreAmbient();
    onSurprise();
  }

  return (
    <section
      className={`scene gift${reduced ? " is-reduced" : ""}${phase === "night" ? " is-holding" : ""}${settled ? " is-settled" : ""}`}
      id="gift"
      data-phase={phase}
      data-frame={current?.frame ?? ""}
      data-lines={lines.length}
      aria-labelledby="gift-title"
    >
      <div className="gift-veil" aria-hidden="true" />
      <motion.div
        className="gift-inner"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className={open ? "sr-only" : "eyebrow"}>{gift.kicker}</p>
        <h2 id="gift-title" className={open ? "sr-only" : undefined} tabIndex={-1}>
          {gift.title}
        </h2>
        {open ? null : (
          <>
            <p className="gift-lead">{gift.lead}</p>
            <p className="gift-sub">{gift.sub}</p>
          </>
        )}

        <div className={`bracelet-stage${photo ? " is-photo" : ""}${lines.length ? " has-lines" : ""}`}>
          <div className="bracelet-box">
            <CssGiftBox open={open} />
          </div>
          <div className="bracelet-plate">
            {!reduced && photo && phase !== "night" ? (
              <div className="bracelet-motes" aria-hidden="true">
                {MOTES.map((mote) => (
                  <span key={`${mote.top}-${mote.left}`} style={{ top: mote.top, left: mote.left, animationDelay: mote.delay }} />
                ))}
              </div>
            ) : null}
            <div className="bracelet-frame">
              {gift.images.map((image, index) => (
                <img
                  key={image.src}
                  src={image.src}
                  alt={current?.frame === index ? image.alt : ""}
                  width={1086}
                  height={1448}
                  draggable="false"
                  className={current?.frame === index ? "is-on" : ""}
                  aria-hidden={current?.frame === index ? undefined : true}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bracelet-copy" aria-live="polite">
          {lines.map((line, index) => (
            <GiftLine key={`${phase}-${index}`} line={line} />
          ))}
        </div>

        {!open ? (
          <div className="chapter-nav">
            <button type="button" className="btn btn-solid" onClick={() => setStep(0)}>
              {gift.open}
            </button>
            {onGalaxy ? (
              <button type="button" className="btn btn-ghost" onClick={onGalaxy}>
                {story.ui.toGalaxy}
              </button>
            ) : null}
          </div>
        ) : null}

        {finished ? (
          <div className="chapter-nav">
            <button type="button" className="btn btn-ghost bracelet-next" onClick={continueStory}>
              {gift.continue}
            </button>
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}
