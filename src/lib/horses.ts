import midnight from "@/assets/horse-midnight-comet.jpg";
import copper from "@/assets/horse-copper-lightning.jpg";
import silver from "@/assets/horse-silver-stardust.jpg";
import golden from "@/assets/horse-golden-hour.jpg";
import painted from "@/assets/horse-painted-glory.jpg";

// Pixel-art palette values live here (sprite art, drawn to canvas).
export interface HorseColors {
  body: string;
  shade: string;
  highlight: string;
  mane: string;
  hoof: string;
  muzzle: string;
  marking: string;
  dapple?: string;
}
export interface Markings {
  blaze?: boolean;
  star?: boolean;
  socks?: number[]; // 0 back-far, 1 front-far, 2 back-near, 3 front-near
  dapple?: boolean;
  patches?: [number, number, number, number][];
  featherHoof?: boolean;
  tailHigh?: boolean;
  longMane?: boolean;
  twoToneMane?: boolean;
}
export interface Horse {
  id: string;
  number: number;
  name: string;
  breed: string;
  coat: string;
  description: string;
  portrait: string;
  silk: string;
  silkInk: string;
  colors: HorseColors;
  markings: Markings;
}

export const HORSES: Horse[] = [
  {
    id: "midnight-comet",
    number: 1,
    name: "Midnight Comet",
    breed: "Friesian",
    coat: "Jet black",
    description: "Flowing mane, feathered fetlocks and a high-stepping stride.",
    portrait: midnight,
    silk: "#c8352b",
    silkInk: "#fff4dc",
    colors: { body: "#231f25", shade: "#100d12", highlight: "#45404b", mane: "#08070a", hoof: "#3b3b3b", muzzle: "#2f2a31", marking: "#f6efe2" },
    markings: { featherHoof: true, longMane: true },
  },
  {
    id: "copper-lightning",
    number: 2,
    name: "Copper Lightning",
    breed: "Thoroughbred",
    coat: "Chestnut with blaze",
    description: "Lean, leggy sprinter with a white lightning blaze.",
    portrait: copper,
    silk: "#f3ead6",
    silkInk: "#c8352b",
    colors: { body: "#b5531f", shade: "#863813", highlight: "#d36d32", mane: "#7a2c0f", hoof: "#4a3426", muzzle: "#8c4a2c", marking: "#f6efe2" },
    markings: { blaze: true, socks: [2] },
  },
  {
    id: "silver-stardust",
    number: 3,
    name: "Silver Stardust",
    breed: "Arabian",
    coat: "Dapple gray",
    description: "Dished face, silver dapples and a proud, high tail.",
    portrait: silver,
    silk: "#2f5fa8",
    silkInk: "#fff4dc",
    colors: { body: "#cfcfcb", shade: "#9b9b97", highlight: "#ececE8", mane: "#f4f3ee", hoof: "#5a5550", muzzle: "#5e5e60", marking: "#ffffff", dapple: "#a7a7a2" },
    markings: { dapple: true, tailHigh: true },
  },
  {
    id: "golden-hour",
    number: 4,
    name: "Golden Hour",
    breed: "Quarter Horse",
    coat: "Palomino",
    description: "Muscular golden sprinter with a cream mane and star.",
    portrait: golden,
    silk: "#e8b52a",
    silkInk: "#2b2117",
    colors: { body: "#d8a043", shade: "#a8772a", highlight: "#efc46e", mane: "#f7edd2", hoof: "#5b4630", muzzle: "#8a6a45", marking: "#fdf8ea" },
    markings: { star: true },
  },
  {
    id: "painted-glory",
    number: 5,
    name: "Painted Glory",
    breed: "American Paint",
    coat: "Black & white tobiano",
    description: "Bold black-and-white patches, white blaze and stockings.",
    portrait: painted,
    silk: "#2f7a46",
    silkInk: "#fff4dc",
    colors: { body: "#211c1d", shade: "#110e0f", highlight: "#3e3739", mane: "#2a2425", hoof: "#6b625a", muzzle: "#3a3334", marking: "#f7f2ea" },
    markings: {
      blaze: true,
      socks: [0, 2, 3],
      twoToneMane: true,
      patches: [
        [11, 9, 5, 3],
        [17, 11, 4, 3],
        [9, 12, 3, 2],
        [21, 6, 2, 3],
        [22, 11, 2, 3],
      ],
    },
  },
];
