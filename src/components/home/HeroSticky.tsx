"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the cover in place while the rest of the page slides up over it. As it gets covered it shrinks
 * and dims a little, so the sheet coming over reads as depth, not a cut.
 */
export default function HeroSticky({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = innerRef.current;
      if (!el) return;
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)));
      el.style.transform = `scale(${1 - p * 0.07}) translate3d(0, ${p * 24}px, 0)`;
      // A black sheet fading in dims it the same way a brightness filter would, without re-painting the card.
      if (shadeRef.current) shadeRef.current.style.opacity = String(p * 0.35);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="sticky top-0 h-[100svh] overflow-hidden">
      <div ref={innerRef} className="relative origin-top will-change-transform">
        {children}
        <div ref={shadeRef} className="pointer-events-none absolute inset-0 bg-black opacity-0" aria-hidden />
      </div>
    </div>
  );
}
