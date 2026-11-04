import { useEffect, useRef, useState } from "react";
import { voiceSrc } from "virtual:voice-message";
import { story } from "../data/story";

function formatTime(value) {
  if (!Number.isFinite(value)) return "0:00";
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="8,5 19,12 8,19" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

export default function VoiceMessage() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const onTime = () => setTime(audio.currentTime || 0);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnd = () => setPlaying(false);
    const onError = () => setFailed(true);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onError);
    };
  }, []);

  if (!voiceSrc || failed) return null;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  return (
    <section className="voice" aria-labelledby="voice-title">
      <h3 id="voice-title">{story.voice.title}</h3>
      <div className="voice-row">
        <button
          type="button"
          className="voice-play"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? story.voice.pause : story.voice.play}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="voice-track" dir="ltr">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(time, duration || 0)}
            aria-label={story.voice.progress}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (audioRef.current) audioRef.current.currentTime = next;
              setTime(next);
            }}
          />
          <div className="voice-time" dir="ltr">
            <span>{formatTime(time)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      <audio ref={audioRef} preload="metadata" src={voiceSrc} />
    </section>
  );
}
