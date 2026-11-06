import { useEffect, useMemo, useRef, useState } from "react";
import { resumeAmbient, suspendAmbient } from "../audio/engine";
import { story } from "../data/story";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import "./HiddenLoveLetter.css";

const MEDIA_RATIO = 16 / 9;
const HEART_X = 0.5;
const HEART_Y = 0.525;
const HEART_SCALE = 0.2;

function GoldHeart() {
  return (
    <svg className="sig-heart" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#c9a15b"
        d="M12 20s-7-4.35-7-9.05C5 8.05 6.8 6.3 9 6.3c1.3 0 2.4.62 3 1.62.6-1 1.7-1.62 3-1.62 2.2 0 4 1.75 4 4.65C19 15.65 12 20 12 20z"
      />
    </svg>
  );
}

function placeHeart(node) {
  if (!node) return;
  const width = node.clientWidth;
  const height = node.clientHeight;
  if (!width || !height) return;
  const boxRatio = width / height;
  let mediaW;
  let mediaH;
  let x;
  let y;
  if (boxRatio > MEDIA_RATIO) {
    mediaH = height;
    mediaW = height * MEDIA_RATIO;
    x = (width - mediaW) / 2;
    y = 0;
  } else {
    mediaW = width;
    mediaH = width / MEDIA_RATIO;
    x = 0;
    y = (height - mediaH) / 2;
  }
  const size = Math.max(48, mediaW * HEART_SCALE);
  node.style.setProperty("--heart-x", `${x + mediaW * HEART_X}px`);
  node.style.setProperty("--heart-y", `${y + mediaH * HEART_Y}px`);
  node.style.setProperty("--heart-size", `${size}px`);
}

function park(node) {
  if (!node) return;
  node.pause();
  if (!Number.isFinite(node.duration) || node.duration <= 0) return;
  const end = Math.max(0, node.duration - 0.05);
  if (node.currentTime < end - 0.2) {
    try {
      node.currentTime = end;
    } catch {
      /* the still image covers the frame */
    }
  }
}

