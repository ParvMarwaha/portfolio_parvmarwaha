"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/utils/gsap";
import RemoteImage from "@/components/ui/RemoteImage";
import type { Experiment } from "@/content/lab";
import type { Rect } from "./world";
import { FrameName, Selection } from "./Selection";

export const introStyle = (on: boolean, index: number): React.CSSProperties => ({
  opacity: on ? 1 : 0,
  transform: on ? "none" : "translateY(32px) scale(0.965)",
  transition: `opacity 0.9s ease ${0.15 + index * 0.07}s, transform 1.1s cubic-bezier(0.2, 0.9, 0.2, 1) ${0.15 + index * 0.07}s`,
});

export interface FrameHandle {
  /** Where the frame is right now, in world coordinates (it may have been dragged or thrown). */
  rect: () => Rect;
  /** Fling it away from the middle of the file, with a little spin. */
  scatter: (delay: number) => void;
  /** Bring it back to its place. */
  tidy: (delay: number) => void;
}

interface Drag {
  id: number;
  sx: number;
  sy: number;
  x0: number;
  y0: number;
  lx: number;
  ly: number;
  t: number;
  vx: number;
  vy: number;
  /** Where the hand wants the frame (the frame itself follows a beat late). */
  tx: number;
  ty: number;
  started: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * An experiment's frame. Point at it and it tilts toward you with a glare; pick it up and throw it across
 * the file; click it and, if it links somewhere, it opens. Anything marked `data-nodrag` inside it (a button
 * in a live demo) keeps working. Shuffle and Tidy up move every frame with a lift, travel and bounce.
 */
export default function Frame({
  item,
  children,
  rect,
  index,
  introOn,
  dev,
  zoom,
  onGrab,
  onOpen,
  register,
}: {
  item: Experiment;
  /** The live demo, shown when the experiment has no picture. */
  children?: React.ReactNode;
  rect: Rect;
  index: number;
  introOn: boolean;
  dev: boolean;
  zoom: () => number;
  onGrab: () => void;
  onOpen: (slug: string, rect: Rect) => void;
  register: (slug: string, handle: FrameHandle | null) => void;
}) {
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef(rect);
  const drag = useRef<Drag | null>(null);
  const moved = useRef(false);
  const settle = useRef(0);

  const get = (p: "x" | "y") => Number(gsap.getProperty(moverRef.current, p)) || 0;
  const current = (): Rect => ({ x: rect.x + get("x"), y: rect.y + get("y"), w: rect.w, h: rect.h });

  // Hand the canvas a way to shuffle and tidy this frame.
  useEffect(() => {
    rectRef.current = rect;
  });
  useEffect(() => {
    const mover = moverRef.current;
    const anchor = anchorRef.current;
    if (!mover || !anchor) return;
    const at = (p: "x" | "y") => Number(gsap.getProperty(mover, p)) || 0;
    const travel = (x: number, y: number, rotation: number, delay: number) => {
      gsap.killTweensOf(mover);
      gsap.set(anchor, { zIndex: 25 });
      gsap
        .timeline({ delay, onComplete: () => gsap.set(anchor, { clearProps: "zIndex" }) })
        .to(mover, { scale: 1.1, duration: 0.28, ease: "power2.out" })
        .to(mover, { x, y, rotation, duration: 0.85, ease: "power3.inOut" }, "<0.04")
        .to(mover, { scale: 1, duration: 0.7, ease: "bounce.out" }, ">-0.25");
    };
    register(item.id, {
      rect: () => ({ x: rectRef.current.x + at("x"), y: rectRef.current.y + at("y"), w: rectRef.current.w, h: rectRef.current.h }),
      scatter(delay) {
        const r = rectRef.current;
        const a = Math.atan2(r.y + r.h / 2, r.x + r.w / 2) + (Math.random() - 0.5) * 1.6;
        const d = 220 + Math.random() * 380;
        travel(Math.cos(a) * d, Math.sin(a) * d, (Math.random() - 0.5) * 18, delay);
      },
      tidy(delay) {
        travel(0, 0, 0, delay);
      },
    });
    return () => register(item.id, null);
  }, [item.id, register]);

  const resetTilt = () => {
    const t = tiltRef.current;
    if (!t) return;
    t.style.setProperty("--rx", "0");
    t.style.setProperty("--ry", "0");
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // picking a frame up must not pan the canvas
    if ((e.target as HTMLElement).closest("[data-nodrag]")) return; // a button inside a live demo
    onGrab();
    // Hold the pointer from the first press, so a fast flick can never outrun the frame.
    anchorRef.current?.setPointerCapture(e.pointerId);
    const el = moverRef.current!;
    gsap.killTweensOf(el);
    window.clearTimeout(settle.current);
    moved.current = false;
    drag.current = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      x0: get("x"),
      y0: get("y"),
      lx: e.clientX,
      ly: e.clientY,
      t: performance.now(),
      vx: 0,
      vy: 0,
      tx: get("x"),
      ty: get("y"),
      started: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const t = tiltRef.current;
    if (t && e.pointerType === "mouse" && !d?.started) {
      const r = t.getBoundingClientRect();
      const nx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      const ny = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
      t.style.setProperty("--ry", (nx * 7).toFixed(2));
      t.style.setProperty("--rx", (-ny * 7).toFixed(2));
      t.style.setProperty("--mx", `${((nx + 1) * 50).toFixed(1)}%`);
      t.style.setProperty("--my", `${((ny + 1) * 50).toFixed(1)}%`);
    }
    if (!d || d.id !== e.pointerId) return;

    if (!d.started) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return;
      d.started = true;
      document.body.dataset.panning = "move";
      resetTilt();
      gsap.set(anchorRef.current, { zIndex: 40 });
      gsap.to(moverRef.current, { scale: 1.06, duration: 0.2, ease: "power2.out" });
    }

    const z = zoom();
    const now = performance.now();
    const dt = Math.max(0.008, (now - d.t) / 1000);
    d.vx = d.vx * 0.6 + ((e.clientX - d.lx) / z / dt) * 0.4;
    d.vy = d.vy * 0.6 + ((e.clientY - d.ly) / z / dt) * 0.4;
    d.lx = e.clientX;
    d.ly = e.clientY;
    d.t = now;
    d.tx = d.x0 + (e.clientX - d.sx) / z;
    d.ty = d.y0 + (e.clientY - d.sy) / z;
    // It follows the hand a beat late and leans into the movement.
    gsap.to(moverRef.current, {
      x: d.tx,
      y: d.ty,
      rotation: clamp(d.vx * 0.006, -9, 9),
      duration: 0.14,
      ease: "power2.out",
      overwrite: true,
    });
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => gsap.to(moverRef.current, { rotation: 0, duration: 0.4, ease: "power2.out" }), 110);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (anchorRef.current?.hasPointerCapture(e.pointerId)) anchorRef.current.releasePointerCapture(e.pointerId);
    if (!d.started) return; // a plain click: onClick opens the page
    moved.current = true;
    delete document.body.dataset.panning;
    window.clearTimeout(settle.current);

