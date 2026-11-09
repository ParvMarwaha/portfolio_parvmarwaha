"use client";

import { useEffect, useRef } from "react";
import RemoteImage from "@/components/ui/RemoteImage";

/**
 * A picture that opens into place the first time it scrolls into view: its frame unclips from a slightly smaller
 * rounded window while the image settles from a gentle zoom, the way the home page's pictures arrive.
 */
export default function RevealImage({ src, alt, eager = false, className = "" }: { src: string; alt: string; eager?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  }, []);

  return (
    <div
      ref={ref}
      className={`group/reveal overflow-hidden transition-[clip-path] duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] [clip-path:inset(6%_5%_6%_5%_round_1rem)] data-[shown=1]:[clip-path:inset(0%_0%_0%_0%_round_0rem)] ${className}`}
    >
      <RemoteImage
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        className="block h-auto w-full scale-[1.08] transition-transform duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] group-data-[shown=1]/reveal:scale-100"
      />
    </div>
  );
}
