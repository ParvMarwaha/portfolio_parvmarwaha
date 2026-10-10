// The site's colours. The default is Cobalt on white (a blue cover card on a white page, so the project pictures
// stand out); the colour button in the top bar throws a new, randomly generated palette at the whole site each
// time it is pressed. The earlier cream version of Cobalt is kept as "Cobalt Cream" and turns up now and then.
//
// The CSS variables keep their old names, so read them as roles:
//   --cobalt    = primary    (cover card, footer, emphasised words)
//   --vermilion = accent     (Hire me, small marks)
//   --butter    = highlight  (the italic line on the primary colour)
//   --deep      = a dark surface (game board, project hero), --on-deep = text on it, --spark = a bright accent on it
// Text on the primary colour is always `paper`, and the generator below never lets that, white-on-accent or
// highlight-on-primary fall under readable contrast.
import { alpha, contrast, hsl, mix } from "@/utils/color";

export type Fx = "none" | "xray";

export interface Palette {
  paper: string;
  paper2: string;
  ink: string;
  mute: string;
  line: string;
  primary: string;
  accent: string;
  highlight: string;
  deep: string;
  onDeep: string;
  /** A bright accent that reads on `deep` (the highlight can be dark in x-ray themes). */
  spark: string;
}

export interface Theme {
  name: string;
  /** none: plain colours. xray: a dark, glowing scheme. Project pictures are never recoloured by a theme. */
  fx: Fx;
  vars: Palette;
}

/** The default: a blue cover card on a plain white page. */
export const COBALT: Theme = {
  name: "Cobalt",
  fx: "none",
  vars: {
    paper: "#FFFFFF",
    paper2: "#F1F1F5",
    ink: "#0E0F1A",
    mute: "#6D6B78",
    line: "rgba(14, 15, 26, 0.14)",
    primary: "#2D3BFF",
    accent: "#FF4D1F",
    highlight: "#FFD84D",
    deep: "#0E0F1A",
    onDeep: "#F4F2EC",
    spark: "#FFD84D",
  },
};

/** The same blues on a warm cream page, the site's first look. Part of the random mix; Reset goes back to the white Cobalt. */
export const COBALT_CREAM: Theme = {
  name: "Cobalt Cream",
  fx: "none",
  vars: {
    paper: "#EEE9DD",
    paper2: "#E2DCCD",
    ink: "#0E0F1A",
    mute: "#6D6B78",
    line: "rgba(14, 15, 26, 0.14)",
    primary: "#2D3BFF",
    accent: "#FF4D1F",
    highlight: "#FFD84D",
    deep: "#0E0F1A",
    onDeep: "#EEE9DD",
    spark: "#FFD84D",
  },
};

/** Which CSS variable each palette role is written to. */
export const VAR_MAP: Record<keyof Palette, string> = {
  paper: "--paper",
  paper2: "--paper-2",
  ink: "--ink",
  mute: "--mute",
  line: "--line",
  primary: "--cobalt",
  accent: "--vermilion",
  highlight: "--butter",
  deep: "--deep",
  onDeep: "--on-deep",
  spark: "--spark",
};

export const THEME_KEY = "pm-theme";

/** The default palette as a stylesheet; generated themes are set as inline variables on <html>. */
export const themeCss = () =>
  `:root{${(Object.keys(VAR_MAP) as (keyof Palette)[]).map((k) => `${VAR_MAP[k]}:${COBALT.vars[k]};`).join("")}}`;

// ---------------------------------------------------------------------------------------------------------
// The generator

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
const wrap = (h: number) => ((h % 360) + 360) % 360;
/** A hue between lo and hi, where lo > hi means the range crosses 0 degrees. */
const hueIn = (lo: number, hi: number) => wrap(lo <= hi ? rand(lo, hi) : rand(lo, hi + 360));

interface Family {
  /** Primary hue range, saturation range. */
  hue: [number, number];
  sat: [number, number];
  /** Accent hue range, chosen to sit well against the primary. */
  accent: [number, number];
}

const FAMILIES: Family[] = [
  { hue: [85, 150], sat: [26, 46], accent: [10, 32] }, // muted greens, with clay
  { hue: [8, 24], sat: [45, 65], accent: [170, 200] }, // terracotta, with teal
  { hue: [208, 240], sat: [30, 52], accent: [18, 36] }, // dusk blue, with peach
  { hue: [172, 200], sat: [48, 70], accent: [350, 12] }, // lagoon, with coral
  { hue: [285, 325], sat: [30, 50], accent: [38, 50] }, // mauve and plum, with ochre
  { hue: [32, 46], sat: [55, 72], accent: [205, 225] }, // dark ochre, with ink blue
  { hue: [335, 355], sat: [35, 55], accent: [145, 165] }, // dusty rose, with forest
  { hue: [222, 240], sat: [85, 100], accent: [8, 20] }, // vivid cobalts
  { hue: [140, 160], sat: [55, 70], accent: [14, 28] }, // deep forest, with orange
  { hue: [346, 360], sat: [58, 75], accent: [165, 185] }, // berry, with teal
];

