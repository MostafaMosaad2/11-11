import { paperSrc } from "virtual:voice-message";
import { story } from "../data/story";

const videoId = story.audio.youtubeId;

let player = null;
let playerReady = false;
let fadeFrame = 0;
let fadeToken = 0;
let attempt = 0;
let hold = null;
let startRequest = null;
let pendingLevel = 0.2;
let booted = false;
let apiPromise = null;
let softened = false;
let baseLevel = null;
let snapshot = { phase: "idle" };
const listeners = new Set();

function publish(next) {
  snapshot = next;
  listeners.forEach((listener) => listener(snapshot));
}

function clampVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.2;
  return Math.min(1, Math.max(0, number));
}

function ducked(level) {
  if (level <= 0.01) return 0;
  return Math.max(0.03, level * 0.36);
}

function currentLevel() {
  if (!playerReady || typeof player?.getVolume !== "function") return 0;
  const value = player.getVolume();
  return Number.isFinite(value) ? value / 100 : 0;
}

function applyLevel(level) {
  if (!playerReady || typeof player?.setVolume !== "function") return;
  player.setVolume(Math.round(Math.min(1, Math.max(0, level)) * 100));
}

export function softenAmbient() {
  if (softened) return;
  softened = true;
  if (hold || !playerReady || snapshot.phase !== "playing") return;
  baseLevel = currentLevel();
  fadeTo(ducked(baseLevel), 1600);
}

export function restoreAmbient() {
  const level = baseLevel;
  softened = false;
  baseLevel = null;
  if (level == null || hold || !playerReady || snapshot.phase !== "playing") return;
  fadeTo(level, 1000);
}

export function hasAmbient() {
  return Boolean(videoId);
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
  if (!playerReady) {
    done?.();
    return;
  }
  const from = currentLevel();
  const start = performance.now();
  let last = 0;
  const step = (now) => {
    if (token !== fadeToken) return;
    const progress = Math.min(1, (now - start) / ms);
    if (progress === 1 || now - last >= 70) {
      last = now;
      applyLevel(from + (target - from) * progress);
    }
    if (progress < 1) fadeFrame = window.requestAnimationFrame(step);
    else done?.();
  };
  fadeFrame = window.requestAnimationFrame(step);
}

function playbackState() {
  if (!playerReady || typeof player?.getPlayerState !== "function") return -1;
  return player.getPlayerState();
}

function watchPlayback() {
  const current = ++attempt;
  window.setTimeout(() => {
    if (current !== attempt || hold || !playerReady) return;
    if (snapshot.phase === "muted" || snapshot.phase === "suspended") return;
    const state = playbackState();
    if (state !== 1 && state !== 3) publish({ phase: "blocked" });
  }, 2000);
}

let silenceTimers = [];

function clearSilence() {
  silenceTimers.forEach((id) => window.clearTimeout(id));
  silenceTimers = [];
}

function stopPlayer() {
  if (!playerReady || typeof player?.pauseVideo !== "function") return;
  try {
    player.pauseVideo();
    player.mute();
  } catch {
    /* a later retry covers a dropped command */
  }
}

export function suspendAmbient() {
  if (hold) return hold.ready;
  let finish = () => {};
  const ready = new Promise((resolve) => {
    finish = resolve;
  });
  const queued = startRequest;
  const wasPlaying = snapshot.phase === "playing" || queued != null;
  const heard = snapshot.phase === "playing" ? currentLevel() : 0;
  const volume = heard > 0.01 ? heard : queued ?? pendingLevel;
  startRequest = null;
  attempt += 1;
  fadeToken += 1;
  window.cancelAnimationFrame(fadeFrame);
  hold = { wasPlaying, volume, ready, finish };
  if (!wasPlaying) {
    finish();
    return ready;
  }
  publish({ phase: "suspended" });
  clearSilence();
  stopPlayer();
  silenceTimers.push(window.setTimeout(stopPlayer, 160));
  silenceTimers.push(
    window.setTimeout(() => {
      stopPlayer();
      finish();
    }, 220),
  );
  return ready;
}

