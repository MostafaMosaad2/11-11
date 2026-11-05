import { useEffect, useState } from "react";
import {
  getAmbientSnapshot,
  hasAmbient,
  pauseAmbient,
  playAmbientFromGesture,
  setAmbientLevel,
  subscribeAmbient,
} from "../audio/engine";
import { story } from "../data/story";
import { keys, readStorage, readVolume, writeStorage } from "../utils/storage";

function Speaker({ muted }) {
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

export default function AudioController() {
  const [status, setStatus] = useState(getAmbientSnapshot);
  const [muted, setMuted] = useState(() => readStorage(keys.muted, false) === true);
  const [volume, setVolume] = useState(readVolume);

  useEffect(() => subscribeAmbient(setStatus), []);

  if (!hasAmbient() || status.phase === "idle" || status.phase === "missing") return null;

  const soundOn = status.phase === "playing";
  let label = story.audio.unmute;
  if (soundOn) label = story.audio.mute;
  if (status.phase === "blocked") label = story.audio.play;

  function toggle() {
    if (!soundOn) {
      setMuted(false);
      writeStorage(keys.muted, false);
      playAmbientFromGesture(volume);
      return;
    }
    setMuted(true);
    writeStorage(keys.muted, true);
    pauseAmbient();
  }

  return (
    <div className="audio-dock">
      <button type="button" className="audio-btn" onClick={toggle} aria-pressed={soundOn} aria-label={label}>
        <Speaker muted={!soundOn || muted} />
      </button>
      <input
        className="audio-volume"
        dir="ltr"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        aria-label={story.audio.volume}
        onChange={(event) => {
          const next = Number(event.target.value);
          setVolume(next);
          writeStorage(keys.volume, next);
          setAmbientLevel(next);
        }}
      />
    </div>
  );
}
