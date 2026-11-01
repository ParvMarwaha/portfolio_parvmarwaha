import { lidSound as snd } from "./v3-sound";

/**
 * The physics and the pointer handling of the sticker lid. React renders the stickers once; from then on everything that
 * moves (position, lift, tilt, the peeling corner) is written straight to the DOM from one requestAnimationFrame loop
 * that only runs while something is still moving and the lid is on screen.
 *
 * Each sticker `.lid3-st` has these springs, in the lid's own (unrotated) pixels:
 *   ox, oy  where it has been moved to, relative to its place in the layout
 *   lift    0 = stuck down, 1 = peeled right off (scale, shadow). A spring that overshoots below 0 reads as a press-in.
 *   tilt    degrees, leaning into the direction of the drag
 *   curl    how far the nearest corner has peeled up, in em
 */

interface Spring {
  x: number;
  v: number;
  t: number;
}
const mk = (): Spring => ({ x: 0, v: 0, t: 0 });
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const near = (s: Spring, e: number) => Math.abs(s.x - s.t) < e && Math.abs(s.v) < e * 10;

function integrate(s: Spring, k: number, c: number, h: number) {
  s.v += (k * (s.t - s.x) - c * s.v) * h;
  s.x += s.v * h;
}

const CORNERS = ["tl", "tr", "bl", "br"] as const;

interface Item {
  id: string;
  index: number;
  el: HTMLElement;
  face: HTMLElement;
  cut: HTMLElement;
  z0: number;
  /** Fraction of the width the shape sits in from each box corner (tl, tr, bl, br). */
  k0: number[];
  ox: Spring;
  oy: Spring;
  lift: Spring;
  tilt: Spring;
  curl: Spring;
  /** Stiffness and damping of the position springs (stiffer while dragging, bouncier when flying home). */
  pk: number;
  pc: number;
  corner: number;
  curlOn: boolean;
  // Geometry in the lid's pixels, measured when needed.
  hidden: boolean;
  bx: number;
  by: number;
  hw: number;
  hh: number;
  wEm: number;
  // State
  active: boolean;
  down: boolean;
  dragging: boolean;
  pid: number;
  sx: number;
  sy: number;
  sox: number;
  soy: number;
  fc: number;
  fs: number;
  fscale: number;
  hover: boolean;
  hoverAt: number;
  suppress: boolean;
  resetting: boolean;
  raised: boolean;
  nudgeTimer: number;
}

export interface LidEngine {
  reset(): void;
  /** Lets one corner curl up and settle again, as a hint that stickers peel. Does nothing once the visitor has touched one. */
  peek(id: string): void;
  destroy(): void;
}

export interface LidOptions {
  lid: HTMLElement;
  items: HTMLElement[];
  announce: (message: string) => void;
}

