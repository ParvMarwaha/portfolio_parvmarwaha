"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the cover in place while the rest of the page slides up over it. As it gets covered it shrinks
 * and dims a little, so the sheet coming over reads as depth, not a cut.
 */
export default function HeroSticky({ children }: { children: React.ReactNode }) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sticky = stickyRef.current;
    const el = innerRef.current;
    if (!sticky || !el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    // A cover taller than the screen (a phone on its side, a short window) first scrolls up to its bottom edge and
    // only then holds: a negative sticky top. Otherwise its lower half, the name included, was never seen.
    let lift = 0;
    let h = 0;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!reduced) {
        const p = Math.min(1, Math.max(0, (window.scrollY - lift) / (window.innerHeight * 0.85)));
        // Phones skip the shrink: Safari re-draws scaled text every frame, which made scrolling stutter.
        el.style.transform = coarse ? `translate3d(0, ${p * 24}px, 0)` : `scale(${1 - p * 0.07}) translate3d(0, ${p * 24}px, 0)`;
        // A black sheet fading in dims it the same way a brightness filter would, without re-painting the card.
        if (shadeRef.current) shadeRef.current.style.opacity = String(p * 0.35);
      }
      // Fully covered: stop painting it underneath the page.
      const hide = window.scrollY > h ? "hidden" : "";
      if (el.style.visibility !== hide) el.style.visibility = hide;
    };
    const fit = () => {
      h = sticky.offsetHeight;
      lift = Math.max(0, h - window.innerHeight);
      sticky.style.top = `${-lift}px`;
      update();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={stickyRef} data-hero-sticky className="sticky top-0 min-h-[100svh] overflow-hidden">
      <div ref={innerRef} className="relative origin-top will-change-transform">
        {children}
        <div ref={shadeRef} className="pointer-events-none absolute inset-0 bg-black opacity-0" aria-hidden />
      </div>
    </div>
  );
}
