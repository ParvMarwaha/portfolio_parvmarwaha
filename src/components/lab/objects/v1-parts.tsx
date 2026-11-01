import RemoteImage from "@/components/ui/RemoteImage";
import type { Project } from "@/content/projects";

// The machine's grid (see v1-style.ts): everything is in the units of a 480 x 772 drawing.
export const W = 480;
export const H = 772;
export const PACK_W = 86;
export const PACK_H = 112;
export const CELL_W = 100;
export const SHELF_H = 162;
/** Where the shelves start, in machine coordinates. */
export const INNER_X = 29;
export const INNER_Y = 89;
/** The tray: packs rest with their top at REST_TOP. */
export const REST_TOP = 604;
export const TRAY_MAX = 3;

export const packLeft = (col: number) => INNER_X + CELL_W * col + (CELL_W - PACK_W) / 2;
export const packTop = (row: number) => INNER_Y + SHELF_H * row + 8;
export const codeOf = (i: number) => "ABC"[Math.floor(i / 3)] + String((i % 3) + 1);
/** A fixed, slightly different lean for each pack lying in the tray. */
export const restRot = (id: number) => [-3.2, 2.4, -1.4, 3.6, -2.2][id % 5];

/** One project as a packet of crisps: its cover as the print, crimped ends and a label with the shelf code. */
export function PackArt({ p, code }: { p: Project; code: string }) {
  return (
    <span className="vend-art" style={{ ["--ac" as string]: p.accent }}>
      <RemoteImage src={p.image} alt="" />
      <span className="vend-crimp" style={{ top: 0, height: 8 }} />
      <span className="vend-crimp" style={{ bottom: 0, height: 6 }} />
      <span className="vend-label">
        <span className="vend-label-top">
          <span className="vend-label-code">{code}</span>
          <span className="vend-label-year">{p.year}</span>
        </span>
        <span className="vend-label-title">{p.title}</span>
      </span>
    </span>
  );
}

const PITCH = 8;
const STRANDS = Array.from({ length: 16 }, (_, k) => k * PITCH - PITCH);

/** The spiral behind a pack. Sliding its strands one pitch to the side, over and over, reads as the coil turning. */
export function Coil({ spinning }: { spinning: boolean }) {
  return (
    <svg className="vend-coil" viewBox="0 0 100 34" aria-hidden>
      <rect x="0" y="3" width="100" height="1.4" fill="#8c91a8" opacity="0.55" />
      <rect x="0" y="29.6" width="100" height="1.4" fill="#8c91a8" opacity="0.55" />
      <g className={spinning ? "vend-coil-spin" : undefined}>
        {STRANDS.map((x) => (
          <g key={x}>
            <path d={`M${x + 5} 4 L${x} 30`} stroke="#9ba0b6" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
            <path d={`M${x} 4 L${x + 6} 30`} stroke="#3e4258" strokeWidth="2.8" strokeLinecap="round" />
            <path d={`M${x - 0.6} 5 L${x + 4.8} 29`} stroke="#aeb3c8" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
          </g>
        ))}
      </g>
    </svg>
  );
}