export function createLidEngine({ lid, items: els, announce }: LidOptions): LidEngine {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = lid.offsetWidth || 1;
  let H = lid.offsetHeight || 1;
  let raf = 0;
  let last = 0;
  let visible = true;
  let destroyed = false;
  let touched = false;
  let zTop = 40;
  let hoverItem: Item | null = null;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };

  const items: Item[] = [];
  els.forEach((el, index) => {
    const face = el.querySelector<HTMLElement>(".lid3-face");
    const cut = el.querySelector<HTMLElement>(".lid3-cut");
    if (!face || !cut) return;
    items.push({
      id: el.dataset.id ?? String(index),
      index,
      el,
      face,
      cut,
      z0: Number(el.dataset.z) || 1,
      k0: (el.dataset.k0 ?? "0,0,0,0").split(",").map(Number),
      ox: mk(),
      oy: mk(),
      lift: mk(),
      tilt: mk(),
      curl: mk(),
      pk: 300,
      pc: 24,
      corner: 1,
      curlOn: false,
      hidden: false,
      bx: 0,
      by: 0,
      hw: 0,
      hh: 0,
      wEm: 10,
      active: false,
      down: false,
      dragging: false,
      pid: -1,
      sx: 0,
      sy: 0,
      sox: 0,
      soy: 0,
      fc: 1,
      fs: 0,
      fscale: 1,
      hover: false,
      hoverAt: 0,
      suppress: false,
      resetting: false,
      raised: false,
      nudgeTimer: 0,
    });
  });
  const byEl = new Map<HTMLElement, Item>(items.map((it) => [it.el, it]));
  const itemOf = (target: EventTarget | null) => {
    const el = (target as Element | null)?.closest?.<HTMLElement>(".lid3-st");
    const it = el ? byEl.get(el) : undefined;
    return it && !it.hidden ? it : undefined;
  };

  // ---- geometry --------------------------------------------------------------------------------------------

  const measure = (it: Item) => {
    const el = it.el;
    it.hidden = el.offsetParent === null || el.offsetWidth === 0;
    it.bx = el.offsetLeft;
    it.by = el.offsetTop;
    it.hw = el.offsetWidth / 2;
    it.hh = el.offsetHeight / 2;
    const em = parseFloat(getComputedStyle(el).fontSize) || 16;
    it.wEm = el.offsetWidth / em;
  };
  items.forEach(measure);

  /** Where the sticker may go: its edge stays within the lid (a hair in from the rim). */
  const bounds = (it: Item) => {
    const m = W * 0.012;
    let loX = m + it.hw - it.bx;
    let hiX = W - m - it.hw - it.bx;
    let loY = m + it.hh - it.by;
    let hiY = H - m - it.hh - it.by;
    if (loX > hiX) loX = hiX = (loX + hiX) / 2;
    if (loY > hiY) loY = hiY = (loY + hiY) / 2;
    return { loX, hiX, loY, hiY };
  };
  /** A rubber band: past the edge it gives a little, then holds. */
  const soft = (v: number, lo: number, hi: number) => {
    const s = W * 0.03;
    if (v < lo) return lo - s * (1 - Math.exp(-(lo - v) / s));
    if (v > hi) return hi + s * (1 - Math.exp(-(v - hi) / s));
    return v;
  };
  const panOf = (it: Item) => clamp(((it.bx + it.ox.x) / W - 0.5) * 1.4, -1, 1);

  /** The lid's own rotation and how much the page has scaled it, so a screen-space drag can be turned into lid space. */
  const frame = () => {
    let ang = 0;
    const m = getComputedStyle(lid).transform;
    if (m && m !== "none") {
      const v = /matrix\(([^)]+)\)/.exec(m);
      if (v) {
        const p = v[1].split(",").map(Number);
        ang = Math.atan2(p[1], p[0]);
      }
    }
    if (!Number.isFinite(ang)) ang = 0;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const r = lid.getBoundingClientRect();
    const raw = r.width / (W * Math.abs(c) + H * Math.abs(s));
    return { c, s, scale: Number.isFinite(raw) && raw > 0 ? clamp(raw, 0.4, 2.5) : 1 };
  };

  // ---- drawing ---------------------------------------------------------------------------------------------

  const cutPath = (corner: number, k: number) => {
    switch (corner) {
      case 0:
        return `polygon(${k}em 0, 100% 0, 100% 100%, 0 100%, 0 ${k}em)`;
      case 1:
        return `polygon(0 0, calc(100% - ${k}em) 0, 100% ${k}em, 100% 100%, 0 100%)`;
      case 2:
        return `polygon(0 0, 100% 0, 100% 100%, ${k}em 100%, 0 calc(100% - ${k}em))`;
      default:
        return `polygon(0 0, 100% 0, 100% calc(100% - ${k}em), calc(100% - ${k}em) 100%, 0 100%)`;
    }
  };

  const write = (it: Item) => {
    const lf = it.lift.x;
    it.el.style.transform = `translate3d(${it.ox.x.toFixed(2)}px, ${it.oy.x.toFixed(2)}px, 0) translate(-50%, -50%) rotate(${it.tilt.x.toFixed(2)}deg) scale(${(1 + 0.085 * lf).toFixed(4)})`;
    it.el.style.setProperty("--lift", (lf > 0 ? Math.min(1.2, lf) : 0).toFixed(3));
    const c = it.curl.x;
    if (c > 0.03) {
      const k = it.k0[it.corner] * it.wEm + c;
      it.el.dataset.c = CORNERS[it.corner];
      it.el.style.setProperty("--k", k.toFixed(3));
      it.cut.style.clipPath = cutPath(it.corner, k);
      it.curlOn = true;
    } else if (it.curlOn) {
      it.curlOn = false;
      it.el.style.setProperty("--k", "0");
      it.cut.style.clipPath = "";
    }
  };

  const step = (it: Item, dt: number) => {
    if (it.dragging) {
      // Pulling harder peels more; the sticker leans the way it is being dragged.
      const speed = Math.hypot(it.ox.v, it.oy.v) / W;
      it.curl.t = 2.7 + Math.min(1.6, speed * 2.2);
      it.tilt.t = clamp((it.ox.v / W) * 12, -8, 8);
    }
    if (reduced) {
      for (const s of [it.ox, it.oy, it.lift, it.tilt, it.curl]) {
        s.x = s.t;
        s.v = 0;
      }
    } else {
      const n = 2;
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        integrate(it.ox, it.pk, it.pc, h);
        integrate(it.oy, it.pk, it.pc, h);
        integrate(it.lift, 260, 15, h);
        integrate(it.tilt, 170, 15, h);
        integrate(it.curl, 300, 24, h);
      }
    }
    const still = near(it.ox, 0.04) && near(it.oy, 0.04) && near(it.lift, 0.003) && near(it.tilt, 0.02) && near(it.curl, 0.01);
    if (still) {
      for (const s of [it.ox, it.oy, it.lift, it.tilt, it.curl]) {
        s.x = s.t;
        s.v = 0;
      }
      if (it.resetting) {
        it.resetting = false;
        it.raised = false;
        it.el.style.zIndex = String(it.z0);
        snd.stick(panOf(it), 0.55);
      }
    }
    write(it);
    return !still;
  };

  const tick = (now: number) => {
    raf = 0;
    if (!visible || destroyed) return;
    const dt = clamp((now - last) / 1000, 0.001, 0.034);
    last = now;
    let more = false;
    for (const it of items) {
      if (!it.active) continue;
      it.active = step(it, dt);
      if (it.active) more = true;
    }
    if (more) raf = requestAnimationFrame(tick);
  };
  const wake = (it?: Item) => {
    if (it) it.active = true;
    if (!raf && visible && !destroyed) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };

  // ---- the sticker under the pointer -----------------------------------------------------------------------

  const quadrant = (it: Item, x: number, y: number) => {
    const r = it.el.getBoundingClientRect();
    return (y > r.top + r.height / 2 ? 2 : 0) + (x > r.left + r.width / 2 ? 1 : 0);
  };

  const enter = (it: Item, e: PointerEvent) => {
    it.hover = true;
    it.hoverAt = performance.now();
    it.corner = quadrant(it, e.clientX, e.clientY);
    if (!it.down) it.curl.t = 1.1;
    wake(it);
    // Links and buttons already get the site's own hover tick; the others get this soft lift.
    if (!it.face.matches("a,button")) snd.hover(panOf(it), it.index);
  };
  const leave = (it: Item) => {
    it.hover = false;
    if (!it.down) {
      it.curl.t = 0;
      wake(it);
    }
  };

  // A little light that follows the mouse across the metal.
  let sheenRaf = 0;
  let sx = 0;
  let sy = 0;
  const paintSheen = () => {
    sheenRaf = 0;
    const r = lid.getBoundingClientRect();
    if (!r.width || !r.height) return;
    lid.style.setProperty("--gx", `${clamp(((sx - r.left) / r.width) * 100, -10, 110).toFixed(1)}%`);
    lid.style.setProperty("--gy", `${clamp(((sy - r.top) / r.height) * 100, -10, 110).toFixed(1)}%`);
  };

  // ---- pointer ---------------------------------------------------------------------------------------------

  const grabbed = (id: number) => items.find((it) => it.down && it.pid === id);

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const it = itemOf(e.target);
    if (!it || it.down) return;
    touched = true;
    measure(it);
    const f = frame();
    it.fc = f.c;
    it.fs = f.s;
    it.fscale = f.scale;
    it.down = true;
    it.dragging = false;
    it.resetting = false;
    it.pid = e.pointerId;
    it.sx = e.clientX;
    it.sy = e.clientY;
    it.sox = it.ox.t;
    it.soy = it.oy.t;
    it.corner = quadrant(it, e.clientX, e.clientY);
    it.curl.t = Math.max(it.curl.t, 1.7);
    it.lift.t = 0.25;
    // The site's cursor reads "Moving" while this is set (and keeps its hover blips quiet).
    document.body.dataset.panning = "move";
    wake(it);
  };

  const startDrag = (it: Item) => {
    it.dragging = true;
    it.raised = true;
    it.pk = 420;
    it.pc = 30;
    it.lift.t = 1;
    it.curl.t = 2.8;
    it.el.style.zIndex = String(++zTop);
    // Only now take hold of the pointer, so a plain click still reaches its link untouched.
    try {
      it.el.setPointerCapture(it.pid);
    } catch {
      /* the pointer is already gone */
    }
    snd.peel(panOf(it));
  };

  const onMove = (e: PointerEvent) => {
    const it = grabbed(e.pointerId);
    if (it) {
      const dx = e.clientX - it.sx;
      const dy = e.clientY - it.sy;
      if (!it.dragging) {
        if (Math.hypot(dx, dy) < (e.pointerType === "mouse" ? 4 : 7)) return;
        startDrag(it);
      }
      // Screen movement -> the lid's own axes (the lid is tilted, and the page may have scaled it).
      const lx = (dx * it.fc + dy * it.fs) / it.fscale;
      const ly = (-dx * it.fs + dy * it.fc) / it.fscale;
      const b = bounds(it);
      it.ox.t = soft(it.sox + lx, b.loX, b.hiX);
      it.oy.t = soft(it.soy + ly, b.loY, b.hiY);
      wake(it);
      return;
    }
    if (e.pointerType !== "mouse") return;
    if (!reduced) {
      sx = e.clientX;
      sy = e.clientY;
      if (!sheenRaf && visible) sheenRaf = requestAnimationFrame(paintSheen);
    }
    if (items.some((i) => i.down)) return;
    const over = itemOf(e.target) ?? null;
    if (over !== hoverItem) {
      if (hoverItem) leave(hoverItem);
      hoverItem = over;
      if (over) enter(over, e);
    } else if (over && over.curl.x < 0.12) {
      // Nearly flat: the curl may move to whichever corner the mouse is closest to now.
      const q = quadrant(over, e.clientX, e.clientY);
      if (q !== over.corner) over.corner = q;
    }
  };

  const onUp = (e: PointerEvent) => {
    const it = grabbed(e.pointerId);
    if (!it) return;
    it.down = false;
    try {
      it.el.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    delete document.body.dataset.panning;
    if (it.dragging) {
      it.dragging = false;
      // Stick it down: spring to a place that is properly inside the lid, with a press-in bounce.
      const b = bounds(it);
      it.pk = 300;
      it.pc = 22;
      it.ox.t = clamp(it.ox.t, b.loX, b.hiX);
      it.oy.t = clamp(it.oy.t, b.loY, b.hiY);
      it.lift.t = 0;
      it.curl.t = 0;
      it.tilt.t = 0;
      it.suppress = true;
      later(() => (it.suppress = false), 400);
      snd.stick(panOf(it));
    } else {
      it.lift.t = 0;
      it.curl.t = it.hover ? 1.1 : 0;
    }
    wake(it);
  };

  // The window lost focus mid-press (an alert, alt-tab): let go of whatever is held.
  const releaseAll = () => {
    for (const it of items) if (it.down) onUp({ pointerId: it.pid } as PointerEvent);
  };

  const onLeave = () => {
    if (hoverItem) leave(hoverItem);
    hoverItem = null;
  };

  // A drag that ends over its own link must not also follow it.
  const onClick = (e: MouseEvent) => {
    const it = itemOf(e.target);
    if (it?.suppress) {
      it.suppress = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onContextMenu = (e: Event) => {
    if (items.some((i) => i.down)) e.preventDefault();
  };

  // ---- keyboard: arrow keys move the focused sticker (Shift for bigger steps) ------------------------------

  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const dir =
      e.key === "ArrowLeft" ? [-1, 0] : e.key === "ArrowRight" ? [1, 0] : e.key === "ArrowUp" ? [0, -1] : e.key === "ArrowDown" ? [0, 1] : null;
    if (!dir) return;
    const it = itemOf(e.target);
    if (!it) return;
    e.preventDefault();
    touched = true;
    measure(it);
    const amount = W * (e.shiftKey ? 0.045 : 0.012);
    const b = bounds(it);
    it.pk = 300;
    it.pc = 26;
    it.resetting = false;
    it.ox.t = clamp(it.ox.t + dir[0] * amount, b.loX, b.hiX);
    it.oy.t = clamp(it.oy.t + dir[1] * amount, b.loY, b.hiY);
    if (!it.raised) {
      it.raised = true;
      it.el.style.zIndex = String(++zTop);
      snd.peel(panOf(it));
    }
    it.lift.t = 0;
    it.lift.x = Math.max(it.lift.x, 0.5);
    snd.nudge(panOf(it), it.index);
    window.clearTimeout(it.nudgeTimer);
    timers.delete(it.nudgeTimer);
    it.nudgeTimer = later(() => snd.stick(panOf(it), 0.8), 260);
    wake(it);
  };

  // ---- reset, peek -----------------------------------------------------------------------------------------

  const fly = (it: Item, i: number) => {
    if (it.down) return;
    it.resetting = true;
    it.dragging = false;
    it.pk = 150;
    it.pc = 11.5;
    it.ox.t = 0;
    it.oy.t = 0;
    it.el.style.zIndex = String(++zTop);
    it.lift.x = Math.max(it.lift.x, 0.9);
    it.lift.t = 0;
    it.curl.x = Math.max(it.curl.x, 2.4);
    it.curl.t = 0;
    it.tilt.v += (i % 2 ? 1 : -1) * 70;
    it.tilt.t = 0;
    wake(it);
  };

  const reset = () => {
    const moved = items.filter((it) => !it.hidden && !it.down && (Math.abs(it.ox.t) > 0.5 || Math.abs(it.oy.t) > 0.5 || it.raised));
    if (!moved.length) {
      announce("The stickers are already where they started.");
      snd.nudge(0, 3);
      return;
    }
    snd.whoosh();
    moved.forEach((it, i) => later(() => fly(it, i), i * 55));
    announce("Stickers back where they started.");
  };

  const peek = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it || it.hidden || touched || it.hover || it.down || reduced) return;
    it.corner = 1;
    it.curl.t = 2.3;
    wake(it);
    later(() => {
      if (!it.down && !it.hover) it.curl.t = 0;
      wake(it);
    }, 850);
  };

  // ---- wiring ----------------------------------------------------------------------------------------------

  lid.addEventListener("pointerdown", onDown);
  lid.addEventListener("pointermove", onMove);
  lid.addEventListener("pointerup", onUp);
  lid.addEventListener("pointercancel", onUp);
  lid.addEventListener("lostpointercapture", onUp);
  // A release outside the lid before the drag has begun would otherwise leave the sticker held. (After the lid's own handler.)
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  window.addEventListener("blur", releaseAll);
  lid.addEventListener("pointerleave", onLeave);
  lid.addEventListener("keydown", onKey);
  lid.addEventListener("click", onClick, true);
  lid.addEventListener("contextmenu", onContextMenu);

  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible && items.some((i) => i.active)) wake();
  });
  io.observe(lid);

  // When the lid changes size (window resize, the phone layout kicking in) everything keeps its place as a fraction of the lid.
  const ro = new ResizeObserver(() => {
    const nw = lid.offsetWidth;
    const nh = lid.offsetHeight;
    if (!nw || !nh) return;
    const ratio = nw / W;
    W = nw;
    H = nh;
    for (const it of items) {
      if (ratio !== 1) {
        for (const s of [it.ox, it.oy]) {
          s.x *= ratio;
          s.v *= ratio;
          s.t *= ratio;
        }
        it.sox *= ratio;
        it.soy *= ratio;
      }
      measure(it);
      if (it.ox.x || it.oy.x) {
        const b = bounds(it);
        it.ox.t = clamp(it.ox.t, b.loX, b.hiX);
        it.oy.t = clamp(it.oy.t, b.loY, b.hiY);
        it.active = true;
      }
    }
    wake();
  });
  ro.observe(lid);

  return {
    reset,
    peek,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sheenRaf);
      raf = sheenRaf = 0;
      lid.removeEventListener("pointerdown", onDown);
      lid.removeEventListener("pointermove", onMove);
      lid.removeEventListener("pointerup", onUp);
      lid.removeEventListener("pointercancel", onUp);
      lid.removeEventListener("lostpointercapture", onUp);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", releaseAll);
      lid.removeEventListener("pointerleave", onLeave);
      lid.removeEventListener("keydown", onKey);
      lid.removeEventListener("click", onClick, true);
      lid.removeEventListener("contextmenu", onContextMenu);
      io.disconnect();
      ro.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
      if (document.body.dataset.panning === "move") delete document.body.dataset.panning;
    },
  };
}
