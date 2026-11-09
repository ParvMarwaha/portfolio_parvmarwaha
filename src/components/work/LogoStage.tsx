"use client";

import { useEffect, useRef } from "react";
import RemoteImage from "@/components/ui/RemoteImage";

/**
 * The logo on its card, answering the cursor: the mark leans towards it a few degrees and drifts a little, and a soft
 * Roots-blue light follows underneath. Everything eases back when the cursor leaves. Still on touch screens and for
 * reduced motion.
 */
export default function LogoStage({ src, alt }: { src: string; alt: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const mark = markRef.current;
    const light = lightRef.current;
    if (!card || !mark || !light) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const want = { x: 0, y: 0, on: 0 };
    const cur = { x: 0, y: 0, on: 0 };
    let raf = 0;

    const frame = () => {
      cur.x += (want.x - cur.x) * 0.1;
      cur.y += (want.y - cur.y) * 0.1;
      cur.on += (want.on - cur.on) * 0.08;
      mark.style.transform = `perspective(900px) rotateY(${cur.x * 9}deg) rotateX(${-cur.y * 9}deg) translate3d(${cur.x * 12}px, ${cur.y * 12}px, 0)`;
      light.style.opacity = String(cur.on);
      light.style.transform = `translate3d(${(cur.x * 0.5 + 0.5) * card.clientWidth}px, ${(cur.y * 0.5 + 0.5) * card.clientHeight}px, 0) translate(-50%, -50%)`;
      const moving = Math.abs(want.x - cur.x) + Math.abs(want.y - cur.y) + Math.abs(want.on - cur.on) > 0.001;
      raf = moving ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = card.getBoundingClientRect();
      want.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      want.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      want.on = 1;
      kick();
    };
    const leave = () => {
      want.x = 0;
      want.y = 0;
      want.on = 0;
      kick();
    };
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={cardRef} className="relative grid place-items-center overflow-hidden rounded-[0.875rem] bg-[#FEFBF0] px-6 py-14 ring-1 ring-ink/10 md:py-20">
      <span
        ref={lightRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[28rem] w-[28rem] rounded-full opacity-0"
        style={{ background: "radial-gradient(closest-side, rgba(9,86,154,0.14), rgba(9,86,154,0))" }}
      />
      <div ref={markRef} className="relative w-full max-w-[30rem] will-change-transform">
        <RemoteImage src={src} alt={alt} loading="lazy" className="w-full" />
      </div>
    </div>
  );
}
