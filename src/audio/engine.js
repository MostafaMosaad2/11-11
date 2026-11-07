import { ambientSrc, paperSrc } from "virtual:voice-message";

let audio = null;
let fadeFrame = 0;
let fadeToken = 0;
let hold = null;
let snapshot = { phase: "idle" };
const listeners = new Set();

function publish(next) {
  snapshot = next;
  listeners.forEach((listener) => listener(snapshot));
}

function clampVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.55;
  return Math.min(1, Math.max(0, number));
}

let softened = false;
let baseLevel = null;

function ducked(level) {
  if (level <= 0.01) return 0;
  return Math.max(0.03, level * 0.36);
}

export function softenAmbient() {
  if (softened) return;
  softened = true;
  if (hold || !audio || snapshot.phase !== "playing") return;
  baseLevel = audio.volume;
  fadeTo(ducked(baseLevel), 1600);
}

export function restoreAmbient() {
  const level = baseLevel;
  softened = false;
  baseLevel = null;
  if (level == null || hold || !audio || snapshot.phase !== "playing") return;
  fadeTo(level, 1000);
}

export function hasAmbient() {
  return Boolean(ambientSrc);
}

export function getAmbientSnapshot() {
  return snapshot;
}

export function subscribeAmbient(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function fadeTo(target, ms, done) {
  window.cancelAnimationFrame(fadeFrame);
  const token = ++fadeToken;
  const node = audio;
  if (!node) {
    done?.();
    return;
  }
  const from = node.volume;
  const start = performance.now();
  const step = (now) => {
    if (token !== fadeToken) return;
    const progress = Math.min(1, (now - start) / ms);
    node.volume = from + (target - from) * progress;
    if (progress < 1) fadeFrame = window.requestAnimationFrame(step);
    else done?.();
  };
  fadeFrame = window.requestAnimationFrame(step);
}

export function suspendAmbient() {
  if (hold) return hold.ready;
  let finish = () => {};
  const ready = new Promise((resolve) => {
    finish = resolve;
  });
  const node = audio;
  const wasPlaying = snapshot.phase === "playing" && Boolean(node) && !node.paused;
  hold = { wasPlaying, volume: node ? node.volume : 0, ready, finish };
  if (!wasPlaying || !node) {
    finish();
    return ready;
  }
  publish({ phase: "suspended" });
  fadeTo(0, 480, () => {
    if (!hold?.wasPlaying || !audio) {
      finish();
      return;
    }
    audio.pause();
    publish({ phase: "suspended" });
    finish();
  });
  return ready;
}

export function resumeAmbient() {
  if (!hold) return;
  const saved = hold;
  hold = null;
  saved.finish();
  fadeToken += 1;
  window.cancelAnimationFrame(fadeFrame);
  if (!saved.wasPlaying || !audio) {
    if (snapshot.phase === "suspended") publish({ phase: "muted" });
    return;
  }
  const level = clampVolume(saved.volume);
  audio.volume = 0;
  audio
    .play()
    .then(() => {
      publish({ phase: "playing" });
      fadeTo(level, 900);
    })
    .catch(() => publish({ phase: "blocked" }));
}

function ensure() {
  if (!ambientSrc) return null;
  if (audio) return audio;
  const node = new Audio(ambientSrc);
  node.loop = true;
  node.preload = "none";
  node.addEventListener("error", () => publish({ phase: "missing" }));
  audio = node;
  return node;
}

export function playAmbientFromGesture(volume) {
  if (hold) return;
  const node = ensure();
  if (!node || snapshot.phase === "missing") return;
  const level = clampVolume(volume);
  if (snapshot.phase === "playing") {
    if (softened) baseLevel = level;
    fadeTo(softened ? ducked(level) : level, 180);
    return;
  }
  node.volume = 0;
  node
    .play()
    .then(() => {
      publish({ phase: "playing" });
      if (softened) {
        baseLevel = level;
        fadeTo(ducked(level), 1500);
      } else fadeTo(level, 1500);
    })
    .catch(() => publish({ phase: "blocked" }));
}

export function pauseAmbient() {
  if (hold) return;
  if (!audio) {
    publish({ phase: "muted" });
    return;
  }
  fadeTo(0, 420, () => {
    audio?.pause();
    publish({ phase: "muted" });
  });
}

export function setAmbientLevel(volume) {
  if (hold) return;
  const level = clampVolume(volume);
  if (softened) baseLevel = level;
  if (audio && snapshot.phase === "playing") audio.volume = softened ? ducked(level) : level;
}

export function armAmbient(muted, volume) {
  if (!ambientSrc) return;
  if (muted) {
    publish({ phase: "muted" });
    return;
  }
  playAmbientFromGesture(volume);
}

export function playPaper() {
  if (!paperSrc) return;
  const node = new Audio(paperSrc);
  node.volume = 0.4;
  node.play().catch(() => {});
}
