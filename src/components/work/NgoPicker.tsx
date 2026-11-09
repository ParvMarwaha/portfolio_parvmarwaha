"use client";

import { useState } from "react";
import { useSetNgo } from "./ResearchSplit";

type Ngo = { name: string; what: string; structure: string; content: string; voice: string; lesson: string };

/** The five NGOs from the market research, one at a time: pick a name, read how its site works and what Roots took from it. */
export default function NgoPicker({ ngos }: { ngos: Ngo[] }) {
  const [on, setOn] = useState(0);
  const setNgo = useSetNgo();
  const n = ngos[on];
  const pick = (i: number) => {
    setOn(i);
    setNgo(i);
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="NGO">
        {ngos.map((x, i) => (
          <button
            key={x.name}
            type="button"
            role="tab"
            aria-selected={on === i}
            onClick={() => pick(i)}
            className={`rounded-full px-3.5 py-1.5 text-[0.8125rem] tracking-tight transition-colors ${
              on === i ? "bg-ink font-medium text-paper" : "bg-ink/5 text-ink/75 hover:bg-ink/10"
            }`}
          >
            {x.name}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-6 border-l border-line pl-5">
        <p className="text-[0.875rem] leading-snug text-mute">{n.what}</p>
        <dl className="mt-4 grid gap-3 text-[0.9375rem] leading-relaxed">
          {(
            [
              ["Structure", n.structure],
              ["Content", n.content],
              ["Tone and visuals", n.voice],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[0.8125rem] text-mute">{k}</dt>
              <dd className="text-ink/75">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[0.9375rem] font-medium leading-snug">For Roots: {n.lesson}</p>
      </div>
    </div>
  );
}
