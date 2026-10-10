"use client";

import Link from "next/link";
import { lab } from "@/content/lab";
import type { Rect } from "./world";
import { introStyle } from "./Frame";
import LetterHeadline, { useIstClock } from "@/components/hero/LetterHeadline";

/**
 * The Lab's cover frame. The headline is set in a variable font whose weight axis runs 100 to 900: each letter
 * thickens as your cursor comes near it, and breathes on its own when nobody is pointing.
 */
export default function Cover({
  rect,
  narrow,
  dev,
  introOn,
  onOverview,
}: {
  rect: Rect;
  narrow: boolean;
  dev: boolean;
  introOn: boolean;
  onOverview: () => void;
}) {
  const pad = narrow ? 24 : 56;
  const fs = Math.min(150, (rect.w - pad * 2) / 4.3);
  const time = useIstClock();

  return (
    <section
      aria-label="Cover"
      className="absolute overflow-hidden bg-cobalt text-paper shadow-[0_40px_80px_-40px_rgba(14,15,26,0.7)]"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, padding: pad, ...introStyle(introOn, 0) }}
      data-cover
    >
      <div className="flex h-full flex-col justify-between">
        <div className="label flex justify-between opacity-80">
          <span>Experiments — 2026</span>
          <span>India · {time} IST</span>
        </div>

        <div>
          <LetterHeadline lines={["Parv's", lab.title]} fontSize={fs} label={`Parv's ${lab.title}`} />
          <p className="mt-3 font-display italic leading-none text-butter" style={{ fontSize: fs * 0.4 }}>
            {lab.tagline}
          </p>
        </div>

        <div className={`flex ${narrow ? "flex-col gap-5" : "items-end justify-between gap-6"}`}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-butter" style={{ animation: "pin-pulse 2s ease-out infinite" }} />
              <span className="relative h-2.5 w-2.5 rounded-full bg-butter" />
            </span>
            <span className="text-[0.9375rem] font-medium tracking-tight">{lab.note}</span>
          </div>
          <div className="flex items-center gap-2.5" data-nodrag>
            <Link
              href="/"
              className="whitespace-nowrap rounded-full px-6 py-3 text-[0.9375rem] font-medium tracking-normal text-paper ring-1 ring-paper/40 transition-colors hover:bg-paper hover:text-cobalt"
              data-cursor-label="Home"
            >
              {narrow ? "← Home" : "← Back to portfolio"}
            </Link>
            <button
              type="button"
              onClick={onOverview}
              className="whitespace-nowrap rounded-full bg-paper px-6 py-3 text-[0.9375rem] font-semibold tracking-normal text-cobalt transition-transform hover:scale-[1.04]"
            >
              {narrow ? "Explore" : "See the experiments"}
            </button>
          </div>
        </div>
      </div>

      {/* Dev mode: the cover's padding, drawn the way an inspector would */}
      {dev && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[
            { left: 0, top: 0, right: 0, height: pad },
            { left: 0, bottom: 0, right: 0, height: pad },
            { left: 0, top: pad, bottom: pad, width: pad },
            { right: 0, top: pad, bottom: pad, width: pad },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute flex items-center justify-center bg-vermilion/25"
              style={{ ...s, backgroundImage: "repeating-linear-gradient(45deg, rgba(255,77,31,0.35) 0 1px, transparent 1px 7px)" }}
            >
              <span
                className="rounded-[0.1875rem] bg-vermilion px-1 text-[0.6875rem] font-medium leading-4 tracking-normal text-white"
                style={{ transform: "scale(var(--inv, 1))" }}
              >
                {pad}
              </span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
