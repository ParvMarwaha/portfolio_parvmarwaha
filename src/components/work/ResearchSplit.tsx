"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import RemoteImage from "@/components/ui/RemoteImage";

/**
 * The research, read beside the research sheet. On wide screens the sheet stays in view next to the text and moves to
 * the part you are reading (process, the five NGOs, patterns, insights); hovering it shows the whole sheet. Blocks in
 * the text mark themselves with `data-focus`. On phones the sheet simply follows the text, whole.
 */

// Regions of the sheet, as fractions of its width and height.
const REGIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  all: { x: 0, y: 0, w: 1, h: 1 },
  process: { x: 0.46, y: 0.23, w: 0.52, h: 0.21 },
  market: { x: 0.02, y: 0.45, w: 0.96, h: 0.265 }, // narrowed around the NGO being read, below
  patterns: { x: 0.035, y: 0.725, w: 0.245, h: 0.255 },
  insights: { x: 0.27, y: 0.725, w: 0.245, h: 0.255 },
  synthesis: { x: 0.505, y: 0.725, w: 0.475, h: 0.26 },
};

// The five NGO cards on the sheet, left to right.
const CARDS = [0.047, 0.232, 0.417, 0.601, 0.786];

const NgoContext = createContext<(i: number) => void>(() => {});
export const useSetNgo = () => useContext(NgoContext);

const SRC = "/images/roots/research-poster.webp";
const ALT = "The Roots Foundation research sheet: process, market research, patterns and user insights";

export default function ResearchSplit({ children }: { children: React.ReactNode }) {
  const textRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState("all");
  const [ngo, setNgo] = useState(0);
  const [whole, setWhole] = useState(false);

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.45;
      let current = "all";
      for (const el of text.querySelectorAll<HTMLElement>("[data-focus]")) {
        if (el.getBoundingClientRect().top <= line) current = el.dataset.focus ?? "all";
      }
      setFocus(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const key = whole ? "all" : focus;
  // The market band is as wide as the sheet; zoom to the card being read and its neighbours instead.
  const r = key === "market" ? { x: CARDS[ngo] + 0.0865 - 0.24, y: 0.45, w: 0.48, h: 0.265 } : (REGIONS[key] ?? REGIONS.all);
  const s = Math.min(3, Math.max(1, Math.min(1 / r.w, 1 / r.h) * 0.94));
  const clamp = (v: number) => Math.min(0, Math.max(1 - s, v));
  const tx = clamp(0.5 - (r.x + r.w / 2) * s);
  const ty = clamp(0.5 - (r.y + r.h / 2) * s);

  return (
    <NgoContext.Provider value={setNgo}>
      <div className="mt-6 md:grid md:grid-cols-[1fr_20rem] md:gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
        <div ref={textRef}>{children}</div>

        <aside className="hidden md:block">
          <div className="sticky top-24">
            <div
              className="relative aspect-[1621/2296] w-full max-w-[calc((100svh-10rem)*0.706)] overflow-hidden rounded-[0.875rem] bg-[#FEF9F1] ring-1 ring-ink/10"
              onPointerEnter={(e) => e.pointerType === "mouse" && setWhole(true)}
              onPointerLeave={() => setWhole(false)}
              data-cursor-label="Whole sheet"
            >
              <div
                className="absolute inset-0 origin-top-left transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
                style={{ transform: `translate(${tx * 100}%, ${ty * 100}%) scale(${s})` }}
              >
                <RemoteImage src={SRC} alt={ALT} className="block h-full w-full" />
                {/* The NGO being read, outlined on its card */}
                <span
                  aria-hidden
                  className="absolute rounded-[0.35rem] ring-2 ring-[#FEBF04] transition-all duration-500"
                  style={{ left: `${CARDS[ngo] * 100}%`, width: "17.3%", top: "55.2%", height: "13.9%", opacity: focus === "market" && !whole ? 1 : 0 }}
                />
              </div>
            </div>
            <p className="mt-3 text-[0.8125rem] text-mute">
              The research on one sheet.{" "}
              <a href={SRC} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                Open it full size ↗
              </a>
            </p>
          </div>
        </aside>
      </div>

      {/* Phones: the sheet, whole, after the text */}
      <div className="mt-14 md:hidden">
        <h3 className="text-[0.9375rem] font-medium tracking-tight">All of it on one sheet</h3>
        <div className="mt-4 overflow-hidden rounded-[0.875rem] ring-1 ring-ink/10">
          <RemoteImage src={SRC} alt={ALT} loading="lazy" className="block h-auto w-full" />
        </div>
      </div>
    </NgoContext.Provider>
  );
}
