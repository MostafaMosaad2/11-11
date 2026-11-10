import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { restoreAmbient, softenAmbient } from "../audio/engine";
import BraceletDissolve from "./gift/BraceletDissolve";
import "./GiftReveal.css";
import { story } from "../data/story";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const BEATS = [
  { phase: "opening", hold: 1700 },
  { phase: "reveal", hold: 2100 },
  { phase: "memory", line: 1, hold: 2500 },
  { phase: "memory", line: 2, hold: 2700 },
  { phase: "memory", line: 3, hold: 2500 },
  { phase: "bridge", line: 3, hold: 1800 },
  { phase: "named", hold: 2700 },
  { phase: "return", hold: 1100 },
  { phase: "place", line: 1, hold: 1800 },
  { phase: "place", line: 2, hold: 2400 },
  { phase: "place", line: 3, hold: 1700 },
  { phase: "dissolve", hold: 4400 },
  { phase: "empty", hold: 1500 },
  { phase: "look", line: 1, hold: 2200 },
  { phase: "look", line: 2, hold: 0 },
];

function beatDuration(beat, reduced) {
  if (!beat?.hold) return 0;
  if (!reduced) return beat.hold;
  if (beat.phase === "look" || beat.phase === "place" || beat.phase === "memory" || beat.phase === "named") {
    return Math.min(beat.hold, 1100);
  }
  return Math.min(beat.hold, 520);
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

function ClosedBox({ open }) {
  return (
    <div className={`box-scene${open ? " is-open" : ""}`}>
      <div className="box-light" aria-hidden="true" />
      <div className="box" aria-hidden="true">
        <div className="box-lid">
          <div className="lid-face" />
        </div>
        <div className="box-body">
          <div className="box-cushion" />
        </div>
      </div>
    </div>
  );
}

function linesFor(gift, phase, count) {
  if (phase === "memory" || phase === "bridge") {
    return gift.memory.slice(0, count).map((text) => ({ text, style: "arabic" }));
  }
  if (phase === "named") return [{ text: gift.yara, style: "english" }];
  if (phase === "place") return gift.place.slice(0, count);
  if (phase === "look") return gift.look.slice(0, count);
  return [];
}

function frameIndex(phase) {
  if (phase === "memory") return 1;
  if (phase === "bridge" || phase === "named") return 2;
  if (phase === "reveal" || phase === "return" || phase === "place" || phase === "dissolve") return 0;
  return -1;
}

export default function GiftReveal({ onSurprise, onGalaxy }) {
  const reduced = usePrefersReducedMotion();
  const gift = story.gift;
  const [beat, setBeat] = useState(-1);
  const [canvasOn, setCanvasOn] = useState(false);
  const [dissolveFallback, setDissolveFallback] = useState(false);
  const leaving = useRef(false);
  const current = beat >= 0 ? BEATS[beat] : null;
  const phase = current?.phase ?? "invite";
  const lineCount = current?.line ?? 0;
  const lines = linesFor(gift, phase, lineCount);
  const frame = frameIndex(phase);
  const showCanvas = (phase === "dissolve" || phase === "empty") && !reduced && !dissolveFallback;
  const showPhoto = frame >= 0 && !(showCanvas && canvasOn);
  const showPlate = (reduced || dissolveFallback) && (phase === "dissolve" || phase === "empty");
  const awaiting = phase === "look" && lineCount >= gift.look.length;

  useEffect(() => {
    const sources = [
      ...gift.images.map((image) => image.src),
      "/images/yara-bracelet/bracelet-box-empty.webp",
      "/images/yara-bracelet/bracelet-mask.png",
    ];
    sources.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, [gift.images]);

  useEffect(() => {
    if (beat < 0) return undefined;
    const hold = beatDuration(BEATS[beat], reduced);
    if (!hold) return undefined;
    const timer = window.setTimeout(() => setBeat((value) => value + 1), hold);
    return () => window.clearTimeout(timer);
  }, [beat, reduced]);

  useEffect(() => {
    if (phase === "look") softenAmbient();
  }, [phase]);

  useEffect(() => {
    const root = document.getElementById("stage-root");
    if (!root) return undefined;
    if (phase === "look" || phase === "invite" || phase === "opening") {
      root.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      return undefined;
    }
    const last = root.querySelector(".bracelet-copy .bracelet-line:last-child");
    if (!last) return undefined;
    const overflow = last.getBoundingClientRect().bottom - (root.getBoundingClientRect().bottom - 24);
    if (overflow > 8) {
      root.scrollTo({ top: root.scrollTop + overflow, behavior: reduced ? "auto" : "smooth" });
    }
    return undefined;
  }, [lineCount, phase, reduced]);

  function openGift() {
    if (beat >= 0) return;
    setBeat(0);
  }

  function continueStory() {
    if (!awaiting || leaving.current) return;
    leaving.current = true;
    restoreAmbient();
    onSurprise();
  }

  return (
    <section
      className={`scene gift is-${phase}${reduced ? " is-reduced" : ""}${lines.length ? " has-copy" : ""}`}
      id="gift"
      data-phase={phase}
      aria-labelledby="gift-title"
    >
      <div className="gift-veil" aria-hidden="true" />
      <div className="gift-spot" aria-hidden="true" />
      <motion.div
        className="gift-inner"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 id="gift-title" className="sr-only" tabIndex={-1}>
          {gift.title}
        </h2>

        {phase === "invite" ? (
          <div className="gift-invite">
            {gift.invite.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        ) : null}

        <div className={`bracelet-stage${phase === "memory" || phase === "bridge" ? " is-zoom" : ""}`}>
          <div className="bracelet-box">
            <ClosedBox open={phase !== "invite"} />
          </div>
          <div className="bracelet-frame">
            {gift.images.map((image, index) => (
              <img
                key={image.src}
                src={image.src}
                alt={showPhoto && frame === index ? image.alt : ""}
                width={1086}
                height={1448}
                draggable="false"
                className={`${showPhoto && frame === index ? "is-on" : ""}${showPlate && index === 0 ? " is-leaving" : ""}`}
                aria-hidden={showPhoto && frame === index ? undefined : true}
              />
            ))}
            <img
              src="/images/yara-bracelet/bracelet-box-empty.webp"
              alt=""
              width={1086}
              height={1448}
              draggable="false"
              className={`bracelet-plate-img${showPlate && phase === "empty" ? " is-on" : ""}${showPlate && phase === "dissolve" ? " is-arriving" : ""}`}
              aria-hidden="true"
            />
            {showCanvas ? (
              <BraceletDissolve active onReady={() => setCanvasOn(true)} onFallback={() => setDissolveFallback(true)} />
            ) : null}
            {showPlate && phase === "dissolve" ? <span className="bracelet-bloom" aria-hidden="true" /> : null}
          </div>
        </div>

        <div className="bracelet-copy" aria-live="polite">
          {lines.map((line) => (
            <GiftLine key={line.text} line={line} />
          ))}
        </div>

        {phase === "invite" ? (
          <div className="chapter-nav gift-actions">
            <button type="button" className="btn btn-solid" onClick={openGift}>
              {gift.open}
            </button>
            {onGalaxy ? (
              <button type="button" className="btn btn-ghost" onClick={onGalaxy}>
                {story.ui.toGalaxy}
              </button>
            ) : null}
          </div>
        ) : null}

        {awaiting ? (
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