    // Throw: carry on in the direction it was going, then settle.
    const flick = performance.now() - d.t <= 90;
    const vx = flick ? clamp(d.vx, -2600, 2600) : 0;
    const vy = flick ? clamp(d.vy, -2600, 2600) : 0;
    const anchor = anchorRef.current;
    gsap.to(moverRef.current, {
      x: clamp(d.tx + vx * 0.24, -1500, 1500),
      y: clamp(d.ty + vy * 0.24, -1100, 1100),
      rotation: clamp(vx * 0.003, -5, 5),
      scale: 1,
      duration: 0.9,
      ease: "power3.out",
      overwrite: true,
      onComplete: () => {
        gsap.set(anchor, { clearProps: "zIndex" });
      },
    });
  };

  return (
    <a
      ref={anchorRef}
      href={item.href}
      data-frame={item.id}
      data-no-curtain
      data-cursor-label={item.href ? "Open" : "Hold"}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={resetTilt}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-nodrag]")) return;
        if (moved.current) {
          e.preventDefault();
          moved.current = false;
          return;
        }
        if (!item.href) {
          e.preventDefault();
          return;
        }
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onOpen(item.id, current());
      }}
      className="group pointer-events-none absolute block outline-none"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, ...introStyle(introOn, index) }}
    >
      <div ref={moverRef} className="pointer-events-auto absolute inset-0 will-change-transform">
        <FrameName>
          {String(index).padStart(2, "0")} · {item.title} <span className="opacity-60">{item.kind}</span>
          {item.href && (
            <>
              {" "}
              <span aria-hidden>↗</span>
            </>
          )}
        </FrameName>
        <div
          ref={tiltRef}
          data-frame-image
          className="relative h-full w-full overflow-hidden bg-paper shadow-[0_1px_0_rgba(14,15,26,0.05),0_24px_48px_-24px_rgba(14,15,26,0.45)] transition-[transform,box-shadow] duration-300 ease-out group-hover:shadow-[0_44px_70px_-30px_rgba(14,15,26,0.6)]"
          style={{ transform: "perspective(1100px) rotateX(calc(var(--rx, 0) * 1deg)) rotateY(calc(var(--ry, 0) * 1deg))" }}
        >
          {item.image ? (
            <RemoteImage
              src={item.image}
              alt={`${item.title}, ${item.kind}`}
              className="h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
            />
          ) : (
            children
          )}
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.32), transparent 58%)" }}
            aria-hidden
          />
        </div>
        <Selection w={rect.w} h={rect.h} dev={dev} />
      </div>
    </a>
  );
}
