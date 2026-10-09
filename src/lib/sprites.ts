import type { Horse } from "./horses";

// 32x22 pixel horse facing right, drawn at 1 canvas unit per pixel.
export const SPRITE_W = 32;
export const NOSE_X = 31;

// leg x-offsets of hooves: [backFar, frontFar, backNear, frontNear]
const LEG_FRAMES = [
  [-3, 3, -2, 4],
  [-1, 1, 0, 2],
  [2, -2, 3, -1],
  [0, 0, 1, 1],
];
const LEG_BASE = [10, 21, 8, 19];

const DIGITS: Record<number, string[]> = {
  1: ["010", "110", "010", "010", "111"],
  2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "011", "001", "111"],
  4: ["101", "101", "111", "001", "001"],
  5: ["111", "100", "111", "001", "111"],
};

const SKIN = "#e8b48a";

export function drawHorse(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  h: Horse,
  frame: number,
  moving: boolean,
) {
  const C = h.colors;
  const M = h.markings;
  const rect = (x: number, y: number, w: number, hh: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(ox + x, oy + y, w, hh);
  };
  const px = (x: number, y: number, c: string) => rect(x, y, 1, 1, c);
  const offs: number[] = moving ? LEG_FRAMES[frame % 4]! : [0, 0, 0, 0];

  // shadow
  ctx.fillStyle = "rgba(60,30,10,0.28)";
  ctx.fillRect(ox + 7, oy + 21, 20, 1);

  const leg = (i: number) => {
    const bx = LEG_BASE[i]!;
    const o = offs[i]!;
    const far = i < 2;
    const col = far ? C.shade : C.body;
    const white = M.socks?.includes(i);
    const lift = moving && Math.abs(o) <= 1 && frame % 2 === 0 ? 1 : 0;
    rect(bx, 15, 2, 3, col);
    const lx = bx + Math.round(o / 2);
    const hx = bx + o;
    rect(lx, 18 - lift, 2, 1, white ? C.marking : col);
    rect(hx, 19 - lift, 2, 1, white ? C.marking : col);
    if (M.featherHoof) rect(hx - 1, 19 - lift, 1, 2, far ? C.mane : C.highlight);
    rect(hx, 20 - lift, 2, 1, C.hoof);
  };

  leg(0);
  leg(1);

  // tail
  const wave = moving && frame % 2 ? 1 : 0;
  const tail: number[][] = M.tailHigh
    ? [[7, 9], [6, 8], [5, 8], [4, 9], [3, 10], [3 - wave, 11], [2 - wave, 12], [2 - wave, 13]]
    : [[7, 10], [6, 10], [5, 11], [4, 11], [4, 12], [3 - wave, 13], [3 - wave, 14], [2 - wave, 15], [2 - wave, 16]];
  if (M.longMane) tail.push([1 - wave, 17]);
  tail.forEach(([x, y], k) => rect(x!, y!, 2, 1, M.twoToneMane && k > 4 ? C.marking : C.mane));

  // body
  rect(9, 9, 14, 1, C.body);
  rect(8, 10, 16, 4, C.body);
  rect(9, 14, 14, 1, C.body);
  rect(10, 14, 11, 1, C.shade);
  rect(10, 9, 10, 1, C.highlight);
  rect(22, 8, 3, 6, C.body);
  // neck
  rect(21, 6, 4, 3, C.body);
  rect(22, 4, 4, 2, C.body);
  rect(23, 3, 3, 1, C.body);
  // head
  rect(24, 2, 5, 3, C.body);
  rect(26, 4, 5, 2, C.body);
  rect(28, 6, 3, 1, C.muzzle);
  rect(29, 5, 2, 1, C.muzzle);
  px(24, 1, C.body);
  px(24, 0, C.shade);
  px(26, 1, C.shade);
  px(25, 2, C.highlight);

  if (M.dapple && C.dapple) {
    [[10, 11], [13, 10], [16, 12], [19, 11], [12, 13], [21, 10], [15, 13], [18, 10], [23, 7], [11, 10]].forEach(([x, y]) =>
      px(x!, y!, C.dapple!),
    );
  }
  M.patches?.forEach(([x, y, w, hh]) => rect(x, y, w, hh, C.marking));
  if (M.blaze) [[27, 2], [28, 2], [28, 3], [29, 4], [30, 4]].forEach(([x, y]) => px(x!, y!, C.marking));
  if (M.star) {
    px(27, 2, C.marking);
    px(28, 2, C.marking);
  }
  px(26, 3, "#0b0b0b");
  px(30, 5, "#0b0b0b");

  // mane
  const mane = C.mane;
  rect(23, 1, 2, 2, mane);
  rect(22, 3, 2, 1, mane);
  rect(21, 4, 2, 2, mane);
  rect(20, 6, 2, 2, mane);
  rect(20, 8, 2, 1, mane);
  if (M.longMane) {
    rect(19 - wave, 5, 2, 4, mane);
    px(25, 2, mane);
  }
  if (M.twoToneMane) {
    rect(21, 4, 1, 2, C.marking);
    px(20, 7, C.marking);
  }

  leg(2);
  leg(3);

  // saddle cloth with number
  rect(12, 9, 7, 5, h.silk);
  rect(12, 13, 7, 1, "#e8b52a");
  const digit = DIGITS[h.number] ?? [];
  digit.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === "1") px(14 + c, 8 + r, h.silkInk);
    }),
  );

  // jockey
  rect(16, 7, 3, 2, "#f2ead8");
  rect(18, 9, 2, 3, "#2a1a10");
  rect(14, 4, 5, 3, h.silk);
  rect(15, 3, 3, 1, h.silk);
  rect(18, 1, 3, 2, h.silk);
  px(21, 2, h.silk);
  rect(19, 3, 2, 1, SKIN);
  rect(19, 5, 3, 1, h.silk);
  px(22, 5, SKIN);
  px(14, 5, "rgba(0,0,0,0.25)");
}