export function resumeAmbient() {
  if (!hold) return;
  const saved = hold;
  hold = null;
  saved.finish();
  clearSilence();
  fadeToken += 1;
  window.cancelAnimationFrame(fadeFrame);
  if (!saved.wasPlaying) {
    if (snapshot.phase === "suspended") publish({ phase: "muted" });
    return;
  }
  const level = clampVolume(saved.volume);
  pendingLevel = softened && baseLevel != null ? ducked(baseLevel) : level;
  if (!playerReady) {
    startRequest = pendingLevel;
    publish({ phase: "playing" });
    return;
  }
  applyLevel(0);
  try {
    player.unMute();
    player.playVideo();
  } catch {
    publish({ phase: "blocked" });
    return;
  }
  publish({ phase: "playing" });
  fadeTo(pendingLevel, 900);
  watchPlayback();
}

function loadApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("youtube")), 12000);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timer);
      if (typeof previous === "function") previous();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("youtube"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

function mount() {
  const existing = document.getElementById("ambient-yt");
  if (existing) return existing.querySelector("div") ?? existing;
  const wrap = document.createElement("div");
  wrap.id = "ambient-yt";
  wrap.className = "ambient-yt";
  wrap.setAttribute("aria-hidden", "true");
  wrap.inert = true;
  const slot = document.createElement("div");
  wrap.appendChild(slot);
  document.body.appendChild(wrap);
  return slot;
}

function handleReady() {
  playerReady = true;
  try {
    player.mute();
    player.setVolume(0);
  } catch {
    /* the first real play unmutes from the click */
  }
  if (hold || startRequest == null) return;
  const level = startRequest;
  startRequest = null;
  playAmbientFromGesture(level);
}

function handleState(event) {
  const state = event.data;
  if (hold?.wasPlaying && (state === 1 || state === 3)) {
    stopPlayer();
    return;
  }
  if (state === 0 && !hold && snapshot.phase === "playing") {
    player.seekTo(0, true);
    player.playVideo();
  }
}

function handleError(event) {
  const code = event?.data;
  if (code === 100 || code === 101 || code === 150) publish({ phase: "missing" });
  else if (snapshot.phase !== "suspended" && snapshot.phase !== "muted") publish({ phase: "blocked" });
}

function createPlayer() {
  if (player || !videoId || !window.YT?.Player) return;
  player = new window.YT.Player(mount(), {
    videoId,
    width: "200",
    height: "112",
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      origin: window.location.origin,
      playlist: videoId,
      playsinline: 1,
      rel: 0,
      loop: 1,
    },
    events: {
      onReady: handleReady,
      onStateChange: handleState,
      onError: handleError,
    },
  });
}

function boot() {
  if (booted || typeof window === "undefined" || !videoId) return;
  booted = true;
  loadApi()
    .then(createPlayer)
    .catch(() => publish({ phase: "missing" }));
}

boot();

export function playAmbientFromGesture(volume) {
  if (hold) return;
  const level = clampVolume(volume);
  const target = softened ? ducked(level) : level;
  if (softened) baseLevel = level;
  pendingLevel = target;
  if (!playerReady) {
    startRequest = level;
    return;
  }
  if (snapshot.phase === "playing") {
    fadeTo(target, 180);
    return;
  }
  applyLevel(0);
  try {
    player.unMute();
    player.playVideo();
  } catch {
    publish({ phase: "blocked" });
    return;
  }
  publish({ phase: "playing" });
  fadeTo(target, 1500);
  watchPlayback();
}

export function pauseAmbient() {
  if (hold) return;
  startRequest = null;
  attempt += 1;
  if (!playerReady) {
    publish({ phase: "muted" });
    return;
  }
  fadeTo(0, 420, () => {
    player?.pauseVideo();
    publish({ phase: "muted" });
  });
}

export function setAmbientLevel(volume) {
  if (hold) return;
  const level = clampVolume(volume);
  const target = softened ? ducked(level) : level;
  if (softened) baseLevel = level;
  pendingLevel = target;
  if (startRequest != null) startRequest = level;
  if (playerReady && snapshot.phase === "playing") applyLevel(target);
}

export function armAmbient(muted, volume) {
  if (!videoId) return;
  if (muted) {
    startRequest = null;
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
