// V2 "Claw": the physics and the claw's state machine. No DOM in here, so it can be reasoned about (and tested) on its own.
// World units: the glass is 100 units wide; the height follows from its shape. y grows downward.

export const W = 100;
/** Collision radius of a prize (a square box of side SIDE; the circle is a little larger than the box's inscribed one). */
export const R = 8.8;
export const SIDE = R / 0.58;
export const FLOOR_T = 7;
/** The floor starts here; to the left of it is the chute, an opening the prizes fall through. */
export const HOLE_END = 22.6;
export const LIP_X = 23.4;
export const LIP_H = 44;
export const LIP_R = 1.1;
export const CHUTE_X = 11.3;
export const RAIL_Y = 4.4;
export const PIVOT_Y = RAIL_Y + 2.5;
export const X_MIN = 11.3;
export const X_MAX = 89;
export const CABLE0 = 5;
export const HUB_R = 3.4;
export const HUB_W = 2.4;
export const L1 = 8;
export const L2 = 11.5;
export const BEND = 0.7;
export const A_OPEN = 1.2;
export const A_IDLE = 0.9;
export const A_MIN = 0.2;
/** Half the thickness of a prong. */
export const PR = 0.75;

const G = 430;
export const DT = 1 / 120;
const KEY_SPEED = 55;
const LOWER_V = 40;
const RISE_V = 44;
const CLOSE_V = 0.95;
/** Where a held prize's centre sits below the hub: right under it. */
const POCKET_Y = HUB_R + R + 0.1;

export interface Body {
  proj: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Drawn angle. Follows the rolling while the prize moves, then settles to a gentle tilt. */
  a: number;
  w: number;
  tilt: number;
  live: boolean;
  /** Seconds until it enters the box (entrance rain and restocking). */
  wait: number;
  age: number;
  asleep: boolean;
  sleepT: number;
  /** Where it was at the start of the last step (to tell real movement from a prize that is just being wedged in place). */
  px: number;
  py: number;
  /** Seconds spent nearly still, not reset by a nudge: a prize that something keeps tickling still goes to sleep in the end. */
  calm: number;
  held: boolean;
}

export type Phase = "idle" | "lower" | "settle" | "close" | "hold" | "rise" | "travel" | "release" | "reopen";

export type SimEvent =
  | { type: "drop" }
  | { type: "land" }
  | { type: "grip"; proj: number }
  | { type: "slip"; proj: number }
  | { type: "miss" }
  | { type: "release" }
  | { type: "win"; proj: number }
  | { type: "hit"; speed: number; x: number };

export interface Claw {
  x: number;
  vx: number;
  tx: number;
  ax: number;
  lockX: number;
  key: number;
  ext: number;
  extV: number;
  a: number;
  aTarget: number;
  aRate: number;
  th: number;
  om: number;
  phase: Phase;
  t: number;
  hx: number;
  hy: number;
  cand: Body | null;
  held: Body | null;
  relX: number;
  relY: number;
  decided: boolean;
  candOff: number;
  everHeld: boolean;
  slipPlan: boolean;
  slipAt: number;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const approach = (v: number, to: number, step: number) => (v < to ? Math.min(to, v + step) : Math.max(to, v - step));

/** The three points of one prong (shoulder, elbow, tip): s is +1 for the right prong, -1 for the left. */
export function prongPoints(hx: number, hy: number, a: number, s: number, o: number[]) {
  const x0 = hx + s * HUB_W;
  const y0 = hy + 1.5;
  const x1 = x0 + s * L1 * Math.sin(a);
  const y1 = y0 + L1 * Math.cos(a);
  const b = a - BEND;
  o[0] = x0;
  o[1] = y0;
  o[2] = x1;
  o[3] = y1;
  o[4] = x1 + s * L2 * Math.sin(b);
  o[5] = y1 + L2 * Math.cos(b);
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby || 1;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / len2, 0, 1);
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

export class ClawSim {
  hu = 86;
  floorY = 79;
  bodies: Body[] = [];
  claw: Claw;
  /** The distance from the last body asked about to the left and right prong. */
  dL = 99;
  dR = 99;
  private count: number;
  private rng: () => number;
  private emit: (e: SimEvent) => void;
  private acc = 0;
  private hist: boolean[] = [];
  private pp: number[] = [0, 0, 0, 0, 0, 0];