const NAMES: [number, number, string[]][] = [
  [345, 15, ["Poppy", "Cherry", "Ember", "Berry"]],
  [15, 45, ["Clay", "Rust", "Apricot", "Terracotta"]],
  [45, 70, ["Honey", "Mustard", "Ochre"]],
  [70, 165, ["Moss", "Fern", "Sage", "Pine", "Olive"]],
  [165, 205, ["Lagoon", "Tide", "Teal", "Glacier"]],
  [205, 255, ["Denim", "Dusk", "Ink", "Slate"]],
  [255, 320, ["Plum", "Iris", "Mauve", "Aubergine"]],
  [320, 345, ["Rose", "Blush", "Orchid"]],
];

const hueName = (h: number) => {
  const x = wrap(h);
  const hit = NAMES.find(([lo, hi]) => (lo < hi ? x >= lo && x < hi : x >= lo || x < hi));
  return pick(hit ? hit[2] : NAMES[0][2]);
};

const WHITE = "#FFFFFF";

/** Darken (or lighten, with step > 0) a colour until it clears the contrast target against `against`. */
function tune(h: number, s: number, l: number, against: string, target: number, step: number, limit: number) {
  let L = l;
  let c = hsl(h, s, L);
  while (contrast(c, against) < target && (step < 0 ? L > limit : L < limit)) {
    L += step;
    c = hsl(h, s, L);
  }
  return c;
}

function readable(ink: string, paper: string, t: number) {
  let k = t;
  let c = mix(ink, paper, k);
  while (contrast(c, paper) < 4.5 && k > 0.1) {
    k -= 0.03;
    c = mix(ink, paper, k);
  }
  return c;
}

function plain(): Theme {
  const f = pick(FAMILIES);
  const h = rand(...f.hue);
  const s = rand(...f.sat);
  const ah = hueIn(...f.accent);

  const paperH = Math.random() < 0.5 ? h : h + rand(-24, 24);
  const paperS = rand(16, 36);
  const paperL = rand(91, 95);
  const paper = hsl(paperH, paperS, paperL);
  const paper2 = hsl(paperH, paperS, paperL - rand(4, 6));
  const ink = hsl(h, rand(22, 42), rand(6, 10));
  const primary = tune(h, s, rand(30, 42), paper, 4.6, -1.5, 10);
  const accent = tune(ah, rand(72, 90), rand(52, 60), WHITE, 3.4, -1.5, 25);
  const hh = Math.random() < 0.5 ? rand(44, 56) : ah + rand(-14, 14);
  const highlight = tune(hh, rand(75, 95), rand(78, 88), primary, 4.5, 1.5, 97);

  return {
    name: `${hueName(h)} & ${hueName(ah)}`,
    fx: "none",
    vars: {
      paper,
      paper2,
      ink,
      mute: readable(ink, paper, 0.58),
      line: alpha(ink, 0.14),
      primary,
      accent,
      highlight,
      deep: ink,
      onDeep: paper,
      spark: highlight,
    },
  };
}

/** A dark, radiograph-like scheme: near-black paper, glowing light ink, a bright primary (pictures keep their own colours). */
function xray(): Theme {
  const h = pick([185, 195, 205, 160, 150, 320, 275, 215]) + rand(-6, 6);
  const paper = hsl(h, rand(45, 65), 5.5);
  const ink = hsl(h, rand(70, 90), rand(88, 92));
  const primary = tune(h, rand(88, 100), rand(58, 66), paper, 6, 1.5, 88);
  // Only vivid hues, well away from the primary: yellows and greens would darken to mud under white text.
  const apart = (a: number) => Math.min(Math.abs(wrap(a) - wrap(h)), 360 - Math.abs(wrap(a) - wrap(h)));
  const ah = pick([335, 350, 5, 18, 265, 210].filter((a) => apart(a) > 70));
  const accent = tune(ah, rand(80, 95), 56, WHITE, 3.5, -1.5, 30);
  const highlight = tune(h, 70, 20, primary, 4.5, -1.5, 3);
  const deep = hsl(h, rand(50, 65), 3.5);
  return {
    name: `X-ray ${hueName(h)}`,
    fx: "xray",
    vars: {
      paper,
      paper2: hsl(h, rand(45, 60), 9),
      ink,
      mute: readable(ink, paper, 0.5),
      line: alpha(ink, 0.18),
      primary,
      accent,
      highlight,
      deep,
      onDeep: ink,
      spark: hsl(h + 35, 95, 72),
    },
  };
}

/**
 * A fresh random theme. Without `kind` it is a surprise (mostly plain, now and then x-ray). The colour button passes
 * `kind` so that its presses alternate: a plain palette, then an x-ray one, then plain again.
 */
export function generateTheme(previous?: string, kind?: "plain" | "xray"): Theme {
  for (let i = 0; i < 6; i++) {
    let t: Theme;
    if (kind === "xray") t = xray();
    else if (kind === "plain") t = previous !== COBALT_CREAM.name && Math.random() < 0.1 ? COBALT_CREAM : plain();
    else if (previous !== COBALT_CREAM.name && Math.random() < 0.1) t = COBALT_CREAM;
    else t = Math.random() < 0.25 ? xray() : plain();
    if (t.name !== previous) return t;
  }
  return kind === "xray" ? xray() : plain();
}
