"use client";

import { useEffect, useRef } from "react";
import RemoteImage from "@/components/ui/RemoteImage";

/**
 * A picture that opens into place the first time it scrolls into view: its frame unclips from a slightly smaller
 * rounded window and fades up. The picture itself never changes size, so nothing grows and then shrinks.
 * An `eager` picture is the one at the top of the page: it is simply there when the page opens, no motion at all.
 */
export default function RevealImage({ src, alt, eager = false, className = "" }: { src: string; alt: string; eager?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (eager || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.shown = "1";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.shown = "1";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  return (
    <div
      ref={ref}
      data-shown={eager ? "1" : undefined}
      className={`overflow-hidden ${
        eager ? "" : "opacity-0 transition-[clip-path,opacity] duration-[1000ms] ease-[cubic-bezier(.22,1,.36,1)] [clip-path:inset(4%_3%_4%_3%_round_1rem)] data-[shown=1]:opacity-100 data-[shown=1]:[clip-path:inset(0%_0%_0%_0%_round_0rem)]"
      } ${className}`}
    >
      <RemoteImage
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        className="block h-auto w-full"
      />
    </div>
  );
}
