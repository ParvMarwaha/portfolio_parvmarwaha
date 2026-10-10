"use client";

import { useState } from "react";
import LetterHeadline from "@/components/hero/LetterHeadline";
import { COBALT, generateTheme, type Theme } from "@/content/themes";
import { applyTheme } from "@/utils/theme";
import { useCoarse } from "@/utils/device";
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
};
