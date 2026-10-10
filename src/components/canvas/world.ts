export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NoteSpec {
  id: string;
  text: string;
  x: number;
  y: number;
  rot: number;
  tone: "butter" | "vermilion";
}

export interface World {
  cover: Rect;
  /** One rect per experiment, in order. */
  slots: Rect[];
  play: Rect;
  notes: NoteSpec[];
  pin: { x: number; y: number };
  bounds: Rect;
}

const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/**
 * Lays everything out around the cover frame, which sits on the origin. The first eight experiments get
 * hand-placed slots (alternating right and left of the cover so the file stays balanced); any more are
 * laid out in rows underneath.
 */
export function buildWorld(coverW: number, coverH: number, count: number): World {
  const hw = coverW / 2;
  const hh = coverH / 2;
  const A = hw + 110; // right cluster starts here
  const B = -(hw + 110); // left cluster ends here

  const cover = r(-hw, -hh, coverW, coverH);
  const placed = [
    r(A, -hh + 10, 600, 375), // right, wide
    r(B - 600, -hh + 10, 600, 375), // left, wide
    r(A, -hh + 445, 380, 380), // right, square
    r(B - 380, -hh + 445, 380, 380), // left, square
    r(-330, hh + 70, 600, 375), // below, wide
    r(A + 700, -hh + 190, 520, 325), // far right, wide
    r(A + 480, -hh + 575, 300, 420), // far right, tall
    r(B - 370, hh + 250, 520, 325), // far left, wide
  ];
  // Beyond eight: rows of three below the cover.
  const slots = Array.from({ length: Math.max(count, 0) }, (_, i) => {
    if (i < placed.length) return placed[i];
    const k = i - placed.length;
    return r(-960 + (k % 3) * 660, hh + 720 + Math.floor(k / 3) * 440, 600, 375);
  });
  // On phones the cover is tall, so keep the prototype frame out of the first view.
  const playGap = coverW < 600 ? 200 : 70;
  const play = r(-190, -hh - playGap - 230, 380, 230);
  const notes: NoteSpec[] = [
    { id: "n1", text: "Not projects. Just things I'm trying out.", x: -hw - 250, y: -hh - 180, rot: -6, tone: "butter" },
    { id: "n2", text: "Press D to see how it's built.", x: hw + 70, y: -hh - 200, rot: 5, tone: "butter" },
    { id: "n3", text: "There's a game up here. Break the grid.", x: 230, y: -hh - playGap - 190, rot: 4, tone: "vermilion" },
  ];
  const pin = { x: hw, y: -hh };

  const all = [cover, ...slots, play, ...notes.map((n) => r(n.x, n.y, 150, 150))];
  const minX = Math.min(...all.map((a) => a.x));
  const minY = Math.min(...all.map((a) => a.y));
  const maxX = Math.max(...all.map((a) => a.x + a.w));
  const maxY = Math.max(...all.map((a) => a.y + a.h));
  return { cover, slots, play, notes, pin, bounds: r(minX, minY, maxX - minX, maxY - minY) };
}
