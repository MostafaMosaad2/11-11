import { useEffect, useRef } from "react";

const BOX = "/images/yara-bracelet/bracelet-gift-box.webp";
const PLATE = "/images/yara-bracelet/bracelet-box-empty.webp";
const MASK = "/images/yara-bracelet/bracelet-mask.png";
const SUN_X = 0.5012;
const SUN_Y = 0.5211;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function smooth(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function sampleParticles(source, mask, width, height) {
  const sprite = document.createElement("canvas");
  sprite.width = width;
  sprite.height = height;
  const ctx = sprite.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0, width, height);
  const alpha = ctx.getImageData(0, 0, width, height).data;
  const found = [];
  const step = width < 420 ? 3 : 2;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      if (alpha[index + 3] < 150) continue;
      const dx = x / width - SUN_X;
      const dy = (y / height - SUN_Y) * 1.35;
      found.push({
        x,
        y,
        r: pixels[index],
        g: pixels[index + 1],
        b: pixels[index + 2],
        dist: Math.hypot(dx * 1.7, dy),
        drift: ((x * 13 + y * 7) % 100) / 100,
      });
    }
  }
  const stride = Math.max(1, Math.ceil(found.length / 460));
  const points = stride === 1 ? found : found.filter((_, index) => index % stride === 0);
  return { sprite, points };
}

export default function BraceletDissolve({ active, onReady, onFallback }) {
  const canvasRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const onFallbackRef = useRef(onFallback);

  useEffect(() => {
    onReadyRef.current = onReady;
    onFallbackRef.current = onFallback;
  }, [onReady, onFallback]);

  useEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: true });
    const run = { frame: 0, cancelled: false };
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    const started = performance.now();
    const duration = 4300;
    const erase = document.createElement("canvas");
    const eraseCtx = erase.getContext("2d");

    const paint = (plate, field, width, height, progress) => {
      const sunX = width * SUN_X;
      const sunY = height * SUN_Y;
      const t = reduced ? 1 : progress;
      const glowIn = smooth(t / 0.16);
      const leave = smooth((t - 0.12) / 0.66);
      const glowOut = 1 - smooth((t - 0.72) / 0.2);
      const glow = glowIn * (0.72 + 0.28 * glowOut);

      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(plate, 0, 0, width, height);

      if (leave < 0.995) {
        eraseCtx.setTransform(1, 0, 0, 1, 0, 0);
        eraseCtx.globalCompositeOperation = "source-over";
        eraseCtx.clearRect(0, 0, width, height);
        eraseCtx.drawImage(field.sprite, 0, 0);
        eraseCtx.globalCompositeOperation = "destination-out";
        const reach = Math.max(width, height) * (0.16 + leave * 1.05);
        const gradient = eraseCtx.createRadialGradient(sunX, sunY, width * 0.015, sunX, sunY, reach);
        const core = smooth(Math.max(0, leave - 0.45) / 0.55);
        gradient.addColorStop(0, `rgba(0,0,0,${core})`);
        gradient.addColorStop(0.4, `rgba(0,0,0,${leave * 0.75})`);
        gradient.addColorStop(1, `rgba(0,0,0,${Math.min(1, leave * 1.2)})`);
        eraseCtx.fillStyle = gradient;
        eraseCtx.fillRect(0, 0, width, height);
        ctx.drawImage(erase, 0, 0, width, height);
      }

      if (!reduced) {
        for (const point of field.points) {
          const order = clamp(1 - point.dist / 0.62);
          const local = clamp((leave - order * 0.52) / 0.48);
          if (local <= 0) continue;
          const rise = local * local * height * 0.5;
          const sway = Math.sin(point.drift * 6.2 + local * 2.2) * 11 * local;
          ctx.globalAlpha = (1 - local) * 0.92;
          ctx.fillStyle = `rgb(${point.r},${point.g},${point.b})`;
          ctx.beginPath();
          ctx.arc(point.x + sway, point.y - rise, 1.05 + (1 - local) * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "screen";
      ctx.translate(sunX, sunY);
      ctx.scale(1.85, 0.7);
      const bloom = ctx.createRadialGradient(0, 0, width * 0.02, 0, 0, width * 0.26);
      bloom.addColorStop(0, `rgba(255, 228, 186, ${0.42 * glow})`);
      bloom.addColorStop(0.42, `rgba(176, 64, 58, ${0.28 * glow})`);
      bloom.addColorStop(1, "rgba(120, 32, 40, 0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(-width, -height, width * 2, height * 2);
      ctx.restore();
      if (glowOut > 0.4) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = glowOut * 0.85;
        ctx.fillStyle = "#fff6e4";
        ctx.beginPath();
        ctx.arc(sunX, sunY, 1.2 + glowOut, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const boot = async () => {
      try {
        const [box, plate, mask] = await Promise.all([loadImage(BOX), loadImage(PLATE), loadImage(MASK)]);
        if (run.cancelled) return;
        const bounds = canvas.getBoundingClientRect();
        const width = Math.max(2, Math.round(bounds.width) || 320);
        const height = Math.max(2, Math.round(bounds.height) || Math.round((width * 1448) / 1086));
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        erase.width = width;
        erase.height = height;
        const field = sampleParticles(box, mask, width, height);
        const draw = (now) => {
          if (run.cancelled) return;
          const progress = clamp((now - started) / duration);
          paint(plate, field, width, height, progress);
          if (reduced || progress >= 1) return;
          run.frame = document.hidden
            ? window.setTimeout(() => draw(performance.now()), 64)
            : window.requestAnimationFrame(draw);
        };
        paint(plate, field, width, height, reduced ? 1 : 0);
        onReadyRef.current?.();
        if (!reduced) {
          run.frame = document.hidden
            ? window.setTimeout(() => draw(performance.now()), 64)
            : window.requestAnimationFrame(draw);
        }
      } catch {
        if (!run.cancelled) onFallbackRef.current?.();
      }
    };

    boot();
    return () => {
      run.cancelled = true;
      window.cancelAnimationFrame(run.frame);
      window.clearTimeout(run.frame);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="bracelet-canvas" aria-hidden="true" />;
}
