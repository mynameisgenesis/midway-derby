// Tiny Web Audio chiptune effects. The AudioContext is only created from a
// user gesture (the sound toggle), never automatically.
let ctx: AudioContext | null = null;

export function ensureAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, dur: number, delay = 0, type: OscillatorType = "square", vol = 0.05) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  tick: () => tone(587, 0.12),
  go: () => {
    tone(880, 0.35);
    tone(1175, 0.35, 0.05, "triangle", 0.04);
  },
  clop: () => tone(180 + Math.random() * 60, 0.04, 0, "triangle", 0.025),
  fanfare: () => {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.5 : 0.16, i * 0.15));
  },
};
