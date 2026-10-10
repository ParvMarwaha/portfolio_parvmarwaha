"use client";

import { useEffect } from "react";

/**
 * The tab icon is alive: a "P" whose weight breathes between hairline and black (the cover name's trick) with a
 * dot orbiting it, painted in the site's current colours. The static icon (src/app/icon.svg) is what shows first,
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
      return { bg: v("--cobalt", "#2D3BFF"), fg: v("--paper", "#FFFFFF"), dot: v("--butter", "#FFD84D"), font: getComputedStyle(document.body).fontFamily };
    };
    let pal = read();
    const onTheme = () => (pal = read());
    window.addEventListener("pm:theme", onTheme);

    const paint = (t: number) => {
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = pal.bg;
      ctx.beginPath();
      ctx.roundRect(0, 0, 64, 64, 15);
      ctx.fill();
      const weight = reduced ? 800 : Math.round(520 + 380 * Math.sin(t * 1.7));
      ctx.font = `${weight} 52px ${pal.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = pal.fg;
      ctx.fillText("P", 31, 50);
      const a = reduced ? -0.8 : t * 1.3;
      ctx.fillStyle = pal.dot;
      ctx.beginPath();
      ctx.arc(32 + 23 * Math.cos(a), 32 + 23 * Math.sin(a), 5, 0, Math.PI * 2);
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
