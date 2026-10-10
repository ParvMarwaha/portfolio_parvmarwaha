"use client";

import { useEffect, useRef } from "react";

/** Fades and lifts its child into place the first time it scrolls into view. */
export default function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.shown = "1";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`translate-y-10 opacity-0 transition-all duration-[900ms] ease-out data-[shown=1]:translate-y-0 data-[shown=1]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
