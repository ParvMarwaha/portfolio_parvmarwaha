"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "@/utils/gsap";
import { experiments } from "@/content/lab";
import CursorGlyph from "@/components/ui/CursorGlyph";
import RemoteImage from "@/components/ui/RemoteImage";
import { buildWorld, type Rect } from "./world";
import Cover from "./Cover";
import Frame, { type FrameHandle } from "./Frame";
import PlayFrame from "./PlayFrame";
import { EXPERIMENT_VIEWS } from "./experiments";
import Sticky from "./Sticky";
import CommentPin from "./CommentPin";

const ARRANGE_BTN =
  "whitespace-nowrap rounded-full px-2.5 py-1.5 text-[0.75rem] font-medium tracking-normal text-ink/70 transition-colors hover:bg-ink hover:text-paper md:px-3.5";
const MIN_Z = 0.18;
const MAX_Z = 2.6;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Entering {
  href: string;
  from: DOMRect;
  src?: string;
}

/**
 * The Lab: experiments laid out as one pannable, zoomable design file. Drag or scroll to move, pinch or
 * Ctrl+scroll to zoom, pick frames up and throw them, press D for dev mode and F for an overview.
 */
export default function Canvas() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLDivElement>(null);

  const cam = useRef({ cx: 0, cy: 0, z: 1 }); // what is drawn
  const target = useRef({ cx: 0, cy: 0, z: 1 }); // where it is heading
  const vel = useRef({ x: 0, y: 0 });
  const view = useRef({ w: 1200, h: 800 });
  const flying = useRef(false);
  const interacted = useRef(false);
  const dragRef = useRef<{ id: number; x: number; y: number; moved: boolean; sx: number; sy: number; t: number } | null>(null);
  const boundsRef = useRef<Rect>({ x: -1000, y: -600, w: 2000, h: 1200 });
  const panBoundsRef = useRef<Rect>({ x: -1600, y: -1000, w: 3200, h: 2000 });
  const frameApis = useRef<Record<string, FrameHandle>>({});
  const awayRef = useRef(false);
  // Once a frame has been chosen, nothing else may interrupt the trip to its page.
  const navigating = useRef(false);
  const navTimer = useRef(0);

  const [vp, setVp] = useState({ w: 1440, h: 900 });
  const [ready, setReady] = useState(false);
  const [introOn, setIntroOn] = useState(false);
  const [dev, setDev] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [ghostHover, setGhostHover] = useState<string | null>(null);
  const [away, setAway] = useState(false);
  const [hinted, setHinted] = useState(true);
  const [entering, setEntering] = useState<Entering | null>(null);

  const narrow = vp.w < 700;
  const coverW = narrow ? Math.min(340, vp.w - 32) : Math.min(1040, vp.w - 72);
  const coverH = narrow ? 580 : Math.round(coverW * 0.6);
  const world = useMemo(() => buildWorld(coverW, coverH, experiments.length), [coverW, coverH]);
  const worldRefValue = useRef(world);
  useEffect(() => {
    worldRefValue.current = world;
    boundsRef.current = world.bounds;
    // Wider than the content, so frames you have thrown out of the file can still be reached.
    const b = world.bounds;
    panBoundsRef.current = { x: b.x - 700, y: b.y - 500, w: b.w + 1400, h: b.h + 1000 };
  });

  const markInteracted = useCallback(() => {
    if (interacted.current) return;
    interacted.current = true;
    setHinted(false);
  }, []);

  // ---- camera --------------------------------------------------------------
  const apply = useCallback(() => {
    const world = worldRef.current;
    const grid = gridRef.current;
    if (!world || !grid) return;
    const { cx, cy, z } = cam.current;
    const { w, h } = view.current;
    const tx = w / 2 - cx * z;
    const ty = h / 2 - cy * z;
    world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${z})`;
    world.style.setProperty("--inv", String(1 / z));
    const step = 24 * z * (z < 0.5 ? 2 : 1);
    grid.style.backgroundSize = `${step}px ${step}px`;
    grid.style.backgroundPosition = `${tx}px ${ty}px`;
  }, []);

  const fitRect = useCallback((r: Rect, frac: number) => {
    const { w, h } = view.current;
    return {
      cx: r.x + r.w / 2,
      cy: r.y + r.h / 2,
      z: clamp(Math.min((w * frac) / r.w, (h * frac) / r.h), MIN_Z, 2.4),
    };
  }, []);

  const flyTo = useCallback(
    (to: { cx: number; cy: number; z: number }, duration = 1.1, onDone?: () => void) => {
      flying.current = true;
      vel.current = { x: 0, y: 0 };
      gsap.killTweensOf([cam.current, target.current]);
      gsap.to(target.current, { ...to, duration, ease: "power3.inOut", overwrite: true });
      gsap.to(cam.current, {
        ...to,
        duration,
        ease: "power3.inOut",
        overwrite: true,
        onComplete: () => {
          flying.current = false;
          onDone?.();
        },
      });
    },
    []
  );

  const goCover = useCallback(() => {
    const w = worldRefValue.current;
    const z = narrow ? 1 : Math.min(2.4, (view.current.w - 48) / w.cover.w, (view.current.h - 140) / w.cover.h);
    flyTo({ cx: 0, cy: 0, z }, 1.1);
  }, [flyTo, narrow]);

  const overview = useCallback(() => {
    markInteracted();
    flyTo(fitRect(boundsRef.current, 0.9), 1.2);
  }, [flyTo, fitRect, markInteracted]);

  // ---- measuring -----------------------------------------------------------
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let first = true;
    const measure = () => {
      const r = el.getBoundingClientRect();
      view.current = { w: r.width, h: r.height };
      setVp({ w: r.width, h: r.height });
      if (first) {
        first = false;
        const isNarrow = r.width < 700;
        const cw = isNarrow ? Math.min(340, r.width - 32) : Math.min(1040, r.width - 72);
        const ch = isNarrow ? 580 : Math.round(cw * 0.6);
        const z = isNarrow ? 1 : Math.min(2.4, (r.width - 48) / cw, (r.height - 140) / ch);
        cam.current = { cx: 0, cy: 0, z };
        target.current = { cx: 0, cy: 0, z };
        setReady(true);
      }
      apply();
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [apply]);

  // ---- render loop: easing, inertia, bounds --------------------------------
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const c = cam.current;
      const t = target.current;

      if (!flying.current) {
        if (!dragRef.current?.moved) {
          // Glide on after a flick.
          t.cx += vel.current.x * dt;
          t.cy += vel.current.y * dt;
          const decay = Math.exp(-dt * 4.2);
          vel.current.x *= decay;
          vel.current.y *= decay;
          if (Math.abs(vel.current.x) < 2) vel.current.x = 0;
          if (Math.abs(vel.current.y) < 2) vel.current.y = 0;
        }
        const b = panBoundsRef.current;
        t.cx = clamp(t.cx, b.x, b.x + b.w);
        t.cy = clamp(t.cy, b.y, b.y + b.h);
        t.z = clamp(t.z, MIN_Z, MAX_Z);
        const k = reduced ? 1 : 1 - Math.exp(-dt * 13);
        c.cx += (t.cx - c.cx) * k;
        c.cy += (t.cy - c.cy) * k;
        c.z += (t.z - c.z) * k;
      }
      apply();

      // Offer a way home once the cover is far out of view.
      const far = Math.hypot(c.cx, c.cy) * c.z > Math.max(view.current.w, view.current.h) * 0.9;
      if (far !== awayRef.current) {
        awayRef.current = far;
        setAway(far);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [apply]);

  // ---- input ---------------------------------------------------------------
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (navigating.current) return;
      markInteracted();
      if (flying.current) return;
      const t = target.current;
      if (e.ctrlKey || e.metaKey) {
        // Pinch (trackpad) or Ctrl+scroll: zoom around the pointer.
        const { w, h } = view.current;
        const z0 = t.z;
        const z1 = clamp(z0 * Math.exp(-e.deltaY * 0.01), MIN_Z, MAX_Z);
        const wx = t.cx + (e.clientX - w / 2) / z0;
        const wy = t.cy + (e.clientY - h / 2) / z0;
        t.z = z1;
        t.cx = wx - (e.clientX - w / 2) / z1;
        t.cy = wy - (e.clientY - h / 2) / z1;
      } else {
        t.cx += e.deltaX / t.z;
        t.cy += e.deltaY / t.z;
      }
      vel.current = { x: 0, y: 0 };
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [markInteracted]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("[data-nodrag]") || navigating.current) return;
    markInteracted();
    flying.current = false;
    gsap.killTweensOf([cam.current, target.current]);
    vel.current = { x: 0, y: 0 };
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, sx: e.clientX, sy: e.clientY, t: performance.now() };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return;
      d.moved = true;
      // Capture only once it is a real drag, so plain clicks still reach the frames.
      rootRef.current?.setPointerCapture(e.pointerId);
      document.body.dataset.panning = "1";
    }
    const now = performance.now();
    const dt = Math.max(0.008, (now - d.t) / 1000);
    const z = cam.current.z;
    const dx = (e.clientX - d.x) / z;
    const dy = (e.clientY - d.y) / z;
    cam.current.cx -= dx;
    cam.current.cy -= dy;
    target.current.cx = cam.current.cx;
    target.current.cy = cam.current.cy;
    // Smoothed pointer velocity in world units per second, capped so a flick can never fling it across the file.
    const cap = 2600 / z;
    vel.current.x = clamp(vel.current.x * 0.6 + (-dx / dt) * 0.4, -cap, cap);
    vel.current.y = clamp(vel.current.y * 0.6 + (-dy / dt) * 0.4, -cap, cap);
    d.x = e.clientX;
    d.y = e.clientY;
    d.t = now;
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.moved) {
      rootRef.current?.releasePointerCapture(e.pointerId);
      delete document.body.dataset.panning;
      // A pause before release means no flick.
      if (performance.now() - d.t > 90) vel.current = { x: 0, y: 0 };
    }
    dragRef.current = null;
  };

  const register = useCallback((slug: string, handle: FrameHandle | null) => {
    if (handle) frameApis.current[slug] = handle;
    else delete frameApis.current[slug];
  }, []);

  // Picking up a frame counts as using the page, and stops the demo cursor.
  const grab = useCallback(() => {
    markInteracted();
    window.dispatchEvent(new Event("pm:interact"));
  }, [markInteracted]);

  // Shuffle / Tidy up: the camera pulls back to look over the file, then the frames lift left to right,
  // travel and land with a small bounce.
  const wave = useCallback(
    (kind: "scatter" | "tidy") => {
      if (navigating.current) return;
      grab();
      flyTo(fitRect(boundsRef.current, 0.8), 1.0);
      const slots = worldRefValue.current.slots;
      const order = experiments.map((e, i) => ({ slug: e.id, x: slots[i].x })).sort((a, b) => a.x - b.x);
      window.setTimeout(() => order.forEach((o, i) => frameApis.current[o.slug]?.[kind](i * 0.07)), 450);
    },
    [grab, flyTo, fitRect]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || navigating.current) return;
      const t = target.current;
      const step = 160 / t.z;
      if (e.key === "d" || e.key === "D") {
        markInteracted();
        setDev((v) => !v);
      } else if (e.key === "f" || e.key === "F") overview();
      else if (e.key === "s" || e.key === "S") wave("scatter");
      else if (e.key === "t" || e.key === "T") wave("tidy");
      else if (e.key === "0") goCover();
      else if (e.key === "ArrowLeft") t.cx -= step;
      else if (e.key === "ArrowRight") t.cx += step;
      else if (e.key === "ArrowUp") t.cy -= step;
      else if (e.key === "ArrowDown") t.cy += step;
      else if (e.key === "+" || e.key === "=") t.z = clamp(t.z * 1.2, MIN_Z, MAX_Z);
      else if (e.key === "-") t.z = clamp(t.z / 1.2, MIN_Z, MAX_Z);
      else return;
      markInteracted();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overview, goCover, markInteracted, wave]);

  // ---- entering a page ------------------------------------------------------
  const enter = useCallback(
    (href: string, rect: Rect, imgSelector?: string) => {
      if (navigating.current) return;
      navigating.current = true;
      markInteracted();
      setCommentOpen(false);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        router.push(href);
        return;
      }
      router.prefetch(href);
      // Safety net: whatever happens to the animation, the page still opens.
      navTimer.current = window.setTimeout(() => router.push(href), 2600);
      flyTo(fitRect(rect, 0.78), 0.75, () => {
        const el = document.querySelector<HTMLElement>(imgSelector ?? `[data-frame="play"] > div`);
        const from = el?.getBoundingClientRect() ?? new DOMRect(view.current.w * 0.1, view.current.h * 0.1, view.current.w * 0.8, view.current.h * 0.8);
        const img = el?.querySelector("img") as HTMLImageElement | null;
        setEntering({ href, from, src: img?.src });
      });
    },
    [fitRect, flyTo, markInteracted, router]
  );

  useEffect(() => {
    const el = enterRef.current;
    if (!entering || !el) return;
    const { from } = entering;
    gsap.set(el, { left: from.left, top: from.top, width: from.width, height: from.height });
    const tween = gsap.to(el, {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      duration: 0.65,
      ease: "expo.inOut",
      onComplete: () => router.push(entering.href),
    });
    return () => {
      tween.kill();
    };
  }, [entering, router]);

  // ---- intro + ghost cursor --------------------------------------------------
  useEffect(() => {
    if (!ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;
    const go = () => {
      setIntroOn(true);
      let seen = false;
      try {
        seen = sessionStorage.getItem("pm-ghost") === "1";
      } catch {}
      if (reduced || seen || !ghostRef.current) return;
      timer = window.setTimeout(runGhost, 2400);
    };

    let tl: gsap.core.Timeline | null = null;
    const stopGhost = () => {
      if (tl) {
        tl.kill();
        tl = null;
        gsap.to(ghostRef.current, { opacity: 0, duration: 0.25 });
        setCommentOpen(false);
        setGhostHover(null);
      }
    };

    const runGhost = () => {
      const el = ghostRef.current;
      if (!el || interacted.current) return;
      try {
        sessionStorage.setItem("pm-ghost", "1");
      } catch {}
      const w = worldRefValue.current;
      gsap.set(el, { x: w.cover.x + w.cover.w + 320, y: w.cover.y + w.cover.h - 40, opacity: 0 });
      tl = gsap
        .timeline()
        .to(el, { opacity: 1, duration: 0.4 })
        .to(el, { x: w.pin.x + 4, y: w.pin.y + 4, duration: 1.5, ease: "power2.inOut" })
        .call(() => setCommentOpen(true))
        .to({}, { duration: 3.6 })
        .call(() => setCommentOpen(false))
        .to(el, { x: w.play.x + w.play.w * 0.55, y: w.play.y + w.play.h * 0.6, duration: 1.4, ease: "power2.inOut" })
        .call(() => setGhostHover("play"))
        .to({}, { duration: 1.3 })
        .call(() => setGhostHover(null))
        .to(el, { x: w.play.x + w.play.w + 420, y: w.play.y - 40, opacity: 0, duration: 1.3, ease: "power2.in" });
    };

    const stopOnInput = () => stopGhost();
    window.addEventListener("pm:interact", stopOnInput);
    window.addEventListener("pointerdown", stopOnInput);
    window.addEventListener("wheel", stopOnInput, { passive: true });
    window.addEventListener("keydown", stopOnInput);

    if (window.__introDone) timer = window.setTimeout(go, 150);
    else window.addEventListener("intro:done", go, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("intro:done", go);
      window.removeEventListener("pm:interact", stopOnInput);
      window.removeEventListener("pointerdown", stopOnInput);
      window.removeEventListener("wheel", stopOnInput);
      window.removeEventListener("keydown", stopOnInput);
      tl?.kill();
    };
  }, [ready]);

  useEffect(() => () => window.clearTimeout(navTimer.current), []);

  const zoom = useCallback(() => cam.current.z, []);

  return (
    <main
      ref={rootRef}
      data-lenis-prevent
      tabIndex={0}
      aria-label="Lab canvas. Drag to explore."
      className="fixed inset-0 touch-none select-none overflow-hidden bg-paper outline-none"
      style={{ overscrollBehavior: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-frame],[data-nodrag],[data-cover]")) return;
        overview();
      }}
    >
      <div
        ref={gridRef}
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "radial-gradient(circle, rgba(14,15,26,0.2) 1px, transparent 1.4px)", backgroundSize: "24px 24px" }}
        aria-hidden
      />

      <div
        ref={worldRef}
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{ visibility: ready ? "visible" : "hidden" }}
      >
        <Cover rect={world.cover} narrow={narrow} dev={dev} introOn={introOn} onOverview={overview} />

        {experiments.map((e, i) => (
          <Frame
            key={e.id}
            register={register}
            item={e}
            rect={world.slots[i]}
            index={i + 1}
            introOn={introOn}
            dev={dev}
            zoom={zoom}
            onGrab={grab}
            onOpen={(id, r) => {
              if (e.href) enter(e.href, r, `[data-frame="${id}"] [data-frame-image]`);
            }}
          >
            {EXPERIMENT_VIEWS[e.id]}
          </Frame>
        ))}

        <PlayFrame
          rect={world.play}
          introOn={introOn}
          dev={dev}
          highlighted={ghostHover === "play"}
          onOpen={() => enter("/play", world.play)}
        />

        {world.notes.map((n, i) => (
          <Sticky key={n.id} spec={n} index={i} introOn={introOn} zoom={zoom} />
        ))}

        <CommentPin x={world.pin.x} y={world.pin.y} open={commentOpen} onToggle={() => setCommentOpen((v) => !v)} introOn={introOn} />

        {/* Parv's cursor, doing a short demo the first time you arrive */}
        <div ref={ghostRef} className="pointer-events-none absolute left-0 top-0 z-30 opacity-0" aria-hidden>
          <div style={{ transform: "scale(var(--inv, 1))", transformOrigin: "0 0" }}>
            <CursorGlyph color="var(--vermilion)" label="Parv" />
          </div>
        </div>
      </div>

      {/* Small controls, kept out of the way */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-between p-3 md:p-5">
        <div className="pointer-events-auto flex items-center gap-3" data-nodrag>
          <div className="flex rounded-full bg-paper/85 p-1 ring-1 ring-ink/10 backdrop-blur-md" role="group" aria-label="View mode">
            {[
              { id: false, label: "Design" },
              { id: true, label: "Dev" },
            ].map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => {
                  markInteracted();
                  setDev(m.id);
                }}
                aria-pressed={dev === m.id}
                className={`rounded-full px-3.5 py-1.5 text-[0.75rem] font-medium tracking-normal transition-colors ${
                  dev === m.id ? (m.id ? "bg-cobalt text-white" : "bg-ink text-paper") : "text-ink/60 hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <span
            className={`label hidden text-mute transition-opacity duration-700 md:block ${hinted ? "opacity-100" : "opacity-0"}`}
          >
            Drag to explore · pick up and throw frames · S shuffle · T tidy up · D dev mode
          </span>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2 md:flex-row md:items-center" data-nodrag>
          <button
            type="button"
            onClick={goCover}
            className={`rounded-full bg-ink px-4 py-2 text-[0.75rem] font-medium tracking-normal text-paper transition-all duration-300 ${
              away ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
            }`}
          >
            Back to cover
          </button>
          <div className="flex rounded-full bg-paper/85 p-1 ring-1 ring-ink/10 backdrop-blur-md" role="group" aria-label="Arrange frames">
            <button type="button" onClick={() => wave("scatter")} className={ARRANGE_BTN}>
              Shuffle
            </button>
            <button type="button" onClick={() => wave("tidy")} className={ARRANGE_BTN}>
              Tidy up
            </button>
            <button type="button" onClick={overview} className={ARRANGE_BTN}>
              Overview
            </button>
          </div>
        </div>
      </div>

      {/* Same links for keyboards, screen readers and search engines */}
      <nav className="sr-only" aria-label="Experiments">
        <ul>
          {experiments.map((e) => (
            <li key={e.id}>
              {e.href ? <Link href={e.href}>{e.title}</Link> : e.title}: {e.note}
            </li>
          ))}
          <li>
            <Link href="/play">Off hours: a game</Link>
          </li>
        </ul>
      </nav>

      {/* The frame you chose opens out to fill the screen, then the page takes over */}
      {entering && (
        <div ref={enterRef} className="pointer-events-none fixed z-[70] overflow-hidden bg-deep">
          {entering.src && <RemoteImage src={entering.src} alt="" className="h-full w-full object-cover" />}
        </div>
      )}
    </main>
  );
}
