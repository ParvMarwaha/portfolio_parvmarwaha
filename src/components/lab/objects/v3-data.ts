import type { CSSProperties } from "react";

/**
 * V3 "Lid": the layout of the stickers, as constants. Positions are the centre of each sticker in "cqw" (1cqw = 1% of the
 * lid's width), so the whole composition scales as one unit. There are two arrangements: a landscape lid (desktop) and a
 * taller one for phones and tablets (below 1024px), which hides the two least important decorative stickers.
 */
export const LAND_H = 64; // the landscape lid is 100 x 64
export const PORT_H = 130; // the portrait lid is 100 x 130
export const LID_TILT = -2.4; // degrees, also set in v3-styles.ts

export interface Place {
  /** Centre, in % of the lid width. */
  x: number;
  /** Centre, in cqw (converted to a % of the lid height when rendered). */
  y: number;
  /** Width in cqw. */
  w: number;
  /** Resting rotation in degrees. */
  r: number;
  /** Font size in cqw (1em inside the sticker). Defaults to a tenth of the width. */
  f?: number;
}

export type ShapeId = "circle" | "squircle" | "ticket" | "arch" | "blob" | "hex" | "stamp" | "capsule" | "card" | "pill" | "rect";
export type StickerKind = "name" | "hire" | "work" | "avail" | "project" | "deco";
export type DecoId = "friday" | "kerning" | "lorem" | "layout";

export interface StickerSpec {
  id: string;
  kind: StickerKind;
  shape: ShapeId;
  /** Index into `projects` for project stickers. */
  project?: number;
  deco?: DecoId;
  /** The sticker is as wide as its text (the three pills), instead of a fixed width: a label never wraps or spills. */
  fit?: boolean;
  /** width / height, for stickers whose shape is fixed (pictures and badges). Text stickers size themselves. */
  ar?: number;
  /** Border of the die-cut, in em (defaults to the shape's own). */
  b?: number;
  /** Project stickers: the ribbon's font size, in em of the sticker (sized so its text fits inside the shape at both arrangements). */
  rf?: number;
  land: Place;
  /** null: not shown on phones. */
  port: Place | null;
  /** Resting stacking order. */
  z: number;
  /** Order of arrival in the entrance. */
  order: number;
}

export interface ShapeDef {
  /** The white die-cut layer (also the hit area). */
  white: CSSProperties;
  /** The printed picture, inset by the border. */
  art: CSSProperties;
  /** How far the nearest part of the shape sits from each box corner (tl, tr, bl, br), as a fraction of the width. */
  k0: [number, number, number, number];
  /** Default border, in em. */
  b: number;
  /** Where the project ribbon sits: its bottom edge, as a % of the picture's height (higher where the shape narrows toward the bottom). */
  rb: number;
}

const maskStyle = (image: string, size: string, position: string, repeat: string): CSSProperties => ({
  maskImage: image,
  maskSize: size,
  maskPosition: position,
  maskRepeat: repeat,
  WebkitMaskImage: image,
  WebkitMaskSize: size,
  WebkitMaskPosition: position,
  WebkitMaskRepeat: repeat,
});

const round = (r: string, artRadius = r): Pick<ShapeDef, "white" | "art"> => ({
  white: { clipPath: `inset(0 round ${r})`, borderRadius: r },
  art: { borderRadius: artRadius },
});

const HEX = "polygon(50% 0, 94% 25%, 94% 75%, 50% 100%, 6% 75%, 6% 25%)";

// A ticket: a notch bitten out of the middle of each short side. The picture's notch is wider by the border, so the white rim follows it.
const NOTCH = "0.62em";
const ticketWhite = maskStyle(
  `radial-gradient(circle at 0 50%, #0000 ${NOTCH}, #000 calc(${NOTCH} + 0.6px)), radial-gradient(circle at 100% 50%, #0000 ${NOTCH}, #000 calc(${NOTCH} + 0.6px))`,
  "51% 100%, 51% 100%",
  "0 0, 100% 0",
  "no-repeat, no-repeat"
);
const ticketArt = maskStyle(
  `radial-gradient(circle at calc(0px - var(--b)) 50%, #0000 calc(${NOTCH} + var(--b)), #000 calc(${NOTCH} + var(--b) + 0.6px)), radial-gradient(circle at calc(100% + var(--b)) 50%, #0000 calc(${NOTCH} + var(--b)), #000 calc(${NOTCH} + var(--b) + 0.6px))`,
  "51% 100%, 51% 100%",
  "0 0, 100% 0",
  "no-repeat, no-repeat"
);

// A postage stamp: a solid middle with a row of round tabs along every edge, so the edge looks perforated.
const S = "0.9em";
const tab = "radial-gradient(circle at 50% 50%, #000 0.4em, #0000 calc(0.4em + 0.6px))";
const stampWhite = maskStyle(
  `linear-gradient(#000 0 0), ${tab}, ${tab}, ${tab}, ${tab}`,
  `calc(100% - ${S}) calc(100% - ${S}), ${S} ${S}, ${S} ${S}, ${S} ${S}, ${S} ${S}`,
  "center, 0 0, 0 100%, 0 0, 100% 0",
  "no-repeat, space no-repeat, space no-repeat, no-repeat space, no-repeat space"
);

