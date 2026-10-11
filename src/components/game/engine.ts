// "Break the Grid": a breakout game with power-ups, explosive and moving bricks, and hidden project bricks.
// Pure logic and drawing, no React. Coordinates are logical (the stage is scaled to fit), so physics is identical on every screen.

import type { GameSound } from "@/utils/ambient";

export type Status = "ready" | "playing" | "clear" | "won" | "lost";
export type Sound = GameSound;
type Power = "wide" | "multi" | "slow" | "fire" | "laser" | "life";

export interface GameState {
  score: number;
  best: number;
  lives: number;
  level: number;
  levels: number;
  levelName: string;
  status: Status;
  combo: number;
  mult: number;
  /** Slugs of the project bricks broken so far. */
  found: string[];
}

/** Brick, capsule and paddle colours. The page sets these from the site theme (see BreakGame). */
export interface Palette {
  a: string;
  b: string;
  c: string;
  d: string;
  ink: string;
  /** Canvas text, set to the site's own font by the page. */
  font: string;
}
const palette: Palette = { a: "#2D3BFF", b: "#FF4D1F", c: "#FFD84D", d: "#EEE9DD", ink: "#0E0F1A", font: "ui-sans-serif, system-ui, sans-serif" };
export const setPalette = (p: Partial<Palette>) => Object.assign(palette, p);
type ColorKey = "a" | "b" | "c" | "d";

// a-d are colours, an uppercase letter is a tough brick (two hits), x explodes and takes its neighbours with it,
// g is a project brick (break it to uncover one of the work), "." is empty.
const font: Record<string, string[]> = {
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  E: ["###", "#..", "##.", "#..", "###"],
  M: ["#.#", "###", "###", "#.#", "#.#"],
};

function word(letters: string, colors: ColorKey[], cols: number): string[] {
  const rows = Array.from({ length: 5 }, () => Array(cols).fill("."));
  const width = letters.length * 3 + (letters.length - 1);
  const start = Math.floor((cols - width) / 2);
  [...letters].forEach((ch, li) => {
    font[ch].forEach((line, r) => {
      [...line].forEach((cell, c) => {
        if (cell === "#") rows[r][start + li * 4 + c] = colors[li];
      });
    });
  });
  return rows.map((r) => r.join(""));
}

interface Level {
  name: string;
  rows: string[];
  /** Per row: how far (in logical units) the row swings side to side. Negative swings the other way round. */
  drift?: number[];
}

export const LEVELS: Level[] = [
  { name: "Warm up", rows: ["aaaaaaaaaaaa", "bbbbbgbbbbbb", "cccccccccccc", "dddddddddddd"] },
  { name: "Checkmate", rows: ["AbAbAbAbAbAb", "bAbAbgbAbAbA", "cdcdcdcdcdcd", "dcdcdcdcdcdc"] },
  { name: "Boom", rows: ["aaaaaaaaaaaa", "bbxbbbbbbxbb", "cccccgxccccc", "dbxddddddxdb", "aaaaaaaaaaaa"] },
  { name: "Drift", rows: ["aaaaaaaaaa", "bbbbgbbbbb", "cccccccccc", "dddddddddd", "AAAAAAAAAA"], drift: [28, -28, 28, -28, 0] },
  {
    name: "Invader",
    rows: [
      "...b....b...",
      "....b..b....",
      "...bbgbbb...",
      "..bb.bb.bb..",
      "..aaaaaaaa..",
      "..aAaaaaAa..",
      "..cAcxxcAc..",
      "....cc.cc...",
    ],
  },
  { name: "Hire me", rows: [...word("HIRE", ["a", "b", "c", "d"], 15), "...............", ...word("ME", ["a", "b"], 15)] },
];

interface Brick {
  x: number;
  x0: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  max: number;
  color: ColorKey;
  kind: "plain" | "boom" | "gold";
  flash: number;
  amp: number;
  phase: number;
}
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stuck: boolean;
  trail: { x: number; y: number }[];
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}
interface Pop {
  x: number;
  y: number;
  text: string;
  life: number;
  big: boolean;
}
interface Capsule {
  x: number;
  y: number;
  kind: Power;
}
interface Ring {
  x: number;
  y: number;
  r: number;
  to: number;
  life: number;
  color: string;
}
interface Bolt {
  x: number;
  y: number;
}

