import { useEffect, useRef } from "react";

export default function Starfield({ rush = false, reduced = false, offsetRef = null, className = "starfield" }) {
  const canvasRef = useRef(null);
  const rushRef = useRef(rush);

  useEffect(() => {
    rushRef.current = rush;
  }, [rush]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return undefined;

    const stars = [];
    const view = { w: 0, h: 0 };
    const glowLayers = { nebula: null, nebulaB: null };
    let frame = 0;
    const loopState = { running: true };

    function seed(width) {
      const count = reduced ? 140 : width < 720 ? 560 : 1200;
      for (let index = 0; index < count; index += 1) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          z: Math.random(),
          size: Math.random() < 0.07 ? 2.1 : 0.7 + Math.random() * 0.9,
          gold: Math.random() < 0.22,
          tw: Math.random() * Math.PI * 2,
          drift: 0.35 + Math.random() * 0.9,
        });
      }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, reduced ? 1 : 1.5);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      view.w = rect.width;
      view.h = rect.height;
      if (stars.length === 0) seed(rect.width);
      const glow = ctx.createRadialGradient(view.w * 0.5, view.h * 0.36, 0, view.w * 0.5, view.h * 0.36, view.w * 0.62);
      glow.addColorStop(0, "rgba(60,16,37,0.78)");
      glow.addColorStop(0.48, "rgba(60,16,37,0.16)");
      glow.addColorStop(1, "rgba(8,8,16,0)");
      glowLayers.nebula = glow;
      const wine = ctx.createRadialGradient(view.w * 0.74, view.h * 0.72, 0, view.w * 0.74, view.h * 0.72, view.w * 0.32);
      wine.addColorStop(0, "rgba(167,29,69,0.18)");
      wine.addColorStop(1, "rgba(167,29,69,0)");
      glowLayers.nebulaB = wine;
    }

    function draw() {
      if (!view.w) return;
      const ox = offsetRef?.current?.x || 0;
      const oy = offsetRef?.current?.y || 0;
      const rushing = rushRef.current && !reduced;
      ctx.fillStyle = "#080810";
      ctx.fillRect(0, 0, view.w, view.h);
      if (glowLayers.nebula) {
        ctx.fillStyle = glowLayers.nebula;
        ctx.fillRect(0, 0, view.w, view.h);
      }
      if (glowLayers.nebulaB) {
        ctx.fillStyle = glowLayers.nebulaB;
        ctx.fillRect(0, 0, view.w, view.h);
      }

      for (const star of stars) {
        if (!reduced) {
          star.y -= 0.00012 * star.drift;
          if (star.y < 0) star.y += 1;
          star.tw += 0.018;
        }
        if (rushing) {
          star.x += (0.5 - star.x) * 0.042;
          star.y += (0.42 - star.y) * 0.042;
        }
        const depth = 0.08 + star.z * 0.22;
        const px = star.x * view.w + ox * depth;
        const py = star.y * view.h + oy * depth;
        const flicker = reduced ? 1 : 0.62 + Math.sin(star.tw) * 0.38;
        const alpha = (0.28 + star.z * 0.62) * flicker;
        ctx.fillStyle = star.gold ? `rgba(214,183,122,${alpha})` : `rgba(247,240,232,${alpha})`;
        ctx.fillRect(px, py, star.size, star.size);
      }
    }

    function loop() {
      if (!loopState.running) return;
      draw();
      frame = window.requestAnimationFrame(loop);
    }

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) draw();
    });
    observer.observe(canvas);
    if (reduced) draw();
    else loop();

    return () => {
      loopState.running = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [offsetRef, reduced]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
