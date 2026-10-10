"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/utils/gsap";

/** Pulls its child a little toward your cursor when you come near, and lets go when you leave. */
export default function Magnetic({
  children,
  strength = 0.35,
  radius = 90,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "elastic.out(1, 0.45)" });
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "elastic.out(1, 0.45)" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // Measure from the element's resting centre (r includes the current offset).
      const cx = r.left + r.width / 2 - Number(gsap.getProperty(el, "x"));
      const cy = r.top + r.height / 2 - Number(gsap.getProperty(el, "y"));
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const near = Math.hypot(dx, dy) < radius + Math.max(r.width, r.height) / 2;
      x(near ? dx * strength : 0);
      y(near ? dy * strength : 0);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [strength, radius]);

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}
