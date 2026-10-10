"use client";

import { useEffect, useRef, useState } from "react";

const istClock = () =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());

/** "14:32" in India, ticking along. Starts as "--:--" so server and client markup agree. */
export function useIstClock() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const tick = () => setTime(istClock());
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/**
 * The cover headline. It is set in a variable font whose weight axis runs 100 to 900: each letter thickens
 * as your cursor comes near it, breathes on its own when nobody is pointing, and runs a wave when poked.
 */
export default function LetterHeadline({
  lines,
  fontSize,
  label,
  className = "",
  decorative = false,
}: {
  lines: string[];
  fontSize: string | number;
  label: string;
  className?: string;
  /** Hidden from screen readers and not a heading: for a repeat of the name further down the page. */
  decorative?: boolean;
}) {
  const h1Ref = useRef<HTMLElement | null>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const waveAt = useRef(-10_000);

  useEffect(() => {
    const h1 = h1Ref.current;
    if (!h1) return;
    let fs = parseFloat(getComputedStyle(h1).fontSize) || 120;
    const ro = new ResizeObserver(() => {
      fs = parseFloat(getComputedStyle(h1).fontSize) || fs;
    });
    ro.observe(h1);

    const pointer = { x: 0, y: 0, active: false };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The cover asks for one wave when it has been dealt onto the page.
    const onWave = () => (waveAt.current = performance.now());
    if (!decorative) window.addEventListener("pm:wave", onWave);
    const weights = letters.current.map(() => 560);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-dt * 9);
      letters.current.forEach((el, i) => {
        if (!el) return;
        let target: number;
        if (reduced) target = 600;
        else if (pointer.active) {
          const r = el.getBoundingClientRect();
          const zoom = el.offsetWidth ? r.width / el.offsetWidth : 1;
          const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2)) / zoom;
          target = 330 + 570 * Math.pow(Math.max(0, 1 - d / (fs * 1.5)), 1.3);
        } else target = 560 + 260 * Math.sin(now / 760 + i * 0.6);
        // Poke the headline: a wave of weight runs through the letters.
        const phase = ((now - waveAt.current) / 1000) * 2.4 - i * 0.2;
        if (phase > 0 && phase < 1) target = Math.max(target, 260 + 640 * Math.sin(phase * Math.PI));
        weights[i] += (target - weights[i]) * k;
        el.style.fontWeight = String(Math.round(weights[i]));
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pm:wave", onWave);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [decorative]);

  // Each letter gets a stable index so its weight can be driven individually.
  let idx = 0;
  const rows = lines.map((line) => line.split("").map((ch) => ({ ch, i: idx++ })));

  const content = rows.map((row, li) => (
    <span key={li} className="block whitespace-nowrap" aria-hidden>
      {row.map(({ ch, i }) => (
        <span
          key={i}
          ref={(el) => {
            letters.current[i] = el;
          }}
          className="inline-block"
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  ));
  const common = {
    className: `leading-[0.86] tracking-[-0.04em] ${className}`,
    style: { fontSize },
    "data-cursor-label": "Poke",
    onClick: () => (waveAt.current = performance.now()),
  };

  return decorative ? (
    <div
      ref={(el) => {
        h1Ref.current = el;
      }}
      aria-hidden
      {...common}
    >
      {content}
    </div>
  ) : (
    <h1
      ref={(el) => {
        h1Ref.current = el;
      }}
      aria-label={label}
      {...common}
    >
      {content}
    </h1>
  );
}
