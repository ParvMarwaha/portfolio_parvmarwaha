"use client";

import { useEffect } from "react";

/**
 * The tab icon is alive: a round badge with a white disc that breathes in and out and a dot orbiting it, painted in
 * the site's current colours. The static icon (src/app/icon.svg) is what shows first,
 * and what anything that cannot animate keeps. It stands still for visitors who prefer reduced motion.
 */
export default function FaviconAnimator() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
      return { bg: v("--cobalt", "#2D3BFF"), fg: v("--paper", "#FFFFFF"), dot: v("--butter", "#FFD84D") };
    };
    let pal = read();
    const onTheme = () => (pal = read());
    window.addEventListener("pm:theme", onTheme);

    const paint = (t: number) => {
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = pal.bg;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
      // The disc breathes between a pinpoint and almost filling the badge.
      const r = reduced ? 13 : 11 + 8 * Math.sin(t * 1.7);
      ctx.fillStyle = pal.fg;
      ctx.beginPath();
      ctx.arc(32, 32, r, 0, Math.PI * 2);
      ctx.fill();
      const a = reduced ? -0.8 : t * 1.3;
      ctx.fillStyle = pal.dot;
      ctx.beginPath();
      ctx.arc(32 + 22 * Math.cos(a), 32 + 22 * Math.sin(a), 5, 0, Math.PI * 2);
      ctx.fill();
      const url = canvas.toDataURL("image/png");
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((l) => {
        l.type = "image/png";
        l.removeAttribute("sizes");
        l.href = url;
      });
    };

    const start = performance.now();
    paint(0);
    const id = reduced ? 0 : window.setInterval(() => paint((performance.now() - start) / 1000), 130);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pm:theme", onTheme);
    };
  }, []);

  return null;
}
