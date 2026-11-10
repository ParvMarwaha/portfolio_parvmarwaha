"use client";

import { useState } from "react";

// Noto's accent choices (src/ui/accent.ts in the app): the lime can be swapped for any of these in Settings.
const ACCENTS = [
  ["Lime", "#C8F542"],
  ["Sky", "#5CC8FF"],
  ["Violet", "#B69CFF"],
  ["Orange", "#FFA94D"],
  ["Pink", "#FF8FC7"],
  ["Mint", "#4DE3B0"],
  ["Yellow", "#FFD84D"],
] as const;

/** Pick an accent and a small copy of Noto's "today" card takes it on, the way the app does. */
export default function AccentPicker({ font = "" }: { font?: string }) {
  const [i, setI] = useState(0);
  const [name, hex] = ACCENTS[i];

  return (
    <div>
      <p className="text-[0.8125rem] text-white/55">Make it yours</p>
      <div className="mt-4 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Accent colour">
        {ACCENTS.map(([n, c], k) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={k === i}
            aria-label={n}
            onClick={() => setI(k)}
            data-cursor-label={n}
            className={`h-9 w-9 rounded-full transition-transform duration-200 hover:scale-110 ${k === i ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A]" : "ring-2 ring-white/10"}`}
            style={{ background: c }}
          />
        ))}
      </div>

      {/* A copy of the app's hero card, in the chosen accent */}
      <div className={`mt-5 rounded-[1.25rem] p-4 text-[#0B0B0C] transition-colors duration-500 ${font}`} style={{ background: hex }}>
        <div className="flex items-center justify-between">
          <span className="text-[0.8125rem] font-medium opacity-70">Spent today</span>
          <span className="rounded-full bg-black/10 px-2.5 py-1 text-[0.6875rem] font-semibold">● On track</span>
        </div>
        <p className="mt-2 text-[2.25rem] font-extrabold leading-none tracking-tight">₹20</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/10">
          <div className="h-full w-[6%] rounded-full bg-[#0B0B0C]" />
        </div>
        <p className="mt-2 text-[0.75rem] opacity-70">₹838 left of ₹858</p>
      </div>

      <p className="mt-4 text-[0.8125rem] leading-snug text-white/55">
        <span className="text-white">{name}.</span> Tap a colour: the lime can be swapped for any of seven in Settings, and everything else stays put.
      </p>
    </div>
  );
}
