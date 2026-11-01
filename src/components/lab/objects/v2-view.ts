// V2 "Claw": draws the glass box on a canvas (prizes, claw, chute, sparkles), runs the loop and plays the sounds.
// The physics lives in v2-sim.ts. Everything here is plain DOM + canvas; React only creates and destroys it.

import { sfx } from "@/utils/ambient";
import {
  CHUTE_X,
  ClawSim,
  FLOOR_T,
  HOLE_END,
  HUB_R,
  LIP_H,
  LIP_R,
  LIP_X,
  PIVOT_Y,
  RAIL_Y,
  SIDE,
  prongPoints,
  type Body,
  type SimEvent,
} from "./v2-sim";

export interface ClawItem {
  title: string;
  accent: string;
  image: string;
}

export interface ViewCallbacks {
  onWin(proj: number): void;
  onStatus(kind: "drop" | "grip" | "slip" | "miss", proj?: number): void;
  /** Once per drawn frame: the joystick lean (-1 to 1), whether the claw is mid-drop, and where the carriage is (0 to 100). */
  onFrame(lever: number, busy: boolean, x: number): void;
}

interface Colours {
  ink: string;
  paper: string;
  paper2: string;
  cobalt: string;
  vermilion: string;
  butter: string;
  deep: string;
  spark: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  rot: number;
  spin: number;
  kind: 0 | 1; // 0 sparkle, 1 dust
  col: 0 | 1 | 2 | 3;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function shortTitle(t: string, max: number) {
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.55 ? cut.slice(0, sp) : cut) + "…";
}

