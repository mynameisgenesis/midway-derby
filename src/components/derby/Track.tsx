import { useEffect, useRef, useState, type ReactNode } from "react";
import { HORSES } from "@/lib/horses";
import { drawHorse, NOSE_X } from "@/lib/sprites";
import { isMoving, position } from "@/lib/race";
import type { DrawFn } from "@/hooks/useRaceEngine";

export const H = 200;
export const Y0 = 58;
export const LANE_H = 26;

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const P = {
  sky: "#f7e9c6",
  red: "#c8352b",
  cream: "#f5eedb",
  gold: "#e8b52a",
  green: "#2f6b45",
  stand: "#2d5238",
  standDark: "#22412c",
  grass: "#4f7d3f",
  dirtA: "#bd8450",
  dirtB: "#b47a48",
  rope: "#5a3a22",
  ink: "#2b2117",
};

function buildBackground(W: number, startX: number, finishX: number) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const rng = mulberry32(11);
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  r(0, 0, W, Y0, P.sky);
  // grandstand
  r(0, 19, W, 30, P.stand);
  const crowd = ["#f1c9a0", "#d79b6b", "#8a5a3b", "#5b3a26", "#f6d9b5"];
  const shirts = [P.red, P.gold, P.cream, "#2f5fa8", "#7d3b8c", "#e07a2f", P.green];
  for (let y = 21; y <= 41; y += 6) {
    r(0, y + 4, W, 1, P.standDark);
    for (let x = 1; x < W - 1; x += 3 + (rng() < 0.3 ? 1 : 0)) {
      if (rng() < 0.12) continue;
      r(x, y, 2, 2, crowd[Math.floor(rng() * crowd.length)]!);
      r(x, y + 2, 2, 2, shirts[Math.floor(rng() * shirts.length)]!);
    }
  }
  for (let x = 30; x < W; x += 64) r(x, 17, 2, 32, P.cream);
  // striped awning
  for (let x = 0, i = 0; x < W; x += 6, i++) {
    const col = i % 2 ? P.cream : P.red;
    r(x, 10, 6, 7, col);
    r(x + 1, 17, 4, 1, col);
    r(x + 2, 18, 2, 1, col);
  }
  r(0, 9, W, 1, P.ink);
  // bunting
  r(0, 2, W, 1, P.rope);
  const flags = [P.red, P.gold, P.green, P.cream];
  for (let x = 0, i = 0; x < W; x += 8, i++) {
    for (let k = 0; k < 4; k++) r(x + k, 3 + k, 7 - 2 * k, 1, flags[i % 4]!);
  }
  // front rail & grass
  r(0, 49, W, 9, P.grass);
  r(0, 51, W, 2, P.cream);
  for (let x = 2; x < W; x += 10) r(x, 51, 1, 7, P.cream);
  // lanes
  for (let i = 0; i < 5; i++) {
    const y = Y0 + i * LANE_H;
    r(0, y, W, LANE_H, i % 2 ? P.dirtB : P.dirtA);
    for (let k = 0; k < W * 1.4; k++) {
      r(Math.floor(rng() * W), y + Math.floor(rng() * LANE_H), 1, 1, rng() < 0.5 ? "#a96e3f" : "#c99462");
    }
    if (i > 0) for (let x = 0; x < W; x += 6) r(x, y, 4, 1, "#ecdcb8");
  }
  const bottom = Y0 + 5 * LANE_H;
  r(0, bottom, W, H - bottom, P.grass);
  r(0, bottom + 1, W, 2, P.cream);
  for (let x = 2; x < W; x += 10) r(x, bottom + 1, 1, 6, P.cream);
  // start line
  r(startX, Y0, 1, 5 * LANE_H, P.cream);
  // checkered finish
  for (let y = Y0; y < bottom; y += 2) for (let x = 0; x < 4; x += 2) r(finishX + x, y, 2, 2, ((y - Y0) / 2 + x / 2) % 2 ? P.ink : "#fbf6ea");
  // finish post + flag
  r(finishX + 5, 22, 1, Y0 - 22, P.cream);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) r(finishX + 6 + x, 22 + y, 1, 1, (x + y) % 2 ? P.ink : "#fbf6ea");
  return c;
}

