"use client";

import { useState } from "react";

const BASE = [
  { name: "Roots Blue", hex: "#09569A" },
  { name: "Charcoal", hex: "#444444" },
  { name: "Cream", hex: "#FEF9F1" },
];

const VERTICALS = [
  { name: "Agriculture and Environment", short: "Agriculture", hex: "#75BC20", why: "growth" },
  { name: "Sports and Physical Literacy", short: "Sports", hex: "#FF7F3A", why: "energy" },
  { name: "Preventive Healthcare", short: "Health", hex: "#8453EC", why: "calm" },
  { name: "Education and Career Readiness", short: "Education", hex: "#FEBF04", why: "positivity" },
  { name: "Skill and Community Development", short: "Skills", hex: "#DC3B83", why: "" },
];

/**
 * The Roots colour system, live: pick an area of work and a slice of its website page takes that colour, which is the
 * whole idea of the system. The three base colours sit underneath; a tap on any colour copies its hex.
 */
export default function RootsColours({ slab, jakarta }: { slab: string; jakarta: string }) {
  const [on, setOn] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const v = VERTICALS[on];

  const copy = (hex: string) => {
    void navigator.clipboard?.writeText(hex).catch(() => {});
    setCopied(hex);
    window.setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1400);
  };

  return (
    <div className="grid gap-8 md:grid-cols-[14rem_1fr] md:gap-10">
      <div>
        <div className="grid content-start gap-1" role="radiogroup" aria-label="Area of work">
          {VERTICALS.map((c, i) => (
            <button
              key={c.hex}
              type="button"
              role="radio"
              aria-checked={on === i}
              onClick={() => setOn(i)}
              className={`flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4 text-left text-[0.875rem] tracking-tight transition-colors ${
                on === i ? "bg-ink font-medium text-paper" : "text-ink/75 hover:bg-ink/5"
              }`}
            >
              <span className="h-5 w-5 shrink-0 rounded-full" style={{ background: c.hex }} aria-hidden />
              {c.short}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => copy(v.hex)} className="mt-4 text-left text-[0.8125rem] text-mute transition-colors hover:text-ink" data-cursor-label="Copy hex">
          {v.short} · <span className="tabular-nums text-ink">{copied === v.hex ? "copied" : v.hex}</span>
          {v.why ? `, for ${v.why}` : ""}
        </button>
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-4">
          {BASE.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => copy(c.hex)}
              className="flex items-center gap-2 text-[0.8125rem] text-mute transition-colors hover:text-ink"
              data-cursor-label="Copy hex"
              aria-label={`${c.name}, ${c.hex}. Copy the hex code`}
            >
              <span className="h-3.5 w-3.5 rounded-full ring-1 ring-ink/15" style={{ background: c.hex }} aria-hidden />
              {copied === c.hex ? "Copied" : c.name}
            </button>
          ))}
        </div>
      </div>

      {/* A slice of the area page, as designed: its colour carries the tag, the heading, the cards and the button */}
      <div className="overflow-hidden rounded-[0.875rem] ring-1 ring-ink/10" style={{ background: "#FEF9F1", color: "#444444" }} aria-live="polite">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/roots/logo.webp" alt="" className="h-7 w-auto" />
          <span className="rounded-full px-3 py-1 text-[0.6875rem] font-semibold text-white" style={{ background: "#09569A" }}>
            Partner with us
          </span>
        </div>
        <div className="p-5 md:p-7">
          <span className="inline-block rounded-full px-3 py-1 text-[0.6875rem] font-semibold text-white transition-colors duration-500" style={{ background: v.hex }}>
            {v.short}
          </span>
          <p className={`${slab} mt-4 text-[1.75rem] font-semibold leading-[1.05] transition-colors duration-500 md:text-[2.25rem]`} style={{ color: v.hex }}>
            {v.name}
          </p>
          <p className={`${jakarta} mt-3 max-w-[30rem] text-[0.875rem] leading-relaxed`}>
            Long-term programmes built with the people they serve, measured from the first day, and reported in the open.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {["Programmes", "Stories", "Reports"].map((t) => (
              <div key={t} className="rounded-[0.5rem] bg-white/70 p-3 transition-colors duration-500" style={{ boxShadow: `inset 0 3px 0 ${v.hex}` }}>
                <p className={`${jakarta} text-[0.75rem] font-semibold`}>{t}</p>
                <span className="mt-3 block h-1.5 w-2/3 rounded-full bg-black/10" />
                <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-black/10" />
              </div>
            ))}
          </div>
          <span
            className={`${jakarta} mt-5 inline-block rounded-full px-4 py-2 text-[0.75rem] font-semibold transition-colors duration-500`}
            style={{ background: v.hex, color: v.hex === "#FEBF04" ? "#444444" : "#FFFFFF" }}
          >
            Explore the programmes →
          </span>
        </div>
      </div>
    </div>
  );
}
