"use client";

import { useEffect, useRef } from "react";

const ITEMS = [
  { text: "UI/UX design", style: "solid" },
  { text: "Brand identity", style: "solid" },
  { text: "Motion graphics", style: "solid" },
  { text: "Illustration", style: "solid" },
  { text: "Available for hire", style: "serif" },
] as const;

// One row is only about 1250px wide, narrower than a big screen, so the track repeats it enough times that the
// visible strip is always full, and it loops by exactly one row.
const COPIES = 6;

/** A slim ticker in the `// ` voice of the project titles. It speeds up (and turns round) as you scroll. */
export default function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let w = 0;
    const measure = () => {
      w = rowRef.current?.offsetWidth ?? 0;
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);
    void document.fonts?.ready.then(measure);

    let x = 0;
    let dir = -1;
    let speed = 70;
    let last = performance.now();
    let lastY = window.scrollY;
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (Math.abs(dy) > 0.5) dir = dy > 0 ? -1 : 1;
      const target = 70 + Math.min(Math.abs(dy) / Math.max(dt, 0.001), 3200) * 0.32;
      speed += (target - speed) * (1 - Math.exp(-dt * 5));
      x += dir * speed * dt;
      if (w > 0) {
        while (x <= -w) x += w;
        while (x > 0) x -= w;
      }
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const row = (i: number) => (
    <div key={i} ref={i === 0 ? rowRef : undefined} className="flex shrink-0 items-center" aria-hidden={i > 0 || undefined}>
      {ITEMS.map((it) => (
        <span key={it.text} className="flex items-center">
          <span
            className={`px-4 text-[clamp(1.375rem,2.3vw,2rem)] leading-none tracking-tighter md:px-6 ${
              it.style === "serif" ? "font-display italic text-cobalt" : "font-medium text-ink"
            }`}
          >
            {it.text}
          </span>
          <span className="text-[clamp(1.125rem,1.9vw,1.625rem)] font-light text-vermilion">{"//"}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-y border-ink/15 py-4 md:py-5" aria-label="UI/UX design, brand identity, motion graphics, illustration. Available for hire.">
      <div ref={trackRef} className="flex w-max will-change-transform">
        {Array.from({ length: COPIES }, (_, i) => row(i))}
      </div>
    </div>
  );
}