  constructor(count: number, rng: () => number, emit: (e: SimEvent) => void) {
    this.count = count;
    this.rng = rng;
    this.emit = emit;
    this.claw = this.freshClaw();
  }

  private freshClaw(): Claw {
    const c: Claw = {
      x: 60,
      vx: 0,
      tx: 60,
      ax: 0,
      lockX: 60,
      key: 0,
      ext: 0,
      extV: 0,
      a: A_IDLE,
      aTarget: A_IDLE,
      aRate: 2.5,
      th: 0,
      om: 0,
      phase: "idle",
      t: 0,
      hx: 60,
      hy: PIVOT_Y + CABLE0,
      cand: null,
      held: null,
      relX: 0,
      relY: 0,
      decided: false,
      candOff: 99,
      everHeld: false,
      slipPlan: false,
      slipAt: -1,
    };
    return c;
  }

  setSize(hu: number) {
    const h = clamp(hu, 60, 130);
    const d = h - this.hu;
    this.hu = h;
    this.floorY = h - FLOOR_T;
    // Keep everything standing on the floor when the glass changes shape.
    if (d !== 0) for (const b of this.bodies) if (b.live) b.y += d;
  }

  populate(settled: boolean) {
    const order: number[] = [];
    for (let i = 0; i < this.count; i++) order.push(i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    this.bodies = order.map((proj, i) => ({
      proj,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      a: 0,
      w: 0,
      tilt: (this.rng() - 0.5) * 0.55,
      live: false,
      wait: 0.25 + i * 0.13,
      age: 0,
      asleep: false,
      sleepT: 0,
      px: 0,
      py: 0,
      calm: 0,
      held: false,
    }));
    this.claw = this.freshClaw();
    this.hist = [];
    this.updateHub();
    if (settled) {
      this.bodies.forEach((b, i) => this.spawn(b, i));
      for (let k = 0; k < 560; k++) this.step(DT);
      for (const b of this.bodies) b.age = 1;
    }
  }

  /** Where a new prize should drop in: the lowest part of the heap out of a few tries, so the pile spreads out instead of towering. */
  private pickX() {
    const lo = 34;
    const hi = 89;
    let best = lo + this.rng() * (hi - lo);
    let bs = -1e9;
    for (let k = 0; k < 6; k++) {
      const x = lo + this.rng() * (hi - lo);
      let top = this.floorY;
      for (const o of this.bodies) {
        if (!o.live || Math.abs(o.x - x) > 1.7 * R) continue;
        top = Math.min(top, o.y - R * 0.6);
      }
      const score = top + this.rng() * 5;
      if (score > bs) {
        bs = score;
        best = x;
      }
    }
    return best;
  }

  private spawn(b: Body, lift: number) {
    const x = this.pickX();
    b.live = true;
    b.age = 0;
    b.asleep = false;
    b.sleepT = 0;
    b.calm = 0;
    b.held = false;
    b.x = x;
    b.px = x;
    b.y = -R - 1 - this.rng() * 3 - lift * (2 * R + 1);
    b.vx = (this.rng() - 0.5) * 8;
    b.vy = 25;
    b.a = (this.rng() - 0.5) * 1.4;
    b.w = (this.rng() - 0.5) * 3;
  }

  /** Where the pointer wants the claw (world x). */
  setTarget(x: number) {
    this.claw.tx = clamp(x, X_MIN, X_MAX);
  }

  setKey(dir: number) {
    this.claw.key = dir;
  }

  canDrop() {
    return this.claw.phase === "idle" && this.bodies.length > 0;
  }

  drop() {
    const c = this.claw;
    if (!this.canDrop()) return false;
    c.phase = "lower";
    c.t = 0;
    c.lockX = c.x;
    c.extV = 0;
    c.aTarget = A_OPEN;
    c.aRate = 4;
    c.cand = null;
    c.decided = false;
    c.everHeld = false;
    c.slipPlan = false;
    this.emit({ type: "drop" });
    return true;
  }

  /** True while anything is moving or counting down; false when the view can stop drawing. */
  awake() {
    const c = this.claw;
    if (c.phase !== "idle") return true;
    if (c.key !== 0 || Math.abs(c.tx - c.x) > 0.03 || Math.abs(c.vx) > 0.2) return true;
    if (Math.abs(c.th) > 0.004 || Math.abs(c.om) > 0.02) return true;
    if (Math.abs(c.a - c.aTarget) > 0.01) return true;
    for (const b of this.bodies) if (!b.live || !b.asleep || b.age < 0.5) return true;
    return false;
  }

  advance(dt: number) {
    if (!this.awake()) {
      this.acc = 0;
      return;
    }
    this.acc += dt;
    let n = 0;
    while (this.acc >= DT && n < 6) {
      this.step(DT);
      this.acc -= DT;
      n++;
    }
    if (n >= 6) this.acc = 0;
  }

  step(dt: number) {
    const c = this.claw;
    if (c.phase !== "idle") for (const b of this.bodies) if (b.asleep) this.wake(b);
    this.stepClaw(dt);
    for (const b of this.bodies) {
      if (!b.live) {
        b.wait -= dt;
        if (b.wait <= 0) this.spawn(b, 0);
        continue;
      }
      b.age += dt;
      if (b.held || b.asleep) continue;
      b.px = b.x;
      b.py = b.y;
      b.vy += G * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.a += b.w * dt;
      const lin = Math.max(0, 1 - 0.22 * dt);
      b.vx *= lin;
      b.vy *= lin;
      b.w *= Math.max(0, 1 - 1.0 * dt);
    }
    this.collideClaw();
    for (let it = 0; it < 4; it++) {
      this.pairs();
      this.statics();
    }
    this.settleAndWin(dt);
  }

  private wake(b: Body) {
    b.asleep = false;
    b.sleepT = 0;
  }

  private maxExt() {
    const reach = 1.5 + L1 * Math.cos(A_OPEN) + L2 * Math.cos(A_OPEN - BEND);
    return this.floorY - reach - 0.6 - PIVOT_Y - CABLE0;
  }

  private updateHub() {
    const c = this.claw;
    const cable = CABLE0 + c.ext;
    c.hx = c.x + Math.sin(c.th) * cable;
    c.hy = PIVOT_Y + Math.cos(c.th) * cable;
  }

  private stepClaw(dt: number) {
    const c = this.claw;
    const prevHy = c.hy;

    // The carriage: a spring with a speed limit, so it has weight and eases to a stop.
    let target = c.lockX;
    let vmax = 62;
    if (c.phase === "idle") {
      if (c.key !== 0) c.tx = clamp(c.tx + c.key * KEY_SPEED * dt, X_MIN, X_MAX);
      target = c.tx;
    } else if (c.phase === "travel") {
      target = CHUTE_X;
      vmax = 48;
    }
    const vOld = c.vx;
    c.vx = clamp(c.vx + (110 * (target - c.x) - 17 * c.vx) * dt, -vmax, vmax);
    c.x = clamp(c.x + c.vx * dt, X_MIN, X_MAX);
    if ((c.x <= X_MIN && c.vx < 0) || (c.x >= X_MAX && c.vx > 0)) c.vx = 0;
    if (Math.abs(target - c.x) < 0.02 && Math.abs(c.vx) < 0.25) {
      c.x = target;
      c.vx = 0;
    }
    c.ax = (c.vx - vOld) / dt;

    // The claw swings under the carriage like a pendulum.
    const L = Math.max(8, CABLE0 + c.ext);
    const damp = c.ext > 3 && c.phase !== "idle" ? 6 : 1.8;
    c.om += (-(150 / L) * c.th - damp * c.om - (0.22 * c.ax) / L) * dt;
    c.th = clamp(c.th + c.om * dt, -0.3, 0.3);
    if (Math.abs(c.th) < 0.002 && Math.abs(c.om) < 0.01 && Math.abs(c.ax) < 1) {
      c.th = 0;
      c.om = 0;
    }

    c.a = approach(c.a, c.aTarget, c.aRate * dt);

    switch (c.phase) {
      case "idle":
        break;
      case "lower": {
        const max = this.maxExt();
        c.extV = Math.min(LOWER_V, c.extV + 240 * dt);
        c.ext = Math.min(max, c.ext + c.extV * dt);
        this.updateHub();
        let stop = c.ext >= max - 1e-6;
        if (!stop) {
          const lim = (HUB_R + R + 0.15) * (HUB_R + R + 0.15);
          for (const b of this.bodies) {
            if (!b.live || b.held) continue;
            const dx = b.x - c.hx;
            const dy = b.y - c.hy;
            if (dx * dx + dy * dy < lim) {
              stop = true;
              break;
            }
          }
        }
        if (stop) {
          c.extV = 0;
          c.phase = "settle";
          c.t = 0;
          this.emit({ type: "land" });
        }
        break;
      }
      case "settle":
        c.t += dt;
        if (c.t >= 0.2) {
          c.cand = this.pickCandidate();
          c.candOff = c.cand ? Math.abs(c.cand.x - c.hx) : 99;
          if (c.cand) this.planGrip(c.cand);
          c.phase = "close";
          c.t = 0;
          c.aTarget = A_MIN;
          c.aRate = CLOSE_V;
          c.decided = false;
        }
        break;
      case "close": {
        this.updateHub();
        const h = c.held;
        if (h && !c.decided) {
          // Closing round a prize it means to keep: stop when both tips are touching it, under its belly.
          this.prongDist(h, true);
          const lim = R + PR + 0.2;
          if (this.dL <= lim && this.dR <= lim) {
            c.decided = true;
            c.aTarget = c.a;
            c.aRate = 0;
            c.phase = "hold";
            c.t = 0;
            this.emit({ type: "grip", proj: h.proj });
          }
        }
        if (c.phase === "close" && c.a <= A_MIN + 0.005) this.startRise();
        break;
      }
      case "hold":
        c.t += dt;
        if (c.t >= 0.25) this.startRise();
        break;
      case "rise": {
        c.extV = Math.max(-RISE_V, c.extV - 280 * dt);
        c.ext = Math.max(0, c.ext + c.extV * dt);
        this.updateHub();
        if (c.held && c.slipAt >= 0 && c.ext <= c.slipAt) this.doSlip();
        if (c.ext <= 0) {
          c.ext = 0;
          c.extV = 0;
          if (c.held) {
            c.phase = "travel";
            c.t = 0;
          } else {
            c.phase = "reopen";
            c.t = 0;
            c.lockX = c.x;
            c.aTarget = A_IDLE;
            c.aRate = 2.5;
            if (!c.everHeld) this.emit({ type: "miss" });
          }
        }
        break;
      }
      case "travel":
        c.t += dt;
        if ((Math.abs(c.x - CHUTE_X) < 0.7 && Math.abs(c.vx) < 5) || c.t > 5) {
          c.phase = "release";
          c.t = 0;
          c.lockX = c.x;
          c.aTarget = A_OPEN;
          c.aRate = 3.2;
        }
        break;
      case "release": {
        c.t += dt;
        const h = c.held;
        if (h) {
          this.prongDist(h, false);
          const clear = Math.min(this.dL, this.dR) > R + PR - 0.3;
          if (clear || c.a >= A_OPEN - 0.03) {
            h.held = false;
            this.wake(h);
            h.vx = c.vx * 0.4;
            h.vy = 10;
            c.held = null;
            c.t = 0;
            this.emit({ type: "release" });
          }
        } else if (c.t >= 0.3) {
          c.phase = "idle";
          c.aTarget = A_IDLE;
          c.aRate = 2.2;
        }
        break;
      }
      case "reopen":
        c.t += dt;
        if (c.t >= 0.35) c.phase = "idle";
        break;
    }

    this.updateHub();
    const h = c.held;
    if (h) {
      c.relX *= Math.exp(-5 * dt);
      c.relY += (POCKET_Y - c.relY) * Math.min(1, 3 * dt);
      h.x = c.hx + c.relX;
      h.y = c.hy + c.relY;
      h.vx = c.vx;
      h.vy = (c.hy - prevHy) / dt;
      h.w = 0;
      h.a += (c.th - h.a) * Math.min(1, 5 * dt);
    }
  }

  private pickCandidate(): Body | null {
    const c = this.claw;
    let best: Body | null = null;
    let bs = 1e9;
    for (const b of this.bodies) {
      if (!b.live || b.held) continue;
      const dx = Math.abs(b.x - c.hx);
      const dy = b.y - c.hy;
      if (dx < R + 4 && dy > 3 && dy < R + 16) {
        const s = dx + Math.abs(dy - 11.6) * 0.25;
        if (s < bs) {
          bs = s;
          best = b;
        }
      }
    }
    return best;
  }

  /** Fills dL and dR with the distance from the body's centre to the nearest part of each prong. */
  private prongDist(b: Body, tipsOnly: boolean) {
    const c = this.claw;
    const p = this.pp;
    prongPoints(c.hx, c.hy, c.a, -1, p);
    this.dL = tipsOnly
      ? Math.hypot(b.x - p[4], b.y - p[5])
      : Math.min(segDist(b.x, b.y, p[0], p[1], p[2], p[3]), segDist(b.x, b.y, p[2], p[3], p[4], p[5]));
    prongPoints(c.hx, c.hy, c.a, 1, p);
    this.dR = tipsOnly
      ? Math.hypot(b.x - p[4], b.y - p[5])
      : Math.min(segDist(b.x, b.y, p[0], p[1], p[2], p[3]), segDist(b.x, b.y, p[2], p[3], p[4], p[5]));
  }

  /**
   * Decided as the claw settles, from how the prize lies under it: how far off-centre it is (the skill) and how far down
   * the tips can reach below its middle. Most of the time the best-aligned prize is caught.
   */
  private planGrip(b: Body) {
    const c = this.claw;
    const e = c.candOff / R;
    const wrap = 18.5 - (b.y - c.hy);
    let p = 0;
    if (wrap > 0.3 * R) {
      if (e <= 0.45) p = 1;
      else if (e <= 0.95) p = 1 - ((e - 0.45) / 0.5) * 0.85;
    } else if (wrap > -0.1 * R && e <= 0.6) p = 0.4;
    if (this.rng() >= p) return; // the prongs close on it but it is squeezed out
    c.held = b;
    b.held = true;
    this.wake(b);
    c.relX = b.x - c.hx;
    c.relY = b.y - c.hy;
    c.everHeld = true;
    // A firm grip still slips now and then, but never more than one grab in four.
    const slip = p >= 1 && !this.hist.slice(-3).includes(true) && this.rng() < 0.2;
    this.hist.push(slip);
    if (this.hist.length > 6) this.hist.shift();
    c.slipPlan = slip;
  }

  private startRise() {
    const c = this.claw;
    c.phase = "rise";
    c.t = 0;
    c.extV = 0;
    c.slipAt = c.held && c.slipPlan ? c.ext * (0.35 + 0.35 * this.rng()) : -1;
  }

  private doSlip() {
    const c = this.claw;
    const h = c.held;
    if (!h) return;
    h.held = false;
    this.wake(h);
    h.vx = c.vx * 0.5;
    h.vy = 0;
    c.held = null;
    c.slipAt = -1;
    c.a = Math.min(A_OPEN, c.a + 0.55);
    c.aTarget = A_IDLE;
    c.aRate = 2.5;
    this.emit({ type: "slip", proj: h.proj });
  }

  private pushCircle(b: Body, cx: number, cy: number, rad: number, cvx: number, cvy: number) {
    const min = R + rad;
    const dx = b.x - cx;
    const dy = b.y - cy;
    const dd = dx * dx + dy * dy;
    if (dd >= min * min) return;
    const d = Math.sqrt(dd);
    const nx = d > 1e-4 ? dx / d : 0;
    const ny = d > 1e-4 ? dy / d : 1;
    b.x += nx * (min - d);
    b.y += ny * (min - d);
    this.wake(b);
    const vn = (b.vx - cvx) * nx + (b.vy - cvy) * ny;
    if (vn < 0) {
      b.vx -= vn * nx;
      b.vy -= vn * ny;
    }
  }

  private collideClaw() {
    const c = this.claw;
    const p = this.pp;
    for (const b of this.bodies) {
      if (!b.live || b.held) continue;
      this.pushCircle(b, c.hx, c.hy, HUB_R, c.vx, c.extV);
      for (let k = 0; k < 2; k++) {
        prongPoints(c.hx, c.hy, c.a, k === 0 ? -1 : 1, p);
        for (let s = 0; s < 4; s += 2) {
          const ax = p[s];
          const ay = p[s + 1];
          const bx = p[s + 2];
          const by = p[s + 3];
          const abx = bx - ax;
          const aby = by - ay;
          const t = clamp(((b.x - ax) * abx + (b.y - ay) * aby) / (abx * abx + aby * aby || 1), 0, 1);
          this.pushCircle(b, ax + abx * t, ay + aby * t, PR, c.vx, c.extV);
        }
      }
    }
  }

  private pairs() {
    const bs = this.bodies;
    const lim = 4 * R * R;
    for (let i = 0; i < bs.length; i++) {
      const A = bs[i];
      if (!A.live) continue;
      for (let j = i + 1; j < bs.length; j++) {
        const B = bs[j];
        if (!B.live) continue;
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const dd = dx * dx + dy * dy;
        if (dd >= lim) continue;
        const d = Math.sqrt(dd);
        const nx = d > 1e-5 ? dx / d : 0;
        const ny = d > 1e-5 ? dy / d : 1;
        const vn0 = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (vn0 < -5) {
          if (A.asleep) this.wake(A);
          if (B.asleep) this.wake(B);
        }
        const ia = A.held || A.asleep ? 0 : 1;
        const ib = B.held || B.asleep ? 0 : 1;
        const sum = ia + ib;
        if (!sum) continue;
        // Two prizes exactly on top of each other (usually against a wall) would balance for ever: the upper one slips toward the middle.
        if (Math.abs(nx) < 0.1 && d < 2 * R + 0.5) {
          const top = A.y < B.y ? A : B;
          if (!top.held && !top.asleep && !(A.asleep && B.asleep)) top.vx += (top.x < W / 2 ? 1 : -1) * 90 * DT;
        }
        const corr = (Math.max(0, 2 * R - d - 0.02) * 0.8) / sum;
        A.x -= nx * corr * ia;
        A.y -= ny * corr * ia;
        B.x += nx * corr * ib;
        B.y += ny * corr * ib;
        const tx = -ny;
        const ty = nx;
        const rvx = B.vx - B.w * R * tx - (A.vx + A.w * R * tx);
        const rvy = B.vy - B.w * R * ty - (A.vy + A.w * R * ty);
        const vn = rvx * nx + rvy * ny;
        if (vn >= 0) continue;
        const vt = rvx * tx + rvy * ty;
        const e = -vn > 25 ? 0.2 : 0;
        const jn = (-(1 + e) * vn) / sum;
        A.vx -= jn * nx * ia;
        A.vy -= jn * ny * ia;
        B.vx += jn * nx * ib;
        B.vy += jn * ny * ib;
        const jt = clamp(-vt / (3 * sum), -0.2 * jn, 0.2 * jn);
        A.vx -= jt * tx * ia;
        A.vy -= jt * ty * ia;
        B.vx += jt * tx * ib;
        B.vy += jt * ty * ib;
        A.w -= (2 * jt * ia) / R;
        B.w -= (2 * jt * ib) / R;
        if (-vn > 14) this.emit({ type: "hit", speed: -vn, x: (A.x + B.x) / 2 });
      }
    }
  }

  private statics() {
    const fy = this.floorY;
    for (const b of this.bodies) {
      if (!b.live || b.held || b.asleep) continue;
      if (b.x < R) {
        b.x = R;
        b.vx = b.vx < -20 ? -b.vx * 0.25 : Math.max(0, b.vx);
      } else if (b.x > W - R) {
        b.x = W - R;
        b.vx = b.vx > 20 ? -b.vx * 0.25 : Math.min(0, b.vx);
      }
      // The little glass wall between the heap and the chute.
      // (It goes right up past the top of the glass, so a prize flung about during the entrance rain can't fly over it.)
      const cy = clamp(b.y, -80, fy);
      const dx = b.x - LIP_X;
      const dy = b.y - cy;
      const dd = dx * dx + dy * dy;
      const min = R + LIP_R;
      if (dd < min * min) {
        const d = Math.sqrt(dd) || 1e-4;
        const nx = dx / d;
        const ny = dy / d;
        b.x += nx * (min - d);
        b.y += ny * (min - d);
        const vn = b.vx * nx + b.vy * ny;
        if (vn < 0) {
          b.vx -= vn * nx;
          b.vy -= vn * ny;
        }
      }
      if (b.x > HOLE_END && b.y + R > fy) {
        b.y = fy - R;
        if (b.vy > 0) {
          const vy0 = b.vy;
          const e = vy0 > 30 ? 0.22 : 0;
          b.vy = -vy0 * e;
          const jn = vy0 * (1 + e);
          const vt = b.vx - b.w * R;
          const jmax = 0.4 * Math.max(jn, G * DT * 1.2);
          const jt = clamp(-vt / 3, -jmax, jmax);
          b.vx += jt;
          b.w -= (2 * jt) / R;
          if (vy0 > 22) this.emit({ type: "hit", speed: vy0, x: b.x });
        }
      }
    }
  }

  private settleAndWin(dt: number) {
    const c = this.claw;
    for (const b of this.bodies) {
      if (!b.live || b.held) continue;
      if (!Number.isFinite(b.x + b.y + b.vx + b.vy)) {
        b.live = false;
        b.wait = 0.3;
        continue;
      }
      if (b.y - R > this.hu + 3) {
        b.live = false;
        b.wait = 1.5 + this.rng() * 0.4;
        b.asleep = false;
        if (c.held === b) c.held = null;
        this.emit({ type: "win", proj: b.proj });
        continue;
      }
      if (b.asleep) continue;
      // A prize wedged against the wall and a neighbour keeps a phantom velocity the solver never uses up: what it has really moved is the truth.
      const ex = (b.x - b.px) / dt;
      const ey = (b.y - b.py) / dt;
      const sp2 = Math.min(b.vx * b.vx + b.vy * b.vy, ex * ex + ey * ey);
      if (sp2 < 100) {
        // Slow: the box rights itself to a gentle tilt (only the drawing, so the rolling physics stays honest).
        const half = Math.PI / 2;
        const goal = Math.round((b.a - b.tilt) / half) * half + b.tilt;
        b.a += (goal - b.a) * Math.min(1, 14 * dt);
        b.w *= Math.max(0, 1 - 6 * dt);
      }
      if (sp2 < 64 && Math.abs(b.w) < 1.5 && b.x > HOLE_END) {
        b.sleepT += dt;
        b.calm += dt;
        if (b.sleepT > 0.45 || b.calm > 2.2) {
          b.asleep = true;
          b.vx = 0;
          b.vy = 0;
          b.w = 0;
        }
      } else {
        b.sleepT = 0;
        b.calm = 0;
      }
    }
  }
}
