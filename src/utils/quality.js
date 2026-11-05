let webgl;

export function canUseWebGL() {
  if (webgl != null) return webgl;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    webgl = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}

export function visualQuality() {
  if (typeof navigator === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory;
  const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
  const lowMemory = typeof memory === "number" && memory <= 3;
  if (lowMemory || (narrow && cores <= 4 && lowMemory)) return "low";
  if (narrow || cores <= 4) return "medium";
  return "high";
}
