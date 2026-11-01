"use client";

import { useState } from "react";
import LetterHeadline from "@/components/hero/LetterHeadline";
import { COBALT, generateTheme, type Theme } from "@/content/themes";
import { applyTheme } from "@/utils/theme";
import { useCoarse } from "@/utils/device";
import { projects } from "@/content/projects";
import RemoteImage from "@/components/ui/RemoteImage";
import { AttractorLab, BrainwaveLab, FieldLab, OrbitLab, SynapseLab, TuringLab } from "./generative";

/** The cover's headline trick, on its own: the font's weight axis follows your cursor. */
function WeightLab() {
  const coarse = useCoarse();
  return (
    <div className="flex h-full flex-col justify-between bg-paper p-6 text-ink [container-type:inline-size]">
      <p className="label text-mute">Variable font · weight 100 to 900</p>
      <LetterHeadline lines={["Weight"]} decorative fontSize="min(150px, 24cqw)" label="Weight" />
      <p className="text-[0.875rem] leading-snug text-mute">
        {coarse ? "Tap the word. A wave of weight runs through the letters." : "Move your cursor over the word. Every letter reacts on its own."}
      </p>
    </div>
  );
}

/** The colour button's generator, shown live. Shuffle makes a palette; "Use on site" paints the whole site with it. */
function PaletteLab() {
  const [theme, setTheme] = useState<Theme>(COBALT);
  const v = theme.vars;
  const swatches = [v.paper, v.primary, v.accent, v.highlight, v.ink];
  const btn = "rounded-full px-4 py-2.5 text-[0.75rem] font-semibold tracking-normal transition-transform hover:scale-[1.04] md:px-3.5 md:py-2";
  return (
    <div className="flex h-full flex-col p-5" style={{ background: v.paper, color: v.ink }}>
      <p className="label" style={{ opacity: 0.6 }}>
        Colour generator{theme.fx === "xray" ? " · x-ray" : ""}
      </p>
      <div className="mt-3 flex flex-1 overflow-hidden rounded-[0.375rem] ring-1" style={{ boxShadow: `inset 0 0 0 1px ${v.line}` }}>
        {swatches.map((c, i) => (
          <span key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <p className="mt-3 text-xl font-medium tracking-tight">{theme.name}</p>
      <div className="mt-3 flex gap-2" data-nodrag>
        <button type="button" onClick={() => setTheme(generateTheme(theme.name))} className={btn} style={{ background: v.ink, color: v.paper }}>
          Shuffle
        </button>
        <button
          type="button"
          onClick={() => applyTheme(theme.name === COBALT.name ? null : theme)}
          className={btn}
          style={{ background: v.accent, color: "#fff" }}
        >
          Use on site
        </button>
      </div>
    </div>
  );
}

/**
 * The poster for a toy that opens on its own page (a frame is a link, so the toy itself, full of links, cannot run in
 * it). Project covers stand in for the stock, the prizes or the stickers.
 */
function ToyPoster({ kind }: { kind: "vending" | "claw" | "stickers" }) {
  const covers = projects.slice(0, kind === "vending" ? 6 : 5);
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-5" style={{ background: kind === "stickers" ? "linear-gradient(142deg, #d6d9de, #aaafb7 62%, #c4c8ce)" : kind === "claw" ? "var(--deep)" : "var(--cobalt)" }}>
      {kind === "vending" && (
        <div className="absolute inset-y-5 right-6 grid w-[46%] grid-cols-3 content-center gap-2 rounded-[0.5rem] bg-paper/15 p-3">
          {covers.map((p) => (
            <RemoteImage key={p.slug} src={p.image} alt="" className="aspect-[3/4] w-full rounded-[0.25rem] object-cover" />
          ))}
        </div>
      )}
      {kind === "claw" && (
        <div className="absolute inset-y-0 right-8 w-[44%]" aria-hidden>
          <span className="absolute left-1/2 top-0 h-[34%] w-[2px] -translate-x-1/2 bg-on-deep/60" />
          <span className="absolute left-1/2 top-[34%] h-5 w-12 -translate-x-1/2 rounded-b-full border-2 border-t-0 border-spark" />
          <div className="absolute inset-x-0 bottom-5 flex flex-wrap-reverse justify-center gap-1.5">
            {covers.map((p, i) => (
              <RemoteImage key={p.slug} src={p.image} alt="" className="h-14 w-14 rounded-[0.375rem] object-cover" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (6 + i * 3)}deg)` }} />
            ))}
          </div>
        </div>
      )}
      {kind === "stickers" &&
        covers.map((p, i) => (
          <RemoteImage
            key={p.slug}
            src={p.image}
            alt=""
            className="absolute w-[22%] rounded-[0.75rem] border-[3px] border-white object-cover shadow-[0_6px_14px_rgba(14,15,26,0.3)]"
            style={{ aspectRatio: i % 2 ? "1" : "4 / 3", right: `${6 + (i % 3) * 15}%`, top: `${12 + Math.floor(i / 2) * 26}%`, transform: `rotate(${(i % 2 ? 1 : -1) * (5 + i * 2)}deg)` }}
          />
        ))}
      <p className={`label relative ${kind === "stickers" ? "text-ink/70" : "text-on-deep/70"}`}>Old home cover · now a toy</p>
      <span className={`relative w-fit rounded-full px-4 py-2 text-[0.8125rem] font-semibold tracking-normal ${kind === "stickers" ? "bg-ink text-paper" : "bg-paper text-ink"}`}>Play ↗</span>
    </div>
  );
}

/** Live demos, keyed by the experiment's id in src/content/lab.ts. */
export const EXPERIMENT_VIEWS: Record<string, React.ReactNode> = {
  weight: <WeightLab />,
  synapse: <SynapseLab />,
  palette: <PaletteLab />,
  attractor: <AttractorLab />,
  turing: <TuringLab />,
  brainwave: <BrainwaveLab />,
  field: <FieldLab />,
  orbit: <OrbitLab />,
  vending: <ToyPoster kind="vending" />,
  claw: <ToyPoster kind="claw" />,
  stickers: <ToyPoster kind="stickers" />,
};