export class ClawView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private items: ClawItem[];
  private cb: ViewCallbacks;
  private sim: ClawSim;
  private sprites: (HTMLCanvasElement | null)[];
  private imgs: HTMLImageElement[] = [];
  private tags: string[];
  private particles: Particle[] = [];
  private order: Body[] = [];
  private col: Colours = {
    ink: "#0e0f1a",
    paper: "#ffffff",
    paper2: "#f1f1f5",
    cobalt: "#2d3bff",
    vermilion: "#ff4d1f",
    butter: "#ffd84d",
    deep: "#14152b",
    spark: "#ffd84d",
  };
  private font = "sans-serif";
  private dpr = 1;
  private cssW = 0;
  private cssH = 0;
  private S = 1;
  private raf = 0;
  private last = 0;
  private visible = true;
  private started = false;
  private populated = false;
  private reduced = false;
  private dirty = 2;
  private lever = 0;
  private leverTarget = 0;
  private userActed = false;
  private gates: Record<string, number> = {};
  private ro: ResizeObserver | null = null;
  private io: IntersectionObserver | null = null;
  private destroyed = false;
  private clock = 0;

  constructor(canvas: HTMLCanvasElement, items: ClawItem[], cb: ViewCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.items = items;
    this.cb = cb;
    this.sprites = items.map(() => null);
    this.tags = items.map((it) => shortTitle(it.title, 11));
    this.sim = new ClawSim(items.length, mulberry((Math.random() * 4294967296) >>> 0), (e) => this.onSim(e));
    for (let i = 0; i < 64; i++) {
      this.particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1, rot: 0, spin: 0, kind: 0, col: 0 });
    }
    this.readTheme();
    this.loadImages();
    this.ro = new ResizeObserver(() => {
      // Resizing a canvas clears it, so paint it again in the same frame (no blink), then carry on as usual.
      if (!this.measure()) return;
      this.draw();
      this.dirty = 2;
      this.kick();
    });
    this.ro.observe(canvas);
    this.io = new IntersectionObserver((es) => {
      const e = es[es.length - 1];
      if (!e) return;
      this.visible = e.isIntersecting;
      if (this.visible) this.kick();
      else this.stopLoop();
    });
    this.io.observe(canvas);
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("pm:theme", this.onTheme);
    // The rail, the claw and the empty floor are there from the first paint; the prizes rain in once the hero has arrived.
    if (this.measure()) this.draw();
  }

  // ---- public API ----------------------------------------------------------------------------------------

  /** Called once the hero has arrived: prizes rain into the box (or are simply there, for reduced motion). */
  start(reduced: boolean) {
    if (this.started || this.destroyed) return;
    this.started = true;
    this.reduced = reduced;
    this.measure();
    this.ensurePopulated();
    this.kick();
  }

  /** Aim the claw at a screen x (the pointer over the glass). */
  aim(clientX: number) {
    const r = this.canvas.getBoundingClientRect();
    if (r.width < 2) return;
    this.userActed = true;
    this.sim.setTarget(((clientX - r.left) / r.width) * 100);
    this.wake();
  }

  setKey(dir: number) {
    if (dir !== 0) this.userActed = true;
    if (this.sim.claw.key === dir) return;
    this.sim.setKey(dir);
    this.wake();
  }

  drop() {
    if (!this.started || !this.populated) return false;
    this.userActed = true;
    const ok = this.sim.drop();
    if (ok) this.wake();
    return ok;
  }

  destroy() {
    this.destroyed = true;
    this.stopLoop();
    this.ro?.disconnect();
    this.io?.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("pm:theme", this.onTheme);
    for (const im of this.imgs) {
      im.onload = null;
      im.onerror = null;
    }
  }

  // ---- setup ---------------------------------------------------------------------------------------------

  private onVisibility = () => {
    if (document.hidden) this.stopLoop();
    else this.kick();
  };

  private onTheme = () => {
    this.readTheme();
    this.wake();
  };

  private readTheme() {
    const cs = getComputedStyle(document.documentElement);
    const g = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
    this.col = {
      ink: g("--ink", this.col.ink),
      paper: g("--paper", this.col.paper),
      paper2: g("--paper-2", this.col.paper2),
      cobalt: g("--cobalt", this.col.cobalt),
      vermilion: g("--vermilion", this.col.vermilion),
      butter: g("--butter", this.col.butter),
      deep: g("--deep", this.col.deep),
      spark: g("--spark", this.col.spark),
    };
    this.font = getComputedStyle(this.canvas).fontFamily || "sans-serif";
  }

  private loadImages() {
    this.items.forEach((it, i) => {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        if (this.destroyed || !im.naturalWidth || !im.naturalHeight) return;
        // One square, cover-cropped copy per prize, so each frame only has to blit it.
        const s = 256;
        const cv = document.createElement("canvas");
        cv.width = s;
        cv.height = s;
        const x = cv.getContext("2d");
        if (!x) return;
        const crop = Math.min(im.naturalWidth, im.naturalHeight);
        x.drawImage(im, (im.naturalWidth - crop) / 2, (im.naturalHeight - crop) / 2, crop, crop, 0, 0, s, s);
        this.sprites[i] = cv;
        this.wake();
      };
      im.src = it.image;
      this.imgs.push(im);
    });
  }

  /** Reads the canvas's layout size (not its transformed one: the cabinet scales in on arrival). False when it has none yet. */
  private measure() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w < 8 || h < 8) return false;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w !== this.cssW || h !== this.cssH || dpr !== this.dpr) {
      this.cssW = w;
      this.cssH = h;
      this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.S = w / 100;
      this.sim.setSize(h / this.S);
    }
    if (this.started) this.ensurePopulated();
    return true;
  }

  private ensurePopulated() {
    if (this.populated || this.cssW < 8) return;
    this.populated = true;
    this.sim.populate(this.reduced);
  }

  // ---- loop ----------------------------------------------------------------------------------------------

  private running() {
    return this.started && this.populated && this.visible && !document.hidden && !this.destroyed && this.cssW >= 8;
  }

  private wake() {
    this.dirty = 2;
    if (this.running()) this.kick();
    else if (!this.started && !this.destroyed && this.cssW >= 8) this.draw();
  }

  private kick() {
    if (this.raf || !this.running()) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private stopLoop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private loop = (ts: number) => {
    this.raf = 0;
    if (!this.running()) return;
    const dt = clamp((ts - this.last) / 1000, 0, 0.05);
    this.last = ts;
    this.clock += dt;
    const c = this.sim.claw;

    this.sim.advance(dt);
    this.updateParticles(dt);
    this.motorSound();

    // The joystick on the panel leans where the claw is being sent.
    this.leverTarget = clamp(((c.phase === "idle" ? c.tx : c.x) - 50) / 40, -1, 1);
    this.lever += (this.leverTarget - this.lever) * (1 - Math.exp(-dt * 16));
    if (Math.abs(this.leverTarget - this.lever) < 0.002) this.lever = this.leverTarget;

    this.draw();
    this.cb.onFrame(this.lever, c.phase !== "idle", c.x);
    if (this.dirty > 0) this.dirty--;

    if (this.sim.awake() || this.dirty > 0 || this.hasParticles() || this.lever !== this.leverTarget) {
      this.raf = requestAnimationFrame(this.loop);
    }
  };

  private hasParticles() {
    for (const p of this.particles) if (p.life > 0) return true;
    return false;
  }

  // ---- events from the sim -------------------------------------------------------------------------------

  private gate(key: string, ms: number) {
    const now = performance.now();
    if (now - (this.gates[key] ?? -1e9) < ms) return false;
    this.gates[key] = now;
    return true;
  }

  private onSim(e: SimEvent) {
    const c = this.sim.claw;
    const pan = clamp((c.x - 50) / 50, -1, 1) * 0.5;
    const ok = this.userActed && sfx.ready();
    switch (e.type) {
      case "drop":
        this.cb.onStatus("drop");
        if (ok) {
          sfx.burst("highpass", 2000, 0.03, 0.3, 0, pan);
          sfx.blip("sine", 820, 300, 0.1, 0.4, 0, pan);
        }
        break;
      case "land":
        this.puff(c.hx, c.hy + 6, 5);
        if (ok) {
          sfx.blip("sine", 150, 70, 0.12, 0.35, 0, pan);
          sfx.burst("lowpass", 900, 0.07, 0.3, 0, pan);
        }
        break;
      case "grip":
        this.cb.onStatus("grip", e.proj);
        this.puff(c.hx, c.hy + 14, 3);
        if (ok) {
          sfx.blip("sine", 125, 52, 0.18, 0.55, 0, pan);
          sfx.burst("bandpass", 900, 0.05, 0.35, 0, pan);
          sfx.blip("square", 300, 190, 0.05, 0.08, 0, pan, 1200);
        }
        break;
      case "slip":
        this.cb.onStatus("slip", e.proj);
        if (ok) {
          sfx.blip("sawtooth", 330, 105, 0.3, 0.1, 0, pan, 800);
          sfx.blip("sine", 210, 85, 0.22, 0.2, 0.02, pan);
        }
        break;
      case "miss":
        this.cb.onStatus("miss");
        if (ok) {
          sfx.blip("triangle", sfx.tone(5, 4), sfx.tone(2, 4), 0.26, 0.14, 0, pan);
        }
        break;
      case "release":
        if (ok) sfx.burst("bandpass", 1500, 0.04, 0.22, 0, pan);
        break;
      case "win":
        this.sparkle(CHUTE_X, this.sim.hu - FLOOR_T * 0.5);
        this.cb.onWin(e.proj);
        if (ok) {
          // The thunk in the tray, then a small run up the music's scale.
          sfx.blip("sine", 170, 58, 0.16, 0.6, 0.08, -0.4);
          sfx.burst("lowpass", 700, 0.09, 0.4, 0.08, -0.4);
          [0, 2, 4, 5, 7].forEach((s, i) => sfx.blip("triangle", sfx.tone(s, 4), sfx.tone(s, 4), 0.42, 0.22, 0.22 + i * 0.085, -0.2));
          sfx.blip("sine", sfx.tone(7, 8), sfx.tone(7, 8), 0.5, 0.08, 0.62);
        }
        break;
      case "hit":
        if (ok && e.speed > 16 && this.gate("hit", 55)) {
          const f = 180 + (e.x % 7) * 14;
          sfx.blip("triangle", f, f * 0.7, 0.07, clamp(e.speed * 0.006, 0.05, 0.22), 0, clamp((e.x - 50) / 60, -0.6, 0.6));
        }
        break;
    }
  }

  /** The soft pulse of the motors while the claw travels, lowers or climbs (a few short notes, never a held tone). */
  private motorSound() {
    if (!this.userActed || !sfx.ready()) return;
    const c = this.sim.claw;
    const sp = Math.abs(c.vx);
    const ev = Math.abs(c.extV);
    if (sp < 6 && ev < 6) return;
    if (!this.gate("hum", 95)) return;
    const pan = clamp((c.x - 50) / 50, -1, 1) * 0.5;
    if (ev > 6) {
      const down = c.extV > 0;
      const f = 120 + ev * (down ? 1.4 : 2.6);
      sfx.blip("sawtooth", f, f * (down ? 0.96 : 1.05), 0.13, 0.035, 0, pan, 520);
    } else {
      const f = 62 + sp * 1.3;
      sfx.blip("triangle", f, f, 0.14, 0.06, 0, pan, 360);
    }
  }

  // ---- particles -----------------------------------------------------------------------------------------

  private spawnParticle(kind: 0 | 1, x: number, y: number, vx: number, vy: number, life: number, size: number, col: 0 | 1 | 2 | 3) {
    for (const p of this.particles) {
      if (p.life > 0) continue;
      p.kind = kind;
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.life = life;
      p.max = life;
      p.size = size;
      p.col = col;
      p.rot = Math.random() * 3;
      p.spin = (Math.random() - 0.5) * 8;
      return;
    }
  }

  private puff(x: number, y: number, n: number) {
    if (this.reduced) return;
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1;
      this.spawnParticle(1, x + dir * (2 + Math.random() * 4), y, dir * (6 + Math.random() * 10), -4 - Math.random() * 6, 0.5 + Math.random() * 0.3, 1 + Math.random() * 1.2, 0);
    }
  }

  private sparkle(x: number, y: number) {
    if (this.reduced) return;
    for (let i = 0; i < 22; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
      const sp = 22 + Math.random() * 46;
      this.spawnParticle(0, x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, 0.7 + Math.random() * 0.5, 1.1 + Math.random() * 1.6, (i % 4) as 0 | 1 | 2 | 3);
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.kind === 0 ? 70 : 8) * dt;
      p.vx *= Math.max(0, 1 - 1.4 * dt);
      p.rot += p.spin * dt;
    }
  }

  // ---- drawing -------------------------------------------------------------------------------------------

  private draw() {
    const ctx = this.ctx;
    if (!ctx || this.cssW < 8) return;
    const { S, dpr } = this;
    const hu = this.sim.hu;
    const fy = this.sim.floorY;
    const c = this.sim.claw;
    const col = this.col;
    ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
    ctx.clearRect(0, 0, 100, hu + 1);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    this.drawRail(ctx);
    this.drawBackProng(ctx);

    // The pit, the floor's soft shadow, and each prize's shadow.
    const sh = ctx.createLinearGradient(0, fy - 5, 0, fy);
    sh.addColorStop(0, "rgba(10,12,30,0)");
    sh.addColorStop(1, "rgba(10,12,30,0.12)");
    ctx.fillStyle = sh;
    ctx.fillRect(HOLE_END, fy - 5, 100 - HOLE_END, 5);

    const bodies = this.sim.bodies;
    for (const b of bodies) {
      if (!b.live || b.x <= HOLE_END) continue;
      const lift = clamp((fy - (b.y + 8.8)) / 40, 0, 1);
      ctx.globalAlpha = 0.22 * (1 - lift) * Math.min(1, b.age / 0.2);
      ctx.fillStyle = "#0a0c1e";
      ctx.beginPath();
      ctx.ellipse(b.x, fy - 0.2, 8.2 - lift * 3, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // The glass divider between the heap and the chute.
    this.drawLip(ctx, fy);

    // Prizes, the ones lower on screen first so the higher ones sit on top of them.
    const order = this.order;
    order.length = 0;
    for (const b of bodies) if (b.live) order.push(b);
    order.sort((a, b) => b.y - a.y);
    for (const b of order) this.drawPrize(ctx, b);

    // The floor slab is in front of the prizes, so a tilted corner never shows through it; the chute is a dark opening.
    this.drawFloor(ctx, fy, hu);

    // A faint cone of light from the claw.
    {
      const g = ctx.createLinearGradient(0, c.hy, 0, c.hy + 44);
      g.addColorStop(0, "rgba(255,255,255,0.13)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(c.hx - 3, c.hy + 3);
      ctx.lineTo(c.hx + 3, c.hy + 3);
      ctx.lineTo(c.hx + 17, c.hy + 44);
      ctx.lineTo(c.hx - 17, c.hy + 44);
      ctx.closePath();
      ctx.fill();
    }

    this.drawClaw(ctx);
    this.drawParticles(ctx);

    // Hint the chute: a small arrow over the opening.
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = col.vermilion;
    ctx.beginPath();
    ctx.moveTo(CHUTE_X - 2.4, fy - 8);
    ctx.lineTo(CHUTE_X + 2.4, fy - 8);
    ctx.lineTo(CHUTE_X, fy - 4.6);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawRail(ctx: CanvasRenderingContext2D) {
    const y0 = RAIL_Y - 1.5;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + 3);
    g.addColorStop(0, "#f2f4f8");
    g.addColorStop(0.45, "#b3b9c6");
    g.addColorStop(1, "#6c7280");
    ctx.fillStyle = g;
    rr(ctx, 1.5, y0, 97, 3, 1.1);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(3, y0 + 0.35, 94, 0.25);
    // A shadow of the rail on the back wall.
    ctx.fillStyle = "rgba(10,12,30,0.10)";
    ctx.fillRect(1.5, y0 + 3, 97, 1.2);
  }

  private drawBackProng(ctx: CanvasRenderingContext2D) {
    const c = this.sim.claw;
    const depth = 1.5 + 8 * Math.cos(c.a) + 11.5 * Math.cos(c.a - 0.7);
    ctx.save();
    ctx.translate(c.hx, c.hy);
    ctx.rotate(c.th);
    ctx.strokeStyle = "#4a5060";
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(0, 1.5);
    ctx.lineTo(0, depth);
    ctx.stroke();
    ctx.strokeStyle = "#8a91a2";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
  }

  private drawLip(ctx: CanvasRenderingContext2D, fy: number) {
    const top = fy - LIP_H;
    const g = ctx.createLinearGradient(LIP_X - LIP_R, 0, LIP_X + LIP_R, 0);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(0.5, "rgba(255,255,255,0.15)");
    g.addColorStop(1, "rgba(255,255,255,0.5)");
    ctx.fillStyle = g;
    rr(ctx, LIP_X - LIP_R, top, LIP_R * 2, fy - top, 0.8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 0.22;
    ctx.stroke();
    // A little rail along the top edge of the pane, in the cabinet's accent.
    ctx.fillStyle = this.col.vermilion;
    rr(ctx, LIP_X - LIP_R - 0.5, top - 0.6, LIP_R * 2 + 1, 1.2, 0.6);
    ctx.fill();
  }

  private drawFloor(ctx: CanvasRenderingContext2D, fy: number, hu: number) {
    const col = this.col;
    // The slab.
    ctx.fillStyle = col.deep;
    ctx.fillRect(HOLE_END, fy, 100 - HOLE_END, hu - fy + 1);
    const top = ctx.createLinearGradient(0, fy, 0, fy + 2.4);
    top.addColorStop(0, "rgba(255,255,255,0.28)");
    top.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = top;
    ctx.fillRect(HOLE_END, fy, 100 - HOLE_END, 2.4);
    // The chute: a dark mouth in the floor, deeper at the back.
    const pit = ctx.createLinearGradient(0, fy, 0, hu);
    pit.addColorStop(0, "rgba(6,8,20,0.55)");
    pit.addColorStop(1, "rgba(6,8,20,0.92)");
    ctx.fillStyle = pit;
    ctx.fillRect(0, fy, HOLE_END, hu - fy + 1);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(HOLE_END - 0.3, fy, 0.3, hu - fy + 1);
  }

  private drawPrize(ctx: CanvasRenderingContext2D, b: Body) {
    const col = this.col;
    const item = this.items[b.proj];
    if (!item) return;
    const s = SIDE;
    const h = s / 2;
    const rad = s * 0.13;
    const fadeIn = Math.min(1, b.age / 0.18);
    const pop = b.age < 0.4 ? 0.72 + 0.28 * Math.min(1, b.age / 0.4) : 1;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.a);
    if (pop !== 1) ctx.scale(pop, pop);
    ctx.globalAlpha = fadeIn;

    // Contact shadow on whatever is behind.
    ctx.fillStyle = "rgba(8,10,25,0.2)";
    rr(ctx, -h + 0.4, -h + 1.1, s, s, rad);
    ctx.fill();

    rr(ctx, -h, -h, s, s, rad);
    ctx.save();
    ctx.clip();
    const sprite = this.sprites[b.proj];
    if (sprite) ctx.drawImage(sprite, -h, -h, s, s);
    else {
      // A calm placeholder in the project's own colour until the cover has loaded.
      ctx.fillStyle = item.accent;
      ctx.fillRect(-h, -h, s, s);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.arc(-h * 0.3, -h * 0.2, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
    // The lid and the ribbon.
    ctx.fillStyle = col.paper;
    ctx.globalAlpha = fadeIn * 0.94;
    ctx.fillRect(-h, -h, s, s * 0.17);
    ctx.globalAlpha = fadeIn * 0.3;
    ctx.fillStyle = "#000";
    ctx.fillRect(-h, -h + s * 0.17, s, s * 0.025);
    ctx.globalAlpha = fadeIn * 0.92;
    ctx.fillStyle = col.vermilion;
    ctx.fillRect(-s * 0.04, -h, s * 0.08, s);
    ctx.globalAlpha = fadeIn;
    // Light from the top left.
    const lg = ctx.createLinearGradient(-h, -h, h, h);
    lg.addColorStop(0, "rgba(255,255,255,0.22)");
    lg.addColorStop(0.45, "rgba(255,255,255,0)");
    lg.addColorStop(1, "rgba(0,0,0,0.26)");
    ctx.fillStyle = lg;
    ctx.fillRect(-h, -h, s, s);
    ctx.restore();

    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 0.3;
    rr(ctx, -h, -h, s, s, rad);
    ctx.stroke();

    // The bow.
    ctx.fillStyle = col.vermilion;
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 0.22;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(d * s * 0.1, -h - s * 0.005, s * 0.11, s * 0.062, d * -0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, -h + s * 0.005, s * 0.045, 0, Math.PI * 2);
    ctx.fill();

    // A paper tag with the title, hanging off the bottom corner.
    const tw = s * 0.8;
    const th = s * 0.25;
    ctx.save();
    ctx.translate(h * 0.3, h * 0.7);
    ctx.rotate(-0.1);
    ctx.fillStyle = "rgba(8,10,25,0.22)";
    rr(ctx, -tw / 2 + 0.3, -th / 2 + 0.5, tw, th, 0.5);
    ctx.fill();
    ctx.fillStyle = "#fbfaf4";
    rr(ctx, -tw / 2, -th / 2, tw, th, 0.5);
    ctx.fill();
    ctx.fillStyle = item.accent;
    ctx.fillRect(-tw / 2, -th / 2, s * 0.06, th);
    ctx.fillStyle = "#14151f";
    ctx.beginPath();
    ctx.arc(-tw / 2 + s * 0.14, 0, s * 0.02, 0, Math.PI * 2);
    ctx.fill();
    const fs = s * 0.11;
    if (fs * this.S >= 6.5) {
      ctx.font = `600 ${fs}px ${this.font}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillStyle = "#14151f";
      ctx.fillText(this.tags[b.proj], -tw / 2 + s * 0.2, 0.1, tw - s * 0.26);
    }
    ctx.restore();

    ctx.restore();
  }

  private drawClaw(ctx: CanvasRenderingContext2D) {
    const c = this.sim.claw;
    const col = this.col;
    const busy = c.phase !== "idle";
    const px = c.x;

    // Carriage on the rail.
    {
      const g = ctx.createLinearGradient(0, RAIL_Y - 2.8, 0, RAIL_Y + 2.8);
      g.addColorStop(0, "#5d6475");
      g.addColorStop(0.5, "#33384a");
      g.addColorStop(1, "#1d2030");
      ctx.fillStyle = g;
      rr(ctx, px - 5.4, RAIL_Y - 2.8, 10.8, 5.6, 1.4);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(px - 4.6, RAIL_Y - 2.5, 9.2, 0.35);
      // The little light: it brightens while the claw is working.
      const glow = busy ? 1 : 0.55;
      const rg = ctx.createRadialGradient(px, RAIL_Y, 0, px, RAIL_Y, busy ? 5.5 : 4);
      rg.addColorStop(0, col.vermilion);
      rg.addColorStop(1, "rgba(255,77,31,0)");
      ctx.globalAlpha = glow * 0.55;
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(px, RAIL_Y, busy ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = col.vermilion;
      ctx.beginPath();
      ctx.arc(px, RAIL_Y, 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(px - 0.3, RAIL_Y - 0.35, 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // The cable.
    ctx.strokeStyle = "#2c303d";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(px, PIVOT_Y - 1);
    ctx.lineTo(c.hx + Math.sin(c.th) * -HUB_R * 0.9, c.hy - HUB_R * 0.9 * Math.cos(c.th));
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 0.18;
    ctx.stroke();
    ctx.fillStyle = "#1d2030";
    ctx.beginPath();
    ctx.arc(px, PIVOT_Y, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // The head and its two visible prongs, swinging from the cable.
    ctx.save();
    ctx.translate(c.hx, c.hy);
    ctx.rotate(c.th);
    const pp = [0, 0, 0, 0, 0, 0];
    for (const side of [-1, 1]) {
      prongPoints(0, 0, c.a, side, pp);
      ctx.beginPath();
      ctx.moveTo(pp[0], pp[1]);
      ctx.lineTo(pp[2], pp[3]);
      ctx.lineTo(pp[4], pp[5]);
      ctx.strokeStyle = "#3d4352";
      ctx.lineWidth = 2.1;
      ctx.stroke();
      ctx.strokeStyle = "#cfd4de";
      ctx.lineWidth = 1.35;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 0.28;
      ctx.beginPath();
      ctx.moveTo(pp[0] - side * 0.3, pp[1] - 0.2);
      ctx.lineTo(pp[2] - side * 0.3, pp[3] - 0.2);
      ctx.stroke();
      // Rubber tip and the elbow rivet.
      ctx.fillStyle = col.vermilion;
      ctx.beginPath();
      ctx.arc(pp[4], pp[5], 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a2e3b";
      ctx.beginPath();
      ctx.arc(pp[2], pp[3], 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    // The hub: a short steel barrel with a coloured band.
    const hg = ctx.createLinearGradient(-HUB_R, 0, HUB_R, 0);
    hg.addColorStop(0, "#8d94a4");
    hg.addColorStop(0.35, "#eef0f5");
    hg.addColorStop(1, "#6a7080");
    ctx.fillStyle = hg;
    rr(ctx, -HUB_R, -HUB_R, HUB_R * 2, HUB_R * 2 - 0.4, 1.3);
    ctx.fill();
    ctx.fillStyle = col.vermilion;
    ctx.fillRect(-HUB_R, -0.4, HUB_R * 2, 1.1);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(-HUB_R, 0.7, HUB_R * 2, 0.25);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 0.22;
    rr(ctx, -HUB_R, -HUB_R, HUB_R * 2, HUB_R * 2 - 0.4, 1.3);
    ctx.stroke();
    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    const col = this.col;
    // The burst happens over the dark mouth of the chute: bright specks only (a theme's paper can be near-black).
    const colours = [col.vermilion, col.spark, "#ffffff", col.cobalt];
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      const k = clamp(p.life / p.max, 0, 1);
      if (p.kind === 1) {
        ctx.globalAlpha = k * 0.4;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.4 - k * 0.4), 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.fillStyle = colours[p.col];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const r = p.size * (0.5 + k * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.8);
      ctx.lineTo(r * 0.5, 0);
      ctx.lineTo(0, r * 1.8);
      ctx.lineTo(-r * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 1.8, 0);
      ctx.lineTo(0, r * 0.5);
      ctx.lineTo(r * 1.8, 0);
      ctx.lineTo(0, -r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