export const SHAPES: Record<ShapeId, ShapeDef> = {
  circle: { ...round("50%"), k0: [0.29, 0.29, 0.29, 0.29], b: 0.34, rb: 16 },
  squircle: { ...round("30%"), k0: [0.17, 0.17, 0.17, 0.17], b: 0.34, rb: 8 },
  capsule: { ...round("999px"), k0: [0.12, 0.12, 0.12, 0.12], b: 0.34, rb: 12 },
  arch: { ...round("50% 50% 7% 7% / 38% 38% 7% 7%"), k0: [0.25, 0.25, 0.04, 0.04], b: 0.34, rb: 7 },
  blob: { ...round("58% 42% 47% 53% / 52% 56% 44% 48%"), k0: [0.25, 0.25, 0.25, 0.25], b: 0.34, rb: 14 },
  hex: { white: { clipPath: HEX }, art: { clipPath: HEX }, k0: [0.28, 0.28, 0.28, 0.28], b: 0.4, rb: 27 },
  ticket: { white: { ...ticketWhite, borderRadius: "0.5em" }, art: { ...ticketArt, borderRadius: "0.25em" }, k0: [0, 0, 0, 0], b: 0.34, rb: 7 },
  stamp: { white: stampWhite, art: { borderRadius: "0.1em" }, k0: [0, 0, 0, 0], b: 0.9, rb: 7 },
  card: { ...round("1.1em", "0.8em"), k0: [0.03, 0.03, 0.03, 0.03], b: 0.3, rb: 7 },
  pill: { ...round("999px"), k0: [0.1, 0.1, 0.1, 0.1], b: 0.28, rb: 7 },
  rect: { ...round("0.7em", "0.45em"), k0: [0.02, 0.02, 0.02, 0.02], b: 0.3, rb: 7 },
};

/** The ribbon on each project sticker (the full title stays on the link as its accessible name). */
// Short labels for the project stickers' ribbons, by project (anything not listed uses its title).
export const RIBBONS: Record<string, string> = { "sangeet-sathi": "Sangeet\nSathi", "a-research-case-study": "Case study", "apple-motion-design": "Apple", "roots-foundation": "Roots" };

const at = (x: number, y: number, w: number, r: number, f?: number): Place => ({ x, y, w, r, f });

export const SPECS: StickerSpec[] = [
  // The things a recruiter looks for. Kept clear of everything else at rest.
  { id: "name", kind: "name", shape: "card", b: 0.2, z: 24, order: 0, land: at(29.5, 28, 44, -3, 4.4), port: at(48, 28, 76, -3, 7.6) },
  { id: "hire", kind: "hire", shape: "pill", fit: true, z: 23, order: 1, land: at(63.5, 14.5, 19.5, 3, 2.35), port: at(24.5, 62.5, 34, -3, 4.2) },
  { id: "work", kind: "work", shape: "pill", fit: true, z: 22, order: 2, land: at(27.5, 48.2, 23.5, 2, 2.3), port: at(69, 63.5, 39, 3, 4) },
  { id: "avail", kind: "avail", shape: "pill", fit: true, z: 21, order: 3, land: at(70, 29, 34, -1.5, 2.4), port: at(50, 80.5, 52, -1.5, 4.2) },

  // The eight projects, each cover die-cut into a different shape. On the tall lid the top row sits above the bottom row,
  // so every ribbon (which sits at the bottom of its sticker) stays readable.
  { id: "p0", kind: "project", project: 0, shape: "circle", ar: 1, rf: 0.9, z: 13, order: 4, land: at(87, 16, 16, -4), port: at(14.5, 98.5, 25, -5, 3.4) },
  { id: "p1", kind: "project", project: 1, shape: "squircle", ar: 1, rf: 1.2, z: 12, order: 5, land: at(10, 9, 14, 5), port: at(39, 97, 24, 4, 3.2) },
  { id: "p2", kind: "project", project: 2, shape: "ticket", ar: 1.62, rf: 0.84, z: 6, order: 6, land: at(65.5, 43.5, 22, -4), port: at(62.5, 115.5, 30, 3, 4.1) },
  { id: "p3", kind: "project", project: 3, shape: "arch", ar: 0.85, rf: 0.92, z: 11, order: 7, land: at(90, 40.5, 14, 5, 1.55), port: at(63.5, 100, 23, -4, 3.1) },
  { id: "p4", kind: "project", project: 4, shape: "blob", ar: 1.05, rf: 1.15, z: 7, order: 8, land: at(13, 53, 16, -6), port: at(15, 115.5, 25, 5, 3.4) },
  { id: "p5", kind: "project", project: 5, shape: "hex", ar: 0.9, rf: 1, z: 10, order: 9, land: at(36, 9.2, 15, 6), port: at(86, 97.5, 24, 5, 3.2) },
  { id: "p6", kind: "project", project: 6, shape: "stamp", ar: 0.87, rf: 1, z: 8, order: 10, land: at(81, 52.5, 15, 3), port: at(38.5, 116, 22, -4, 3.0) },
  { id: "p7", kind: "project", project: 7, shape: "capsule", ar: 2, rf: 1.05, z: 9, order: 11, land: at(49, 55.5, 22, 2), port: at(86, 116, 26, -3, 3.5) },

  // Decoration: designer-culture in-jokes, no logos.
  { id: "d-friday", kind: "deco", deco: "friday", shape: "circle", ar: 1, b: 0.28, z: 2, order: 12, land: at(48.5, 8.5, 13, 8), port: at(91, 43, 15, 8) },
  { id: "d-lorem", kind: "deco", deco: "lorem", shape: "rect", z: 3, order: 13, land: at(66, 5.2, 17, -2), port: null },
  { id: "d-kerning", kind: "deco", deco: "kerning", shape: "rect", z: 4, order: 14, land: at(46, 43, 15, -5), port: at(11.5, 76.5, 17, -5) },
  { id: "d-layout", kind: "deco", deco: "layout", shape: "rect", z: 5, order: 15, land: at(92, 56.5, 14, 4), port: null },
];
