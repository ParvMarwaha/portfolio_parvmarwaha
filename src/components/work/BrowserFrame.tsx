"use client";

import { useState } from "react";
import RemoteImage from "@/components/ui/RemoteImage";
import { getLenis } from "@/utils/lenis";

/**
 * A long page screenshot in a browser window. It starts cut off with a fade and opens to its full length on a
 * click; no scroll box inside the page, so a swipe on a phone always moves the page itself.
 */
export default function BrowserFrame({ src, alt, url, height = "36rem" }: { src: string; alt: string; url: string; height?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <figure className="overflow-hidden rounded-[0.875rem] bg-paper shadow-[0_1px_2px_rgba(14,15,26,0.08),0_30px_60px_-34px_rgba(14,15,26,0.5)] ring-1 ring-ink/10">
      <div className="flex items-center gap-3 border-b border-line bg-paper-2 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          ))}
        </span>
        <span className="mx-auto truncate rounded-full bg-paper px-4 py-1 text-[0.75rem] text-mute">{url}</span>
        <span className="w-10" aria-hidden />
      </div>
      <div className="relative overflow-hidden transition-[max-height] duration-700 ease-[cubic-bezier(0.2,0.9,0.2,1)]" style={{ maxHeight: open ? "none" : height }}>
        <RemoteImage src={src} alt={alt} loading="lazy" className="block h-auto w-full" />
        {!open && (
          <div className="absolute inset-x-0 bottom-0 flex h-40 items-end justify-center bg-gradient-to-t from-paper via-paper/80 to-transparent pb-6">
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                // The page just got much longer: let the smooth scroller learn its new end.
                window.setTimeout(() => getLenis()?.resize(), 50);
              }}
              className="rounded-full bg-ink px-5 py-2.5 text-[0.875rem] font-medium text-paper transition-transform hover:scale-[1.04] active:scale-[0.97]"
            >
              See the whole page ↓
            </button>
          </div>
        )}
      </div>
    </figure>
  );
}
