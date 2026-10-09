// Pure race simulation. A plan is generated up-front: the winner is chosen
// uniformly at random, then every horse gets a monotonic burst/pause timeline
// that reaches the finish line exactly at its assigned finish time.

export interface Segment {
  t0: number;
  t1: number;
  d0: number;
  d1: number;
  burst: boolean;
}
export interface HorsePlan {
  segments: Segment[];
  finishTime: number;
}
export interface RacePlan {
  raceNumber: number;
  winner: number;
  horses: HorsePlan[];
  order: number[];
  duration: number;
}

export const HORSE_COUNT = 5;
export const RUNOUT = 1.05;
const RUNOUT_TIME = 0.9;

export type Rng = () => number;

export function pickWinner(rng: Rng = Math.random) {
  return Math.min(HORSE_COUNT - 1, Math.floor(rng() * HORSE_COUNT));
}

function buildHorse(T: number, rng: Rng): HorsePlan {
  const style = rng() * 2 - 1; // >0 early speed, <0 closer
  const pieces: { dur: number; burst: boolean }[] = [];
  let sum = 0;
  while (sum < T) {
    const b = 0.28 + rng() * 0.5;
    pieces.push({ dur: b, burst: true });
    sum += b;
    const p = 0.08 + rng() * 0.42;
    pieces.push({ dur: p, burst: false });
    sum += p;
  }
  const last = pieces[pieces.length - 1]!;
  if (!last.burst) {
    pieces.pop();
    sum -= last.dur;
  }
  const k = T / sum;
  let t = 0;
  const weights: number[] = [];
  for (const pc of pieces) {
    pc.dur *= k;
    const mid = (t + pc.dur / 2) / T;
    weights.push(pc.burst ? (0.45 + rng() * 1.1) * (1 + style * 0.7 * (0.5 - mid)) : 0);
    t += pc.dur;
  }
  const total = weights.reduce((a, b) => a + b, 0);
  const segments: Segment[] = [];
  let tt = 0;
  let d = 0;
  pieces.forEach((pc, i) => {
    const nd = d + weights[i]! / total;
    segments.push({ t0: tt, t1: tt + pc.dur, d0: d, d1: nd, burst: pc.burst });
    tt += pc.dur;
    d = nd;
  });
  const end = segments[segments.length - 1]!;
  end.d1 = 1;
  end.t1 = T;
  return { segments, finishTime: T };
}

export function createRacePlan(raceNumber: number, rng: Rng = Math.random): RacePlan {
  const winner = pickWinner(rng);
  const D = 30 + rng() * 9;
  const others = [0, 1, 2, 3, 4].filter((i) => i !== winner);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [others[i], others[j]] = [others[j]!, others[i]!];
  }
  const finish: number[] = new Array(HORSE_COUNT).fill(0);
  finish[winner] = D;
  let t = D;
  for (const o of others) {
    t += 0.2 + rng() * 0.9;
    finish[o] = t;
  }
  const horses = finish.map((T) => buildHorse(T, rng));
  const order = [0, 1, 2, 3, 4].sort((a, b) => finish[a]! - finish[b]!);
  const duration = Math.max(...finish) + RUNOUT_TIME + 0.4;
  return { raceNumber, winner, horses, order, duration };
}

const smooth = (u: number) => u * u * (3 - 2 * u);

export function position(hp: HorsePlan, t: number): number {
  if (t <= 0) return 0;
  if (t >= hp.finishTime) {
    return Math.min(RUNOUT, 1 + (RUNOUT - 1) * ((t - hp.finishTime) / RUNOUT_TIME));
  }
  for (const s of hp.segments) {
    if (t < s.t1) {
      if (!s.burst) return s.d0;
      return s.d0 + (s.d1 - s.d0) * smooth((t - s.t0) / (s.t1 - s.t0));
    }
  }
  return 1;
}

export function isMoving(hp: HorsePlan, t: number): boolean {
  if (t <= 0) return false;
  if (t >= hp.finishTime) return t < hp.finishTime + RUNOUT_TIME;
  for (const s of hp.segments) if (t < s.t1) return s.burst;
  return false;
}

/** Current running order (leader first). */
export function liveOrder(plan: RacePlan, t: number): number[] {
  return [0, 1, 2, 3, 4].sort((a, b) => {
    const pa = Math.min(1, position(plan.horses[a]!, t));
    const pb = Math.min(1, position(plan.horses[b]!, t));
    if (pa >= 1 && pb >= 1) return plan.horses[a]!.finishTime - plan.horses[b]!.finishTime;
    return pb - pa;
  });
}
