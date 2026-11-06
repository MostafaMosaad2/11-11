import { useEffect, useMemo, useRef, useState } from "react";
import { resumeAmbient, suspendAmbient } from "../audio/engine";
import { story } from "../data/story";
import { visualQuality } from "../utils/quality";
import "./SurpriseVideoMemory.css";

const INTRO_GAPS = [1500, 1900, 1700, 1300];
const AFTER_GAPS = [1400, 1800, 1900, 1800, 1500];

function clock(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function Dust({ specks }) {
  if (!specks.length) return null;
  return (
    <div className="memory-dust" aria-hidden="true">
      {specks.map((speck) => (
        <i key={speck.id} style={speck} />
      ))}
    </div>
  );
}

function lyricFor(lines, time) {
  let current = null;
  for (let index = 0; index < lines.length; index += 1) {
    if (time >= lines[index].at) current = { index, line: lines[index].line };
    else break;
  }
  return current;
}

function RevealedLines({ lines, count }) {
  return lines.slice(0, count).map((line, index) => (
    <p key={`${index}-${line}`} className="memory-line">
      {line}
    </p>
  ));
}

export default function SurpriseVideoMemory({ reduced, onNext, onGalaxy }) {
  const copy = story.video;
  const videoRef = useRef(null);
  const alive = useRef(true);
  const playToken = useRef(0);
  const frameTimer = useRef(0);
  const [stage, setStage] = useState("intro");
  const [shown, setShown] = useState(reduced ? copy.intro.length : 0);
  const [introDone, setIntroDone] = useState(reduced);
  const [afterShown, setAfterShown] = useState(0);
  const [afterDone, setAfterDone] = useState(false);
  const [media, setMedia] = useState("idle");
  const [buffering, setBuffering] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ratio, setRatio] = useState(9 / 16);

  const specks = useMemo(() => {
    if (reduced || visualQuality() === "low") return [];
    const count = visualQuality() === "high" ? 16 : 8;
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      left: `${(index * 37) % 100}%`,
      top: `${(index * 53) % 100}%`,
      animationDelay: `${(index % 7) * 0.55}s`,
      animationDuration: `${8 + (index % 5)}s`,
      width: `${2 + (index % 3)}px`,
      height: `${2 + (index % 3)}px`,
    }));
  }, [reduced]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      playToken.current += 1;
      window.clearTimeout(frameTimer.current);
      videoRef.current?.pause();
      resumeAmbient();
    };
  }, []);

  useEffect(() => {
    if (stage !== "intro" || reduced) return undefined;
    let index = 0;
    let timer = 0;
    const reveal = () => {
      index += 1;
      setShown(index);
      if (index >= copy.intro.length) {
        timer = window.setTimeout(() => setIntroDone(true), 720);
        return;
      }
      timer = window.setTimeout(reveal, INTRO_GAPS[index - 1] ?? 1400);
    };
    timer = window.setTimeout(reveal, 680);
    return () => window.clearTimeout(timer);
  }, [stage, reduced, copy.intro.length]);

  useEffect(() => {
    if (stage !== "after") return undefined;
    if (reduced) {
      setAfterShown(copy.after.length);
      setAfterDone(true);
      return undefined;
    }
    let index = 0;
    let timer = 0;
    setAfterShown(0);
    setAfterDone(false);
    const reveal = () => {
      index += 1;
      setAfterShown(index);
      if (index >= copy.after.length) {
        timer = window.setTimeout(() => setAfterDone(true), 640);
        return;
      }
      timer = window.setTimeout(reveal, AFTER_GAPS[index - 1] ?? 1500);
    };
    timer = window.setTimeout(reveal, 700);
    return () => window.clearTimeout(timer);
  }, [stage, reduced, copy.after.length]);

  function skipIntro() {
    setShown(copy.intro.length);
    setIntroDone(true);
  }

  function skipAfter() {
    setAfterShown(copy.after.length);
    setAfterDone(true);
  }

  function openFilm() {
    if (reduced) {
      setStage("cinema");
      return;
    }
    setStage("frame");
    frameTimer.current = window.setTimeout(() => {
      setStage((current) => (current === "frame" ? "cinema" : current));
    }, 1280);
  }

  async function play() {
    const node = videoRef.current;
    if (!node || media === "missing") return;
    const token = playToken.current + 1;
    playToken.current = token;
    setBuffering(true);
    await suspendAmbient();
    if (!alive.current || token !== playToken.current) {
      if (alive.current) resumeAmbient();
      setBuffering(false);
      return;
    }
    try {
      await node.play();
    } catch {
      if (!alive.current || token !== playToken.current) return;
      resumeAmbient();
      setMedia("error");
      setBuffering(false);
    }
  }

  function pause() {
    playToken.current += 1;
    videoRef.current?.pause();
    setBuffering(false);
  }

  function toggle() {
    const node = videoRef.current;
    if (!node || stage !== "cinema" || media === "missing") return;
    if (node.paused) play();
    else pause();
  }

  function toggleMute() {
    const node = videoRef.current;
    if (!node) return;
    node.muted = !node.muted;
    setMuted(node.muted);
  }

  function seek(event) {
    const node = videoRef.current;
    if (!node) return;
    const next = Number(event.target.value);
    if (!Number.isFinite(next)) return;
    node.currentTime = next;
    setTime(next);
  }

  function onLoadedMetadata() {
    const node = videoRef.current;
    if (!node) return;
    const width = node.videoWidth || 9;
    const height = node.videoHeight || 16;
    setRatio(width / height);
    setDuration(Number.isFinite(node.duration) ? node.duration : 0);
    setMedia((current) => (current === "playing" || current === "paused" || current === "ended" ? current : "ready"));
    setBuffering(false);
  }

  function onError() {
    const code = videoRef.current?.error?.code;
    setMedia(code === 3 ? "error" : "missing");
    setBuffering(false);
    resumeAmbient();
  }

  function retry() {
    const node = videoRef.current;
    if (!node) return;
    setMedia("loading");
    setBuffering(true);
    node.load();
  }

  function replay() {
    const node = videoRef.current;
    playToken.current += 1;
    if (node) {
      node.pause();
      try {
        node.currentTime = 0;
      } catch {
        /* metadata may not be seekable yet */
      }
    }
    setTime(0);
    setMedia(node?.error ? "error" : "ready");
    setBuffering(false);
    setStage("cinema");
  }

  function onEnded() {
    setMedia("ended");
    setBuffering(false);
    setStage("after");
    resumeAmbient();
  }

  const playing = media === "playing";
  const showFilm = stage !== "intro";
  const broken = media === "missing" || media === "error";
  const lyric =
    stage === "cinema" && !broken && (playing || time > 0.12)
      ? lyricFor(copy.lyrics, time)
      : null;

  return (
    <section
      className="scene video-memory"
      id="video"
      data-stage={stage}
      data-playing={playing ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
      style={{ "--film-ratio": ratio }}
      aria-labelledby="video-title"
    >
      <div className="memory-spot" aria-hidden="true" />
      <Dust specks={specks} />
      <h2 id="video-title" className={stage === "intro" ? "memory-title" : "sr-only"}>
        {copy.title}
      </h2>

      {stage === "intro" ? (
        <div className="memory-copy" aria-live="polite">
          {copy.kicker && copy.kicker !== copy.title ? <p className="kicker">{copy.kicker}</p> : null}
          <RevealedLines lines={copy.intro} count={shown} />
          {introDone ? (
            <button type="button" className="btn btn-solid memory-cue" onClick={openFilm}>
              {copy.reveal}
            </button>
          ) : (
            <button type="button" className="btn-text" onClick={skipIntro}>
              {story.ui.skip}
            </button>
          )}
        </div>
      ) : null}

      {showFilm ? (
        <div className="memory-stage">
          <div className="memory-frame">
            <span className="memory-sheen" aria-hidden="true" />
            <video
              ref={videoRef}
              className={broken ? "is-hidden" : undefined}
              src={copy.src}
              playsInline
              preload="metadata"
              disablePictureInPicture
              onLoadedMetadata={onLoadedMetadata}
              onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
              onDurationChange={(event) => {
                const next = event.currentTarget.duration;
                if (Number.isFinite(next)) setDuration(next);
              }}
              onWaiting={() => setBuffering(true)}
              onPlaying={() => {
                setBuffering(false);
                setMedia("playing");
              }}
              onPause={() => {
                setMedia((current) => (current === "ended" ? current : "paused"));
              }}
              onEnded={onEnded}
              onError={onError}
              onClick={toggle}
            />
            {broken ? (
              <div className="memory-fallback" role="status">
                <p>{media === "missing" ? copy.missing : copy.error}</p>
                {media === "error" ? (
                  <button type="button" className="btn btn-ghost" onClick={retry}>
                    {copy.retry}
                  </button>
                ) : null}
              </div>
            ) : null}
            {buffering && !broken ? (
              <p className="memory-loading" role="status">
                {copy.loading}
              </p>
            ) : null}
            {stage === "cinema" && !broken && !playing ? (
              <button type="button" className="memory-play" onClick={play} aria-label={copy.play}>
                <PlayIcon />
              </button>
            ) : null}
            {lyric ? (
              <p className="memory-lyric" key={lyric.index}>
                {lyric.line}
              </p>
            ) : null}
            {stage === "cinema" && !broken ? (
              <div className="memory-controls" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="memory-icon" onClick={toggle} aria-label={playing ? copy.pause : copy.play}>
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </button>
                <input
                  className="memory-progress"
                  dir="ltr"
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={Math.min(time, duration || 0)}
                  aria-label={copy.progress}
                  aria-valuetext={`${clock(time)} / ${clock(duration)}`}
                  onChange={seek}
                />
                <span className="memory-time" aria-hidden="true">
                  {clock(time)}
                </span>
                <button type="button" className="memory-icon" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? copy.unmute : copy.mute}>
                  <SoundIcon muted={muted} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {stage === "after" ? (
        <div className="memory-copy memory-after" aria-live="polite">
          <RevealedLines lines={copy.after} count={afterShown} />
          {afterDone ? (
            <div className="memory-actions">
              <button type="button" className="btn btn-solid" onClick={onNext}>
                {copy.next}
              </button>
              <button type="button" className="btn btn-ghost" onClick={replay}>
                {copy.replay}
              </button>
            </div>
          ) : (
            <button type="button" className="btn-text" onClick={skipAfter}>
              {story.ui.skip}
            </button>
          )}
        </div>
      ) : null}

      {broken && stage !== "intro" ? (
        <button type="button" className="btn btn-solid" onClick={onNext}>
          {copy.next}
        </button>
      ) : null}
      {onGalaxy ? (
        <button type="button" className="btn btn-ghost" onClick={onGalaxy}>
          {story.ui.toGalaxy}
        </button>
      ) : null}
    </section>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" fill="currentColor" />
    </svg>
  );
}

function SoundIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.2h3.2L12 5v14l-4.8-4.2H4z" fill="currentColor" />
      {muted ? (
        <path d="M16 9.2 21 15M21 9.2 16 15" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : (
        <path d="M16.2 9.1a4.2 4.2 0 0 1 0 5.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      )}
    </svg>
  );
}
