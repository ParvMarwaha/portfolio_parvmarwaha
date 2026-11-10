"use client";

import { useRef, useState } from "react";

export type ThenNowPair = { id: string; label: string; then: string; now: string; changes: string[] };

/**
 * The same screen as designed and as built, one over the other: drag the handle (or use the arrow keys) to wipe
 * between them. Tabs pick the screen; the notes beside it say what changed while building.
 */
export default function ThenNow({ pairs, thenLabel = "Design", nowLabel = "App" }: { pairs: ThenNowPair[]; thenLabel?: string; nowLabel?: string }) {
  const [i, setI] = useState(0);
  const [pos, setPos] = useState(50);
  const frame = useRef<HTMLDivElement>(null);
  const pair = pairs[i];

  const fromPointer = (clientX: number) => {
    const r = frame.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Screens">
        {pairs.map((p, k) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={k === i}
            onClick={() => setI(k)}
            className={`shrink-0 rounded-full px-4 py-2 text-[0.875rem] font-medium tracking-tight transition-colors ${
              k === i ? "bg-ink text-paper" : "bg-paper text-ink/70 ring-1 ring-ink/10 hover:text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-10 grid items-center gap-10 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-16">
        <div
          ref={frame}
          className="relative mx-auto aspect-[430/932] w-full max-w-[18rem] cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-[2.25rem] bg-paper shadow-[0_30px_60px_-30px_rgba(14,15,26,.45)] ring-[6px] ring-ink md:max-w-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            fromPointer(e.clientX);
          }}
          onPointerMove={(e) => e.buttons && fromPointer(e.clientX)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pair.now} alt={`${pair.label}, as built`} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pair.then}
            alt={`${pair.label}, as designed`}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          />
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#0E0F1A]/80 px-2.5 py-1 text-[0.6875rem] font-medium text-white" style={{ opacity: pos > 18 ? 1 : 0 }}>
            {thenLabel}
          </span>
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#FF5C00] px-2.5 py-1 text-[0.6875rem] font-medium text-white" style={{ opacity: pos < 82 ? 1 : 0 }}>
            {nowLabel}
          </span>
          <span className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(14,15,26,.15)]" style={{ left: `${pos}%` }}>
            <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[0.75rem] text-[#0E0F1A] shadow-md">
              ⟷
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(pos)}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label={`Wipe between the ${thenLabel.toLowerCase()} and the ${nowLabel.toLowerCase()}`}
            className="sr-only"
          />
        </div>

        <div>
          <p className="text-[0.8125rem] text-mute">What changed while building</p>
          <h3 className="mt-1 text-[1.25rem] font-medium tracking-tight">{pair.label}</h3>
          <ul className="mt-5 grid gap-3 text-[0.9375rem] leading-relaxed text-ink/75">
            {pair.changes.map((c) => (
              <li key={c} className="grid grid-cols-[1rem_1fr]">
                <span aria-hidden className="text-[#FF5C00]">
                  →
                </span>
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[0.8125rem] text-mute">
            <span className="pointer-coarse:hidden">Drag across the phone to compare.</span>
            <span className="hidden pointer-coarse:inline">Slide across the phone to compare.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