export default function HiddenLoveLetter({ onNext, onGalaxy }) {
  const reduced = usePrefersReducedMotion();
  const copy = story.letter;
  const lines = useMemo(() => copy.body.split("\n"), [copy.body]);
  const greetingIndex = useMemo(() => lines.findIndex((line) => line.trim()), [lines]);
  const signatureIndex = useMemo(() => {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (lines[index].trim()) return index;
    }
    return -1;
  }, [lines]);
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const token = useRef(0);
  const timers = useRef([]);
  const held = useRef(false);
  const stageName = useRef("intro");
  const [playId, setPlayId] = useState(0);
  const [stage, setStage] = useState("intro");
  const [introCount, setIntroCount] = useState(reduced ? copy.intro.length : 0);
  const [introDone, setIntroDone] = useState(reduced);
  const [promptCount, setPromptCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [fault, setFault] = useState(false);
  const [stillOn, setStillOn] = useState(false);

  stageName.current = stage;

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function wait(ms, id) {
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => resolve(token.current === id), ms);
      timers.current.push(timer);
    });
  }

  function finishBloom() {
    if (held.current) return;
    held.current = true;
    park(videoRef.current);
    resumeAmbient();
    setStillOn(true);
    setStage("settled");
  }

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    placeHeart(node);
    const observer = new ResizeObserver(() => placeHeart(node));
    observer.observe(node);
    return () => observer.disconnect();
  }, [stage]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video || held.current || stageName.current !== "playing") return;
        if (!entry.isIntersecting) video.pause();
        else video.play().catch(() => {});
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      videoRef.current?.pause();
      resumeAmbient();
    };
  }, []);

  useEffect(() => {
    const id = token.current + 1;
    token.current = id;
    clearTimers();
    setLineCount(0);
    setPromptCount(0);
    held.current = false;

    if (reduced) {
      setIntroCount(copy.intro.length);
      setIntroDone(true);
      return undefined;
    }

    setIntroCount(0);
    setIntroDone(false);

    async function run() {
      for (let index = 0; index < copy.intro.length; index += 1) {
        if (!(await wait(index === 0 ? 700 : 1500, id))) return;
        setIntroCount(index + 1);
      }
      if (!(await wait(420, id))) return;
      if (token.current === id) setIntroDone(true);
    }

    run();
    return () => {
      token.current += 1;
      clearTimers();
    };
  }, [copy.intro.length, playId, reduced]);

  useEffect(() => {
    if (stage !== "settled") return undefined;
    const id = token.current;
    if (reduced) {
      setPromptCount(copy.ready.length);
      return undefined;
    }
    setPromptCount(0);
    async function run() {
      for (let index = 0; index < copy.ready.length; index += 1) {
        if (!(await wait(index === 0 ? 420 : 1100, id))) return;
        setPromptCount(index + 1);
      }
    }
    run();
    return undefined;
  }, [copy.ready.length, reduced, stage]);

  function startInk(id) {
    let current = 0;
    const step = () => {
      if (token.current !== id) return;
      current += 1;
      setLineCount(current);
      if (current < lines.length) {
        const pause = lines[current - 1] === "" ? 180 : 420;
        timers.current.push(window.setTimeout(step, pause));
        return;
      }
      timers.current.push(
        window.setTimeout(() => {
          if (token.current === id) setStage("after");
        }, 700),
      );
    };
    timers.current.push(window.setTimeout(step, 520));
  }

  function playBloom() {
    const node = videoRef.current;
    if (!node || stageName.current !== "intro") return;
    setFault(false);
    held.current = false;
    if (reduced) {
      setStillOn(true);
      setStage("settled");
      return;
    }
    setStage("playing");
    void suspendAmbient();
    try {
      node.currentTime = 0;
    } catch {
      /* play() will load from the start */
    }
    node.play().catch(() => {
      resumeAmbient();
      held.current = true;
      setFault(true);
      setStillOn(true);
      setStage("settled");
    });
  }

  function onTimeUpdate() {
    const node = videoRef.current;
    if (!node || held.current || stageName.current !== "playing") return;
    if (!Number.isFinite(node.duration) || node.duration === 0) return;
    if (node.currentTime >= node.duration - 0.06) finishBloom();
  }

  function onEnded() {
    finishBloom();
  }

  function onVideoError() {
    if (held.current || stageName.current === "intro") return;
    held.current = true;
    resumeAmbient();
    setFault(true);
    setStillOn(true);
    setStage("settled");
  }

  function replay() {
    const node = videoRef.current;
    token.current += 1;
    clearTimers();
    held.current = false;
    setFault(false);
    setStillOn(false);
    setLineCount(0);
    setPromptCount(0);
    setIntroCount(0);
    setIntroDone(reduced);
    setStage("intro");
    if (node) {
      node.pause();
      try {
        node.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    resumeAmbient();
    document.getElementById("stage-root")?.scrollTo({ top: 0, behavior: "auto" });
    setPlayId((value) => value + 1);
  }

  function openHeart() {
    if (stage !== "settled") return;
    const id = token.current + 1;
    token.current = id;
    clearTimers();
    if (reduced) {
      setLineCount(lines.length);
      setStage("after");
      return;
    }
    setStage("opening");
    timers.current.push(
      window.setTimeout(() => {
        if (token.current !== id) return;
        setStage("reading");
        startInk(id);
      }, 900),
    );
  }

  const showLetter = stage === "reading" || stage === "after";
  const open = stage === "opening" || showLetter;
  const showVeil = stage === "intro" || stage === "playing";

  return (
    <section
      ref={rootRef}
      className="scene sunflower-scene"
      id="letter"
      data-stage={stage}
      data-open={open ? "true" : "false"}
      data-still={stillOn ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
      aria-labelledby="letter-title"
    >
      <h2 id="letter-title" className="sr-only" tabIndex={-1}>
        {copy.title}
      </h2>
      <div className="bloom-stage" ref={stageRef}>
        <div className="bloom-media">
          <video
            ref={videoRef}
            className="bloom-film"
            src={copy.src}
            playsInline
            preload="none"
            loop={false}
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate noremoteplayback"
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
            onError={onVideoError}
          />
          <img className="bloom-still" src={copy.still} alt="" decoding="async" />
        </div>
        <span className="bloom-light" aria-hidden="true" />
        {stage === "settled" ? (
          <button type="button" className="bloom-heart" onClick={openHeart} aria-label={copy.touchLabel}>
            <span className="heart-hint" aria-hidden="true" />
          </button>
        ) : null}
        {showVeil ? (
          <div className="intro-veil">
            <div className="sun-copy" aria-live="polite">
              {copy.intro.slice(0, introCount).map((line) => (
                <p key={line} className="sun-line">
                  {line}
                </p>
              ))}
              {introDone && stage === "intro" ? (
                <button type="button" className="btn btn-solid" onClick={playBloom}>
                  {copy.bloom}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {stage === "settled" ? (
        <div className="sun-copy" aria-live="polite">
          {copy.ready.slice(0, promptCount).map((line) => (
            <p key={line} className="sun-line">
              {line}
            </p>
          ))}
          {fault ? <p className="bloom-fault">{copy.fault}</p> : null}
        </div>
      ) : null}

      {showLetter ? (
        <article className="letter-panel" aria-live="polite">
          {lines.slice(0, lineCount).map((line, index) => {
            const classes = ["letter-line"];
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
        </article>
      ) : null}

      {stage === "after" ? (
        <div className="letter-after">
          <p>{copy.after}</p>
          <div className="letter-actions">
            <button type="button" className="btn btn-ghost" onClick={replay}>
              {copy.replay}
            </button>
            <button type="button" className="btn btn-solid" onClick={onNext}>
              {copy.next}
            </button>
          </div>
        </div>
      ) : null}
      {onGalaxy ? (
        <button type="button" className="btn btn-ghost" onClick={onGalaxy}>
          {story.ui.toGalaxy}
        </button>
      ) : null}
    </section>
  );
}
