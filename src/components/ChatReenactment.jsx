import { useEffect, useRef, useState } from "react";
import { story } from "../data/story";
import { prefersReducedMotion, usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const beats = [
  ...story.chat.messages.map((_, index) => ({ type: "message", message: index, hold: 1080 })),
  { type: "pause", hold: 700 },
  { type: "bridge", hold: 1400 },
  { type: "typing", hold: 2100 },
  { type: "reveal", hold: 850 },
  { type: "reaction", hold: 650 },
  { type: "closing", hold: 0 },
];

const bridgeAt = beats.findIndex((beat) => beat.type === "bridge");
const revealAt = beats.findIndex((beat) => beat.type === "reveal");
const reactionAt = beats.findIndex((beat) => beat.type === "reaction");
const closingAt = beats.findIndex((beat) => beat.type === "closing");
const lastBeat = beats.length - 1;

export default function ChatReenactment() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef(null);
  const revealRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [runId, setRunId] = useState(0);
  const [beat, setBeat] = useState(() => (prefersReducedMotion() ? lastBeat : -1));

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.32 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || reduced) return undefined;

    let index = -1;
    let timer = 0;
    let cancelled = false;

    const run = () => {
      const wait = index < 0 ? 420 : beats[index].hold;
      timer = window.setTimeout(() => {
        if (cancelled) return;
        index += 1;
        setBeat(index);
        if (index < lastBeat) run();
      }, wait);
    };

    run();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [started, runId, reduced]);

  useEffect(() => {
    if (beat !== revealAt) return;
    revealRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "nearest",
    });
  }, [beat, reduced]);

  const visibleCount = beats
    .slice(0, Math.max(0, beat + 1))
    .filter((item) => item.type === "message").length;
  const showBridge = beat >= bridgeAt;
  const showTyping = beat >= 0 && beats[beat].type === "typing";
  const showReveal = beat >= revealAt;
  const showReaction = beat >= reactionAt;
  const showClosing = beat >= closingAt;

  function replay() {
    if (reduced) {
      setBeat(lastBeat);
      return;
    }
    setStarted(true);
    setBeat(-1);
    setRunId((value) => value + 1);
  }

  return (
    <div className="chat" ref={rootRef}>
      <div className={`chat-window${showTyping ? " is-typing" : ""}`} role="log" aria-live="polite" aria-relevant="additions">
        {story.chat.messages.slice(0, visibleCount).map((message, index) => (
          <div key={`line-${index}`} className="chat-line">
            {message.day ? <p className="chat-day">{message.day}</p> : null}
            <div className={`msg msg-${message.from}`}>
              <span className="sender">{message.from === "me" ? story.chat.me : story.chat.her}</span>
              <p className="bubble">{message.text}</p>
            </div>
          </div>
        ))}
        {showBridge ? <p className="chat-bridge">{story.chat.bridge}</p> : null}
        {showTyping ? (
          <div className="typing" aria-hidden="false">
            <span />
            <span />
            <span />
            <span className="sr-only">{story.chat.typingLabel}</span>
          </div>
        ) : null}
      </div>

      {showReveal ? (
        <div className="reveal-block" ref={revealRef} aria-live="polite">
          <p className={`reveal-card${showReaction ? " is-reacting" : ""}`}>{story.chat.reveal}</p>
          {showReaction ? (
            <div className="reaction" aria-hidden="true">
              <span className="reaction-burst" />
              <span className="reaction-stamp">❤️</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {showClosing ? <p className="prose closing-prose">{story.chat.closing}</p> : null}

      <button type="button" className="btn btn-ghost" onClick={replay}>
        {story.chat.replay}
      </button>
    </div>
  );
}