const POWER_TIME: Record<"wide" | "slow" | "fire" | "laser", number> = { wide: 11, slow: 9, fire: 7, laser: 8 };
const POWER_LABEL: Record<Power, string> = { wide: "W", multi: "x3", slow: "S", fire: "F", laser: "L", life: "+1" };
const POWER_WEIGHT: [Power, number][] = [
  ["wide", 3],
  ["multi", 3],
  ["slow", 2],
  ["fire", 2],
  ["laser", 2],
  ["life", 0.7],
];
const FIRE = "#FF8A2B";
const MAX_LIVES = 5;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export class Game {
  readonly w: number;
  readonly h: number;
  private onState: (s: GameState) => void;
  private onSound: (s: Sound, pan: number, n: number) => void;
  private projectList: { slug: string; title: string }[];

  private bricks: Brick[] = [];
  private balls: Ball[] = [];
  private particles: Particle[] = [];
  private pops: Pop[] = [];
  private capsules: Capsule[] = [];
  private rings: Ring[] = [];
  private bolts: Bolt[] = [];

  private paddle = { x: 0, target: 0, w: 120, h: 14, y: 0, squash: 0 };
  private baseW: number;
  private fx = { wide: 0, slow: 0, fire: 0, laser: 0 };
  private laserCool = 0;
  private keys = { left: false, right: false };

  private state: GameState;
  private speedScale: number;
  private shake = 0;
  private flashScreen = 0;
  private clearTimer = 0;
  private time = 0;
  private nextProject = 0;
  paused = false;

  constructor(opts: {
    w: number;
    h: number;
    best: number;
    projects: { slug: string; title: string }[];
    onState: (s: GameState) => void;
    onSound: (s: Sound, pan: number, n: number) => void;
  }) {
    this.w = opts.w;
    this.h = opts.h;
    this.onState = opts.onState;
    this.onSound = opts.onSound;
    this.projectList = opts.projects;
    this.speedScale = opts.h / 600;
    this.baseW = clamp(opts.w * 0.14, 84, 140);
    this.paddle.w = this.baseW;
    this.paddle.y = opts.h - 46;
    this.paddle.x = this.paddle.target = opts.w / 2;
    this.state = { score: 0, best: opts.best, lives: 3, level: 1, levels: LEVELS.length, levelName: LEVELS[0].name, status: "ready", combo: 0, mult: 1, found: [] };
    this.buildLevel();
    this.resetBall();
    this.emit();
  }

  // ---- control ------------------------------------------------------------
  setPointer(x: number) {
    this.paddle.target = x;
  }
  setKeys(left: boolean, right: boolean) {
    this.keys = { left, right };
  }
  launch() {
    if (this.state.status !== "ready") return;
    const b = this.balls[0];
    if (!b?.stuck) return;
    const speed = this.baseSpeed();
    // Aim with where the paddle is: the further from the middle, the more the ball leans that way.
    const lean = clamp((this.paddle.x / this.w - 0.5) * 0.9, -0.4, 0.4);
    const a = lean + (Math.random() - 0.5) * 0.25;
    b.stuck = false;
    b.vx = Math.sin(a) * speed;
    b.vy = -Math.cos(a) * speed;
    this.state.status = "playing";
    this.onSound("launch", 0, 0);
    this.emit();
  }
  restart() {
    this.state = { ...this.state, score: 0, lives: 3, level: 1, levelName: LEVELS[0].name, status: "ready", combo: 0, mult: 1, found: [] };
    this.clearEffects();
    this.nextProject = 0;
    this.buildLevel();
    this.resetBall();
    this.emit();
  }

  // ---- setup --------------------------------------------------------------
  private baseSpeed() {
    return (400 + (this.state.level - 1) * 45) * this.speedScale;
  }

  private clearEffects() {
    this.fx = { wide: 0, slow: 0, fire: 0, laser: 0 };
    this.paddle.w = this.baseW;
    this.capsules = [];
    this.bolts = [];
  }

  private buildLevel() {
    const level = LEVELS[this.state.level - 1];
    const rows = level.rows;
    const cols = rows[0].length;
    const side = this.w * 0.05;
    const gap = 6;
    const bw = (this.w - side * 2 - gap * (cols - 1)) / cols;
    const top = 64;
    // Tall levels squeeze their rows so the wall never reaches down to the paddle on a wide, short board.
    const bh = Math.min(26, bw * 0.5, (this.h * 0.5 - gap * (rows.length - 1)) / rows.length);
    this.bricks = [];
    rows.forEach((row, r) => {
      const amp = level.drift?.[r] ?? 0;
      [...row].forEach((ch, c) => {
        if (ch === ".") return;
        const lower = ch.toLowerCase();
        const tough = ch !== lower && ch !== "X" && ch !== "G";
        const kind = lower === "x" ? "boom" : lower === "g" ? "gold" : "plain";
        const x = side + c * (bw + gap);
        this.bricks.push({
          x,
          x0: x,
          y: top + r * (bh + gap),
          w: bw,
          h: bh,
          hp: tough ? 2 : 1,
          max: tough ? 2 : 1,
          color: kind === "plain" ? (lower as ColorKey) : kind === "boom" ? "b" : "c",
          kind,
          flash: 0,
          amp: Math.min(Math.abs(amp), side - 3),
          phase: amp < 0 ? Math.PI : 0,
        });
      });
    });
  }

  private resetBall() {
    this.balls = [{ x: this.paddle.x, y: this.paddle.y - this.paddle.h / 2 - 8, vx: 0, vy: 0, stuck: true, trail: [] }];
  }

  private emit() {
    this.onState({ ...this.state, found: [...this.state.found] });
  }

  private pan(x: number) {
    return clamp((x / this.w) * 2 - 1, -1, 1);
  }

  // ---- simulation ---------------------------------------------------------
  update(rawDt: number) {
    if (this.paused) return;
    const dt = Math.min(rawDt, 1 / 30);
    this.time += dt;
    const p = this.paddle;

    // Paddle: pointer or keys, eased so it feels weighty but never laggy.
    if (this.keys.left) p.target -= 720 * dt;
    if (this.keys.right) p.target += 720 * dt;
    p.target = clamp(p.target, p.w / 2, this.w - p.w / 2);
    p.x += (p.target - p.x) * (1 - Math.exp(-dt * 32));
    p.x = clamp(p.x, p.w / 2, this.w - p.w / 2);
    p.squash = Math.max(0, p.squash - dt * 5);

    for (const k of ["wide", "slow", "fire", "laser"] as const) {
      if (this.fx[k] <= 0) continue;
      this.fx[k] -= dt;
      if (this.fx[k] <= 0 && k === "wide") p.w = this.baseW;
    }

    this.shake = Math.max(0, this.shake - dt * 30);
    this.flashScreen = Math.max(0, this.flashScreen - dt * 2.2);
    for (const b of this.bricks) {
      b.flash = Math.max(0, b.flash - dt * 6);
      if (b.amp) b.x = b.x0 + Math.sin(this.time * 1.3 + b.phase) * b.amp;
    }

    if (this.state.status === "clear") {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) this.nextLevel();
    }

    // The ball moves slower in "slow" time, so there is more time to place the paddle.
    const ballDt = dt * (this.fx.slow > 0 ? 0.62 : 1);
    for (const ball of this.balls) {
      if (ball.stuck) {
        ball.x = p.x;
        ball.y = p.y - p.h / 2 - 8;
        continue;
      }
      // Substeps so a fast ball can never tunnel through a brick.
      const speed = Math.hypot(ball.vx, ball.vy);
      const steps = Math.max(1, Math.ceil((speed * ballDt) / 5));
      for (let i = 0; i < steps; i++) this.stepBall(ball, ballDt / steps);
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > (this.fx.fire > 0 ? 22 : 14)) ball.trail.shift();
    }
    this.balls = this.balls.filter((b) => b.stuck || b.y < this.h + 40);
    if (this.balls.length === 0 && this.state.status === "playing") this.loseLife();

    // Lasers fire by themselves while the power-up lasts.
    if (this.fx.laser > 0 && this.state.status === "playing") {
      this.laserCool -= dt;
      if (this.laserCool <= 0) {
        this.laserCool = 0.34;
        this.bolts.push({ x: p.x - p.w / 2 + 6, y: p.y - 10 }, { x: p.x + p.w / 2 - 6, y: p.y - 10 });
        this.onSound("laser", this.pan(p.x), 0);
      }
    }
    for (const bolt of this.bolts) bolt.y -= 820 * this.speedScale * dt;
    this.bolts = this.bolts.filter((bolt) => {
      if (bolt.y < -20) return false;
      const hit = this.bricks.find((b) => b.hp > 0 && bolt.x >= b.x && bolt.x <= b.x + b.w && bolt.y <= b.y + b.h && bolt.y >= b.y - 14);
      if (!hit) return true;
      this.hitBrick(hit);
      return false;
    });

    // Capsules fall; the paddle catches them.
    for (const c of this.capsules) c.y += 150 * this.speedScale * dt;
    this.capsules = this.capsules.filter((c) => {
      const caught = Math.abs(c.x - p.x) < p.w / 2 + 12 && Math.abs(c.y - p.y) < p.h / 2 + 12;
      if (caught) {
        this.collect(c.kind);
        return false;
      }
      return c.y < this.h + 30;
    });

    for (const q of this.particles) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 900 * dt;
      q.life -= dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    for (const pop of this.pops) {
      pop.y -= 34 * dt;
      pop.life -= dt;
    }
    this.pops = this.pops.filter((q) => q.life > 0);
    for (const r of this.rings) {
      r.r += (r.to - r.r) * (1 - Math.exp(-dt * 9));
      r.life -= dt;
    }
    this.rings = this.rings.filter((r) => r.life > 0);
  }

  private stepBall(ball: Ball, dt: number) {
    const r = 7;
    const p = this.paddle;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    const wall = (px: number, py: number) => {
      this.onSound("wall", this.pan(px), 0);
      this.sparks(px, py, palette.d, 4);
    };
    if (ball.x < r) {
      ball.x = r;
      ball.vx = Math.abs(ball.vx);
      wall(0, ball.y);
    } else if (ball.x > this.w - r) {
      ball.x = this.w - r;
      ball.vx = -Math.abs(ball.vx);
      wall(this.w, ball.y);
    }
    if (ball.y < r) {
      ball.y = r;
      ball.vy = Math.abs(ball.vy);
      wall(ball.x, 0);
    }

    // Paddle
    if (ball.vy > 0 && ball.y + r >= p.y - p.h / 2 && ball.y - r <= p.y + p.h / 2 && Math.abs(ball.x - p.x) <= p.w / 2 + r) {
      const offset = clamp((ball.x - p.x) / (p.w / 2), -1, 1);
      const ang = offset * 1.05;
      const speed = Math.min(820 * this.speedScale, Math.hypot(ball.vx, ball.vy) * 1.02);
      ball.vx = Math.sin(ang) * speed;
      ball.vy = -Math.cos(ang) * speed;
      ball.y = p.y - p.h / 2 - r - 0.1;
      p.squash = 1;
      this.state.combo = 0;
      this.state.mult = 1;
      this.rings.push({ x: ball.x, y: p.y - p.h / 2, r: 4, to: 34, life: 0.4, color: palette.d });
      this.sparks(ball.x, p.y - p.h / 2, palette.d, 6);
      this.emit();
      this.onSound("paddle", this.pan(ball.x), 0);
    }

    // Bricks: the first one touched this step bounces the ball; a fireball goes straight through them all.
    const fire = this.fx.fire > 0;
    for (const b of this.bricks) {
      if (b.hp <= 0) continue;
      const nx = clamp(ball.x, b.x, b.x + b.w);
      const ny = clamp(ball.y, b.y, b.y + b.h);
      const dx = ball.x - nx;
      const dy = ball.y - ny;
      if (dx * dx + dy * dy >= r * r) continue;

      if (fire) {
        b.hp = 1;
        this.hitBrick(b);
        continue;
      }
      if (dx === 0 && dy === 0) ball.vy = -ball.vy;
      else if (Math.abs(dx) > Math.abs(dy)) {
        ball.vx = dx > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
        ball.x = nx + Math.sign(dx) * r;
      } else {
        ball.vy = dy > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
        ball.y = ny + Math.sign(dy) * r;
      }
      this.hitBrick(b);
      break;
    }
  }

  private hitBrick(b: Brick) {
    if (b.hp <= 0) return;
    b.hp -= 1;
    b.flash = 1;
    const cx = b.x + b.w / 2;
    if (b.hp > 0) {
      this.onSound("tough", this.pan(cx), 0);
      this.shake = Math.max(this.shake, 1.5);
      this.sparks(cx, b.y + b.h / 2, palette.ink, 5);
      return;
    }
    this.state.combo += 1;
    const mult = Math.min(5, 1 + Math.floor((this.state.combo - 1) / 2));
    this.state.mult = mult;
    const gain = 10 * mult * b.max;
    this.state.score += gain;
    this.pops.push({ x: cx, y: b.y, text: mult > 1 ? `+${gain}  x${mult}` : `+${gain}`, life: 0.8, big: false });
    this.burst(b);
    this.shake = Math.max(this.shake, 3 + mult * 0.6);

    if (b.kind === "boom") {
      this.onSound("boom", this.pan(cx), 0);
      this.shake = 11;
      this.rings.push({ x: cx, y: b.y + b.h / 2, r: 6, to: b.w * 2.6, life: 0.5, color: palette.b });
      const reach = (b.w + 6) * 1.75;
      for (const o of this.bricks) {
        if (o.hp <= 0 || o === b) continue;
        if (Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - (b.y + b.h / 2)) <= reach) {
          o.hp = 1;
          this.hitBrick(o);
        }
      }
    } else if (b.kind === "gold") {
      this.onSound("gold", this.pan(cx), 0);
      const pr = this.projectList[this.nextProject % Math.max(1, this.projectList.length)];
      this.nextProject += 1;
      if (pr) {
        if (!this.state.found.includes(pr.slug)) this.state.found.push(pr.slug);
        this.pops.push({ x: cx, y: b.y - 6, text: pr.title, life: 1.8, big: true });
      }
      this.state.score += 50;
      this.rings.push({ x: cx, y: b.y + b.h / 2, r: 4, to: 70, life: 0.6, color: palette.c });
      this.capsules.push({ x: cx, y: b.y + b.h / 2, kind: this.pickPower(true) });
    } else {
      // The streak climbs a little scale: each brick in a row is a higher note.
      this.onSound("brick", this.pan(cx), this.state.combo - 1);
      if (Math.random() < 0.16) this.capsules.push({ x: cx, y: b.y + b.h / 2, kind: this.pickPower(false) });
    }

    if (this.state.score > this.state.best) this.state.best = this.state.score;
    this.emit();
    if (this.state.status === "playing" && this.bricks.every((k) => k.hp <= 0)) {
      this.state.status = "clear";
      this.state.score += 100;
      this.clearTimer = 1.6;
      this.flashScreen = 1;
      this.bolts = [];
      this.rings.push({ x: this.w / 2, y: this.h / 2, r: 10, to: this.w * 0.7, life: 0.9, color: palette.c });
      this.onSound(this.state.level >= LEVELS.length ? "won" : "clear", 0, 0);
      this.emit();
    }
  }

  private pickPower(guaranteedGood: boolean): Power {
    const pool = guaranteedGood ? POWER_WEIGHT.filter(([k]) => k !== "life" || this.state.lives < MAX_LIVES) : POWER_WEIGHT.filter(([k]) => k !== "life" || this.state.lives < 3);
    const total = pool.reduce((s, [, w]) => s + w, 0);
    let t = Math.random() * total;
    for (const [k, w] of pool) {
      t -= w;
      if (t <= 0) return k;
    }
    return "wide";
  }

  private sparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({ x, y, vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220, life: 0.25 + Math.random() * 0.25, max: 0.5, size: 2 + Math.random() * 2, color });
    }
  }

  private burst(b: Brick) {
    const color = palette[b.color];
    for (let i = 0; i < (b.kind === "plain" ? 12 : 22); i++) {
      this.particles.push({
        x: b.x + Math.random() * b.w,
        y: b.y + Math.random() * b.h,
        vx: (Math.random() - 0.5) * (b.kind === "boom" ? 640 : 360),
        vy: -Math.random() * 280 - 40,
        life: 0.55 + Math.random() * 0.4,
        max: 0.95,
        size: 3 + Math.random() * 4,
        color,
      });
    }
  }

  private collect(kind: Power) {
    this.onSound(kind === "life" ? "life" : "power", this.pan(this.paddle.x), 0);
    this.rings.push({ x: this.paddle.x, y: this.paddle.y, r: 6, to: this.paddle.w * 0.9, life: 0.45, color: palette.c });
    if (kind === "life") {
      this.state.lives = Math.min(MAX_LIVES, this.state.lives + 1);
      this.pops.push({ x: this.paddle.x, y: this.paddle.y - 24, text: "Extra life", life: 1.1, big: false });
      this.emit();
    } else if (kind === "multi") {
      const src = this.balls.find((b) => !b.stuck);
      if (src) {
        const speed = Math.hypot(src.vx, src.vy);
        const base = Math.atan2(src.vx, -src.vy);
        for (const da of [-0.5, 0.5]) {
          this.balls.push({ x: src.x, y: src.y, vx: Math.sin(base + da) * speed, vy: -Math.cos(base + da) * speed, stuck: false, trail: [] });
        }
      }
    } else {
      this.fx[kind] = POWER_TIME[kind];
      if (kind === "wide") this.paddle.w = this.baseW * 1.55;
      if (kind === "laser") this.laserCool = 0;
    }
  }

  private loseLife() {
    this.state.lives -= 1;
    this.state.combo = 0;
    this.state.mult = 1;
    this.shake = 8;
    this.clearEffects();
    if (this.state.lives <= 0) {
      this.state.status = "lost";
      this.onSound("over", 0, 0);
      this.emit();
      return;
    }
    this.onSound("lose", 0, 0);
    this.state.status = "ready";
    this.resetBall();
    this.emit();
  }

  private nextLevel() {
    if (this.state.level >= LEVELS.length) {
      this.state.status = "won";
      this.emit();
      return;
    }
    this.state.level += 1;
    this.state.levelName = LEVELS[this.state.level - 1].name;
    this.state.status = "ready";
    this.clearEffects();
    this.buildLevel();
    this.resetBall();
    this.emit();
  }

  // ---- drawing ------------------------------------------------------------
  draw(ctx: CanvasRenderingContext2D) {
    const { w, h } = this;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    if (this.shake > 0.05) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);

    // dot grid that gives a little where the ball is
    ctx.fillStyle = palette.d;
    const lead = this.balls.find((b) => !b.stuck) ?? this.balls[0];
    for (let x = 12; x < w; x += 24) {
      for (let y = 12; y < h; y += 24) {
        const near = lead ? Math.max(0, 1 - Math.hypot(x - lead.x, y - lead.y) / 90) : 0;
        ctx.globalAlpha = 0.07 + near * 0.3;
        const s = 1.5 + near * 2;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;

    // A big streak counter, fading in once the combo gets going.
    if (this.state.mult >= 2 && this.state.status === "playing") {
      ctx.globalAlpha = 0.1 + this.state.mult * 0.03;
      ctx.fillStyle = palette.c;
      ctx.font = `700 ${h * 0.34}px ${palette.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`x${this.state.mult}`, w / 2, h * 0.58);
      ctx.globalAlpha = 1;
    }

    for (const b of this.bricks) {
      if (b.hp <= 0) continue;
      const col = palette[b.color];
      const tough = b.max === 2 && b.hp === 2;
      ctx.fillStyle = col;
      ctx.globalAlpha = tough ? 0.78 : 1;
      rr(ctx, b.x, b.y, b.w, b.h, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (tough) {
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 2;
        rr(ctx, b.x + 3, b.y + 3, b.w - 6, b.h - 6, 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (b.kind === "boom") {
        // A little bomb: ink disc with a lit fuse.
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        ctx.fillStyle = palette.ink;
        ctx.beginPath();
        ctx.arc(cx, cy + 1, Math.min(b.h * 0.3, 7), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = palette.c;
        ctx.globalAlpha = 0.6 + Math.sin(this.time * 9) * 0.4;
        ctx.fillRect(cx + 3, cy - b.h * 0.34, 2.5, 2.5);
        ctx.globalAlpha = 1;
      } else if (b.kind === "gold") {
        // A moving glint says "something is inside".
        const t = (this.time * 0.7 + b.x0 * 0.01) % 1.6;
        ctx.save();
        rr(ctx, b.x, b.y, b.w, b.h, 4);
        ctx.clip();
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.transform(1, 0, -0.5, 1, 0, 0);
        ctx.fillRect(b.x + (t - 0.3) * b.w * 1.4 + b.h * 0.25, b.y, b.w * 0.18, b.h);
        ctx.restore();
        ctx.fillStyle = palette.ink;
        ctx.font = `700 ${Math.min(13, b.h * 0.6)}px ${palette.font}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("★", b.x + b.w / 2, b.y + b.h / 2 + 1);
      }
      if (b.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${b.flash * 0.7})`;
        rr(ctx, b.x, b.y, b.w, b.h, 4);
        ctx.fill();
      }
    }

    for (const r of this.rings) {
      ctx.globalAlpha = Math.max(0, r.life * 1.6);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const q of this.particles) {
      ctx.globalAlpha = Math.max(0, q.life / q.max);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, q.size, q.size);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = palette.c;
    for (const bolt of this.bolts) {
      rr(ctx, bolt.x - 1.5, bolt.y - 12, 3, 14, 1.5);
      ctx.fill();
    }

    for (const c of this.capsules) {
      const col = this.capsuleColor(c.kind);
      ctx.fillStyle = col;
      rr(ctx, c.x - 18, c.y - 10, 36, 20, 10);
      ctx.fill();
      ctx.fillStyle = c.kind === "multi" || c.kind === "slow" || c.kind === "life" ? "#fff" : palette.ink;
      ctx.font = `700 11px ${palette.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(POWER_LABEL[c.kind], c.x, c.y + 1);
    }

    const fire = this.fx.fire > 0;
    for (const ball of this.balls) {
      const glow = fire ? FIRE : this.state.mult >= 3 ? palette.c : palette.d;
      ball.trail.forEach((t, i) => {
        ctx.globalAlpha = (i / ball.trail.length) * (fire ? 0.6 : 0.35);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 7 * (i / ball.trail.length), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = fire || this.state.mult >= 3 ? 0.28 : 0;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = fire ? FIRE : "#FFFFFF";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // A dotted guide shows where a launched ball will head.
    const stuck = this.balls.find((b) => b.stuck);
    if (stuck && this.state.status === "ready") {
      const lean = clamp((this.paddle.x / this.w - 0.5) * 0.9, -0.4, 0.4);
      ctx.fillStyle = palette.d;
      for (let i = 1; i <= 7; i++) {
        ctx.globalAlpha = 0.5 - i * 0.06;
        ctx.beginPath();
        ctx.arc(stuck.x + Math.sin(lean) * i * 26, stuck.y - Math.cos(lean) * i * 26 - 10, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Paddle squashes a little on every hit
    const p = this.paddle;
    const sq = p.squash * 0.18;
    const pw = p.w * (1 + sq);
    const ph = p.h * (1 - sq);
    ctx.fillStyle = palette.d;
    rr(ctx, p.x - pw / 2, p.y - ph / 2, pw, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = this.fx.laser > 0 ? palette.c : this.fx.wide > 0 ? palette.c : palette.b;
    ctx.beginPath();
    ctx.arc(p.x - pw / 2 + ph / 2, p.y, 3, 0, Math.PI * 2);
    ctx.arc(p.x + pw / 2 - ph / 2, p.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `600 13px ${palette.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (const pop of this.pops) {
      ctx.globalAlpha = Math.min(1, pop.life * 2);
      ctx.fillStyle = palette.c;
      if (pop.big) {
        ctx.font = `700 22px ${palette.font}`;
        ctx.fillText(pop.text, clamp(pop.x, 60, w - 60), pop.y);
        ctx.font = `600 13px ${palette.font}`;
      } else ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.globalAlpha = 1;

    // Active power-ups, as small timers in the corner.
    let i = 0;
    for (const k of ["wide", "slow", "fire", "laser"] as const) {
      if (this.fx[k] <= 0) continue;
      const x = 16 + i * 84;
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      rr(ctx, x, 16, 76, 24, 12);
      ctx.fill();
      ctx.fillStyle = this.capsuleColor(k);
      rr(ctx, x, 16, Math.max(24, 76 * (this.fx[k] / POWER_TIME[k])), 24, 12);
      ctx.fill();
      ctx.fillStyle = k === "slow" ? "#fff" : palette.ink;
      ctx.font = `700 11px ${palette.font}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${POWER_LABEL[k]}  ${Math.ceil(this.fx[k])}s`, x + 10, 29);
      i++;
    }

    if (this.flashScreen > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashScreen * 0.25})`;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  private capsuleColor(kind: Power) {
    return kind === "wide" ? palette.c : kind === "multi" ? palette.b : kind === "slow" ? palette.a : kind === "fire" ? FIRE : kind === "laser" ? palette.d : palette.b;
  }
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
