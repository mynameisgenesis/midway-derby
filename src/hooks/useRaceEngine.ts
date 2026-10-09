import { useCallback, useEffect, useRef, useState } from "react";
import { createRacePlan, liveOrder, type RacePlan } from "@/lib/race";
import { ensureAudio, sfx } from "@/lib/sound";

export type Phase = "countdown" | "racing" | "finished";
export const COUNTDOWN_S = 5;
export const INTERMISSION_S = 120;

export interface RaceResult {
  raceNumber: number;
  order: number[];
  at: number;
}
export interface EngineState {
  phase: Phase;
  elapsed: number;
  raceNumber: number;
  plan: RacePlan;
  paused: boolean;
  history: RaceResult[];
}
export interface Snapshot extends EngineState {
  order: number[];
}
export type DrawFn = (s: EngineState, now: number) => void;

const KEY = "midway-derby:v1";

export function useRaceEngine() {
  const stateRef = useRef<EngineState | null>(null);
  const drawRef = useRef<DrawFn | null>(null);
  const soundRef = useRef(false);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [confetti, setConfetti] = useState(0);
  const [sound, setSoundState] = useState(false);

  const publish = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const t = s.phase === "racing" ? s.elapsed : s.phase === "finished" ? 1e9 : 0;
    setSnap({ ...s, history: s.history, order: liveOrder(s.plan, t) });
  }, []);

  const startNext = useCallback((s: EngineState) => {
    s.raceNumber += 1;
    s.plan = createRacePlan(s.raceNumber);
    s.phase = "countdown";
    s.elapsed = 0;
  }, []);

  useEffect(() => {
    const speed = Math.max(1, Number(new URLSearchParams(window.location.search).get("speed")) || 1);
    let history: RaceResult[] = [];
    let raceNumber = 1;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && Array.isArray(saved.history)) {
        history = saved.history.slice(0, 12);
        raceNumber = (Number(saved.lastRace) || 0) + 1;
      }
    } catch {
      /* ignore */
    }
    stateRef.current = { phase: "countdown", elapsed: 0, raceNumber, plan: createRacePlan(raceNumber), paused: false, history };

    let raf = 0;
    let last = performance.now();
    let lastSnap = 0;
    let lastClop = 0;

    const advance = (s: EngineState) => {
      if (s.phase === "countdown") {
        const before = Math.ceil(COUNTDOWN_S - (s.elapsed - 0)); // shown number
        void before;
        if (s.elapsed >= COUNTDOWN_S) {
          s.phase = "racing";
          s.elapsed = 0;
          if (soundRef.current) sfx.go();
        }
      } else if (s.phase === "racing") {
        if (s.elapsed >= s.plan.duration) {
          s.phase = "finished";
          s.elapsed = 0;
          s.history = [{ raceNumber: s.raceNumber, order: s.plan.order, at: Date.now() }, ...s.history].slice(0, 12);
          try {
            localStorage.setItem(KEY, JSON.stringify({ history: s.history, lastRace: s.raceNumber }));
          } catch {
            /* ignore */
          }
          setConfetti((c) => c + 1);
          if (soundRef.current) sfx.fanfare();
        }
      } else if (s.elapsed >= INTERMISSION_S) {
        startNext(s);
      }
    };

    const loop = (now: number) => {
      const s = stateRef.current!;
      const dt = (Math.min(now - last, 100) / 1000) * speed;
      last = now;
      if (!s.paused) {
        const prevSec = Math.ceil(COUNTDOWN_S - s.elapsed);
        s.elapsed += dt;
        if (s.phase === "countdown" && soundRef.current && Math.ceil(COUNTDOWN_S - s.elapsed) < prevSec && prevSec > 1) sfx.tick();
        if (s.phase === "racing" && soundRef.current && now - lastClop > 140) {
          lastClop = now;
          sfx.clop();
        }
        advance(s);
      }
      drawRef.current?.(s, now);
      if (now - lastSnap > 100) {
        lastSnap = now;
        publish();
      }
      raf = requestAnimationFrame(loop);
    };
    // Background tabs stop rAF; resetting the clock means the show simply
    // resumes where it left off instead of jumping ahead.
    const onVis = () => {
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(loop);
    publish();
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [publish, startNext]);

  const raceNow = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "finished") return;
    startNext(s);
    s.paused = false;
    publish();
  }, [publish, startNext]);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    s.paused = !s.paused;
    publish();
  }, [publish]);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    if (next) ensureAudio();
    soundRef.current = next;
    setSoundState(next);
  }, []);

  const registerDraw = useCallback((fn: DrawFn | null) => {
    drawRef.current = fn;
  }, []);

  return { snap, confetti, sound, raceNow, togglePause, toggleSound, registerDraw };
}