interface Dust {
  x: number;
  y: number;
  life: number;
  vx: number;
}

export function Track({
  registerDraw,
  places,
  children,
}: {
  registerDraw: (fn: DrawFn | null) => void;
  places: Record<number, number>;
  children?: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [W, setW] = useState(380);
  const [cssH, setCssH] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (!e) return;
      const w = e.contentRect.width;
      const lw = Math.round(Math.min(420, Math.max(200, w / 2.6)));
      setW(lw);
      setCssH((w * H) / lw);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const startX = 36;
    const finishX = W - 40;
    const bg = buildBackground(W, startX, finishX);
    const dust: Dust[] = [];
    let lastNow = 0;
    registerDraw((s, now) => {
      const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0;
      lastNow = now;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bg, 0, 0);
      const t = s.phase === "racing" ? s.elapsed : s.phase === "finished" ? 1e9 : 0;
      // dust
      for (let k = dust.length - 1; k >= 0; k--) {
        const d = dust[k]!;
        if (!s.paused) {
          d.life -= dt * 1.8;
          d.x += d.vx * dt;
        }
        if (d.life <= 0) {
          dust.splice(k, 1);
          continue;
        }
        ctx.fillStyle = `rgba(222,190,140,${d.life * 0.8})`;
        ctx.fillRect(Math.round(d.x), Math.round(d.y - (1 - d.life) * 3), 1, 1);
      }
      HORSES.forEach((h, i) => {
        const hp = s.plan.horses[i]!;
        const pos = position(hp, t);
        let moving = !s.paused && s.phase === "racing" && isMoving(hp, t);
        let frame = moving ? Math.floor(now / 75 + i * 1.7) % 4 : 1;
        if (s.phase === "finished" && i === s.plan.winner && !s.paused) {
          moving = true;
          frame = Math.floor(now / 220) % 4;
        }
        const ox = Math.round(startX + pos * (finishX - startX) - NOSE_X);
        const oy = Y0 + i * LANE_H + 3 + (moving && frame % 2 ? -1 : 0);
        if (moving && s.phase === "racing" && Math.random() < 0.6 && dust.length < 200) {
          dust.push({ x: ox + 6 + Math.random() * 6, y: Y0 + i * LANE_H + 22 + Math.random() * 2, life: 1, vx: -8 - Math.random() * 10 });
        }
        drawHorse(ctx, ox, oy, h, frame, moving);
      });
    });
    return () => registerDraw(null);
  }, [W, registerDraw]);

  const scale = cssH / H;

  return (
    <div className="flex">
      <div className="relative w-[6.5rem] shrink-0 sm:w-44" style={{ height: cssH || undefined }}>
        <div
          className="absolute inset-x-0 top-0 flex items-end justify-center pb-1 font-display text-[0.5rem] uppercase tracking-widest text-secondary sm:text-[0.6rem]"
          style={{ height: Y0 * scale }}
        >
          Lane
        </div>
        {HORSES.map((h, i) => (
          <div
            key={h.id}
            className="lane-label absolute inset-x-0 flex items-center gap-1.5 px-1.5 sm:gap-2 sm:px-2"
            style={{ top: (Y0 + i * LANE_H) * scale, height: LANE_H * scale }}
          >
            <span
              className="grid h-5 w-5 shrink-0 place-items-center rounded-sm font-display text-[0.55rem] shadow-pixel sm:h-7 sm:w-7 sm:text-xs"
              style={{ backgroundColor: h.silk, color: h.silkInk }}
            >
              {h.number}
            </span>
            <span className="min-w-0 flex-1 text-[0.7rem] leading-tight font-semibold text-foreground sm:text-base">{h.name}</span>
            {places[i] && (
              <span className="shrink-0 rounded-sm bg-accent px-1 font-display text-[0.5rem] text-accent-foreground sm:text-[0.6rem]">
                {ordinal(places[i])}
              </span>
            )}
          </div>
        ))}
      </div>
      <div ref={wrapRef} className="relative min-w-0 flex-1">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full"
          style={{ imageRendering: "pixelated", height: cssH || undefined }}
          aria-label="Pixel race track with five horses"
          role="img"
        />
        {children}
      </div>
    </div>
  );
}

export function ordinal(n: number) {
  return n + (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th");
}
