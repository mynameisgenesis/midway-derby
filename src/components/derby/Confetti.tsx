import { useEffect, useRef } from "react";

export function Confetti({ fire }: { fire: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!fire) return;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const css = getComputedStyle(document.documentElement);
    const colors = ["--primary", "--accent", "--secondary", "--card"].map((v) => css.getPropertyValue(v).trim() || "#e8b52a");
    const parts = Array.from({ length: 180 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const sp = 6 + Math.random() * 9;
      return {
        x: c.width / 2 + (Math.random() - 0.5) * c.width * 0.3,
        y: c.height * 0.55,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        s: 5 + Math.floor(Math.random() * 5),
        col: colors[Math.floor(Math.random() * colors.length)] ?? "#e8b52a",
        rot: Math.random() * 6,
      };
    });
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const el = now - start;
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of parts) {
        p.vy += 0.25;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += 0.2;
        ctx.globalAlpha = Math.max(0, 1 - el / 3800);
        ctx.fillStyle = p.col;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, Math.max(2, Math.round(p.s * Math.abs(Math.cos(p.rot)))));
      }
      if (el < 3800) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, c.width, c.height);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, c.width, c.height);
    };
  }, [fire]);
  return <canvas ref={ref} data-testid="confetti" className="pointer-events-none fixed inset-0 z-50 h-full w-full" aria-hidden />;
}
