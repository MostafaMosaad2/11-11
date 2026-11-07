export const keys = {
  stars: "yara-1111-stars",
  wish: "yara-1111-wish",
  word: "yara-1111-word",
  muted: "yara-1111-muted",
  volume: "yara-1111-volume",
  scene: "yara-1111-scene",
  memory: "yara-1111-memory",
  visited: "yara-1111-visited",
  fromGalaxy: "yara-1111-from-galaxy",
};

function readStore(kind, key, fallback) {
  try {
    const store = kind === "session" ? sessionStorage : localStorage;
    const raw = store.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStore(kind, key, value) {
  try {
    const store = kind === "session" ? sessionStorage : localStorage;
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeStore(kind, key) {
  try {
    const store = kind === "session" ? sessionStorage : localStorage;
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const readStorage = (key, fallback) => readStore("local", key, fallback);
export const writeStorage = (key, value) => writeStore("local", key, value);
export const removeStorage = (key) => removeStore("local", key);
export const readSession = (key, fallback) => readStore("session", key, fallback);
export const writeSession = (key, value) => writeStore("session", key, value);
export const removeSession = (key) => removeStore("session", key);

export function readStars() {
  const value = readStorage(keys.stars, null);
  if (!Array.isArray(value) || value.length !== 11) return Array(11).fill(false);
  return value.map(Boolean);
}

export function readWish() {
  const value = readStorage(keys.wish, null);
  return typeof value === "string" && value.trim() ? value : null;
}

export function normalizeWord(value) {
  if (typeof value !== "string") return "";
  return value.replace(/^\s+|\s+$/g, "").slice(0, 60);
}

export function readWord() {
  const value = normalizeWord(readStorage(keys.word, ""));
  return value || null;
}

export function readVolume() {
  const value = Number(readStorage(keys.volume, 0.55));
  if (!Number.isFinite(value)) return 0.55;
  return Math.min(1, Math.max(0, value));
}
