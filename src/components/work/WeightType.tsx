"use client";

import { useEffect, useRef } from "react";

/**
 * A typeface's name set in that typeface, with the same trick as the home cover: the letters near the cursor get
 * heavier. With no cursor (a phone, or the pointer elsewhere) a slow wave of weight runs through the word instead.
 * `step` snaps the weight for a font that only comes in fixed weights (Zilla Slab: 300 to 700 in hundreds).
 */
export default function WeightType({ text, className, min, max, step = 1 }: { text: string; className: string; min: number; max: number; step?: number }) {
  const rootRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const letters = [...root.querySelectorAll<HTMLSpanElement>("[data-l]")];
    const cur = letters.map(() => min);
    let centres: number[] = [];
    let size = 1;
    const pointer = { x: 0, in: false };
    let raf = 0;
    let shown = false;
    let last = performance.now();

    const measure = () => {
      const r = root.getBoundingClientRect();
      size = parseFloat(getComputedStyle(root).fontSize) || 1;
      centres = letters.map((l) => {
        const b = l.getBoundingClientRect();
        return b.left - r.left + b.width / 2;
      });
    };

    const frame = (now: number) => {
      raf = shown ? requestAnimationFrame(frame) : 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const width = centres[centres.length - 1] ?? 1;
      // The idle wave: a soft peak that travels across the word and off its end, every few seconds.
      const sweep = ((now / 2600) % 1) * (width + size * 4) - size * 2;
      letters.forEach((l, i) => {
        const x = pointer.in ? pointer.x : sweep;
        const near = Math.max(0, 1 - Math.abs(centres[i] - x) / (size * 1.6));
        const want = min + (max - min) * near * near;
        cur[i] += (want - cur[i]) * Math.min(1, dt * 10);
        const w = String(Math.round(cur[i] / step) * step);
        if (l.style.fontWeight !== w) l.style.fontWeight = w;
      });
    };

    const start = () => {
      if (!raf && shown && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      shown = e.isIntersecting;
      if (shown) {
        measure();
        start();
      }
    });
    io.observe(root);

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX - root.getBoundingClientRect().left;
      pointer.in = true;
    };
    const leave = () => (pointer.in = false);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("resize", measure);
    };
  }, [min, max, step]);

  return (
    <p ref={rootRef} className={className} aria-label={text} data-cursor-label="Weight">
      {text.split("").map((ch, i) => (
        <span key={i} data-l aria-hidden className="inline-block whitespace-pre" style={{ fontWeight: min }}>
          {ch}
        </span>
      ))}
    </p>
  );
}
