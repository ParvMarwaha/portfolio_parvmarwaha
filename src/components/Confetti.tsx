"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCoarse } from "@/utils/device";

// Read when the confetti is thrown, so it wears whatever colours the site has right now.
const themeColors = () => {
  const cs = getComputedStyle(document.documentElement);
  return ["--cobalt", "--vermilion", "--butter", "--paper", "--ink"].map((v) => cs.getPropertyValue(v).trim());
};

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
}

/**
 * Easter eggs, on every page. Type "hire" and the screen throws confetti (with a link to talk).
 * Type "play" and it takes you to the game.
 */
export default function Confetti() {
  const router = useRouter();
  const coarse = useCoarse();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toastRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const toast = toastRef.current;
    if (!canvas || !toast) return;
    const ctx = canvas.getContext("2d")!;
    let bits: Bit[] = [];
    let raf = 0;
    let last = 0;
    let toastTimer = 0;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const b of bits) {
        b.vy += 900 * dt;
        b.vx *= 0.992;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.r += b.vr * dt;
        b.life -= dt;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.globalAlpha = Math.min(1, b.life * 1.5);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      }
      bits = bits.filter((b) => b.life > 0 && b.y < window.innerHeight + 40);
      if (bits.length) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    const burst = () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.55;
      const colors = themeColors();
      for (let i = 0; i < 160; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const s = 420 + Math.random() * 760;
        bits.push({
          x: cx + (Math.random() - 0.5) * 80,
          y: cy,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          r: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 14,
          w: 6 + Math.random() * 9,
          h: 4 + Math.random() * 7,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1.6 + Math.random() * 1.2,
        });
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
      toast.style.opacity = "1";
      toast.style.transform = "translate(-50%, 0)";
      toast.style.pointerEvents = "auto";
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translate(-50%, 16px)";
        toast.style.pointerEvents = "none";
      }, 4200);
    };

    let typed = "";
    let timer = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      typed = (typed + e.key.toLowerCase()).slice(-4);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (typed = ""), 1800);
      if (typed === "hire") burst();
      else if (typed === "play") router.push("/play");
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", size);
      window.clearTimeout(timer);
      window.clearTimeout(toastTimer);
      cancelAnimationFrame(raf);
    };
  }, [router, coarse]);

  // The words are typed on a keyboard, and a full-screen canvas layer is dead weight on a phone.
  if (coarse) return null;

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[9990] h-full w-full" aria-hidden />
      <a
        ref={toastRef}
        href="/contact"
        className="fixed bottom-20 left-1/2 z-[9991] rounded-full bg-vermilion px-6 py-3 text-[0.875rem] font-semibold tracking-normal text-white opacity-0 shadow-[0_20px_40px_-12px_rgba(14,15,26,0.5)] transition-all duration-500"
        style={{ transform: "translate(-50%, 16px)", pointerEvents: "none" }}
      >
        You typed it. Let&apos;s talk →
      </a>
    </>
  );
}
