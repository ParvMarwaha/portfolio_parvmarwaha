// "Break the Grid": a small breakout game. Pure logic and drawing, no React.
// Coordinates are logical (the stage is scaled to fit), so physics is identical on every screen.

export type Status = "ready" | "playing" | "clear" | "won" | "lost";
export type Sound = "paddle" | "brick" | "tough" | "wall" | "power" | "lose" | "clear";

export interface GameState {
  score: number;
  best: number;
  lives: number;
  level: number;
  levels: number;
  status: Status;
  combo: number;
  wide: boolean;
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

// a-d are colours, an uppercase letter is a tough brick (two hits), "." is empty.
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

export const LEVELS: string[][] = [
  ["aaaaaaaaaaaa", "bbbbbbbbbbbb", "cccccccccccc", "dddddddddddd"],
  ["AAAAAAAAAAAA", "b.b.b.b.b.b.", ".c.c.c.c.c.c", "d.d.d.d.d.d.", "BBBBBBBBBBBB"],
  [...word("HIRE", ["a", "b", "c", "d"], 15), "...............", ...word("ME", ["a", "b"], 15)],
];

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  max: number;
  color: ColorKey;
  flash: number;
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
}
interface Capsule {
  x: number;
  y: number;
  kind: "wide" | "multi";
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export class Game {
  readonly w: number;
  readonly h: number;
  private onState: (s: GameState) => void;
  private onSound: (s: Sound) => void;

  private bricks: Brick[] = [];
  private balls: Ball[] = [];
  private particles: Particle[] = [];
  private pops: Pop[] = [];
  private capsules: Capsule[] = [];

  private paddle = { x: 0, target: 0, w: 120, h: 14, y: 0, squash: 0 };
  private baseW: number;
  private wideTimer = 0;
  private keys = { left: false, right: false };

  private state: GameState;
  private speedScale: number;
  private shake = 0;
  private clearTimer = 0;
  private time = 0;
  paused = false;

  constructor(opts: { w: number; h: number; best: number; onState: (s: GameState) => void; onSound: (s: Sound) => void }) {
    this.w = opts.w;
    this.h = opts.h;
    this.onState = opts.onState;
    this.onSound = opts.onSound;
    this.speedScale = opts.h / 600;
    this.baseW = clamp(opts.w * 0.14, 84, 140);
    this.paddle.w = this.baseW;
    this.paddle.y = opts.h - 46;
    this.paddle.x = this.paddle.target = opts.w / 2;
    this.state = { score: 0, best: opts.best, lives: 3, level: 1, levels: LEVELS.length, status: "ready", combo: 0, wide: false };
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
    const a = (Math.random() - 0.5) * 0.6;
    b.stuck = false;
    b.vx = Math.sin(a) * speed;
    b.vy = -Math.cos(a) * speed;
    this.state.status = "playing";
    this.emit();
  }
  restart() {
    this.state = { ...this.state, score: 0, lives: 3, level: 1, status: "ready", combo: 0, wide: false };
    this.wideTimer = 0;
    this.paddle.w = this.baseW;
    this.capsules = [];
    this.buildLevel();
    this.resetBall();
    this.emit();
  }

  // ---- setup --------------------------------------------------------------
  private baseSpeed() {
    return (400 + (this.state.level - 1) * 40) * this.speedScale;
  }

  private buildLevel() {
    const rows = LEVELS[this.state.level - 1];
    const cols = rows[0].length;
    const side = this.w * 0.05;
    const gap = 6;
    const bw = (this.w - side * 2 - gap * (cols - 1)) / cols;
    const bh = Math.min(26, bw * 0.5);
    const top = 96;
    this.bricks = [];
    rows.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === ".") return;
        const lower = ch.toLowerCase() as ColorKey;
        const tough = ch !== lower;
        this.bricks.push({
          x: side + c * (bw + gap),
          y: top + r * (bh + gap),
          w: bw,
          h: bh,
          hp: tough ? 2 : 1,
          max: tough ? 2 : 1,
          color: lower,
          flash: 0,
        });
      });
    });
  }

  private resetBall() {
    this.balls = [{ x: this.paddle.x, y: this.paddle.y - this.paddle.h / 2 - 8, vx: 0, vy: 0, stuck: true, trail: [] }];
  }

  private emit() {
    this.onState({ ...this.state });
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

    if (this.wideTimer > 0) {
      this.wideTimer -= dt;
      if (this.wideTimer <= 0) this.setWide(false);
    }

    this.shake = Math.max(0, this.shake - dt * 30);
    for (const b of this.bricks) b.flash = Math.max(0, b.flash - dt * 6);

    if (this.state.status === "clear") {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) this.nextLevel();
    }

    for (const ball of this.balls) {
      if (ball.stuck) {
        ball.x = p.x;
        ball.y = p.y - p.h / 2 - 8;
        continue;
      }
      // Substeps so a fast ball can never tunnel through a brick.
      const speed = Math.hypot(ball.vx, ball.vy);
      const steps = Math.max(1, Math.ceil((speed * dt) / 5));
      for (let i = 0; i < steps; i++) this.stepBall(ball, dt / steps);
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 14) ball.trail.shift();
    }
    this.balls = this.balls.filter((b) => b.stuck || b.y < this.h + 40);
    if (this.balls.length === 0 && this.state.status === "playing") this.loseLife();

    // Capsules fall; the paddle catches them.
    for (const c of this.capsules) c.y += 150 * this.speedScale * dt;
    this.capsules = this.capsules.filter((c) => {
      const caught = Math.abs(c.x - p.x) < p.w / 2 + 10 && Math.abs(c.y - p.y) < p.h / 2 + 12;
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
  }

  private stepBall(ball: Ball, dt: number) {
    const r = 7;
    const p = this.paddle;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x < r) {
      ball.x = r;
      ball.vx = Math.abs(ball.vx);
      this.onSound("wall");
    } else if (ball.x > this.w - r) {
      ball.x = this.w - r;
      ball.vx = -Math.abs(ball.vx);
      this.onSound("wall");
    }
    if (ball.y < r) {
      ball.y = r;
      ball.vy = Math.abs(ball.vy);
      this.onSound("wall");
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
      this.emit();
      this.onSound("paddle");
    }

    // Bricks: first one touched this step
    for (const b of this.bricks) {
      if (b.hp <= 0) continue;
      const nx = clamp(ball.x, b.x, b.x + b.w);
      const ny = clamp(ball.y, b.y, b.y + b.h);
      const dx = ball.x - nx;
      const dy = ball.y - ny;
      if (dx * dx + dy * dy >= r * r) continue;

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
    b.hp -= 1;
    b.flash = 1;
    if (b.hp > 0) {
      this.onSound("tough");
      this.shake = Math.max(this.shake, 1.5);
      return;
    }
    this.state.combo += 1;
    const mult = Math.min(5, 1 + Math.floor((this.state.combo - 1) / 2));
    const gain = 10 * mult * b.max;
    this.state.score += gain;
    if (this.state.score > this.state.best) this.state.best = this.state.score;
    this.pops.push({ x: b.x + b.w / 2, y: b.y, text: mult > 1 ? `+${gain}  x${mult}` : `+${gain}`, life: 0.8 });
    this.burst(b);
    this.shake = Math.max(this.shake, 3 + mult * 0.6);
    this.onSound("brick");
    if (Math.random() < 0.16) this.capsules.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, kind: Math.random() < 0.5 ? "wide" : "multi" });
    this.emit();
    if (this.bricks.every((k) => k.hp <= 0)) {
      this.state.status = "clear";
      this.state.score += 100;
      this.clearTimer = 1.5;
      this.onSound("clear");
      this.emit();
    }
  }

  private burst(b: Brick) {
    const color = palette[b.color];
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: b.x + Math.random() * b.w,
        y: b.y + Math.random() * b.h,
        vx: (Math.random() - 0.5) * 360,
        vy: -Math.random() * 280 - 40,
        life: 0.55 + Math.random() * 0.4,
        max: 0.95,
        size: 3 + Math.random() * 4,
        color,
      });
    }
  }

  private collect(kind: "wide" | "multi") {
    this.onSound("power");
    if (kind === "wide") {
      this.setWide(true);
      this.wideTimer = 10;
    } else {
      const src = this.balls.find((b) => !b.stuck);
      if (src) {
        const speed = Math.hypot(src.vx, src.vy);
        const base = Math.atan2(src.vx, -src.vy);
        for (const da of [-0.5, 0.5]) {
          this.balls.push({ x: src.x, y: src.y, vx: Math.sin(base + da) * speed, vy: -Math.cos(base + da) * speed, stuck: false, trail: [] });
        }
      }
    }
  }

  private setWide(on: boolean) {
    this.paddle.w = on ? this.baseW * 1.55 : this.baseW;
    this.state.wide = on;
    this.emit();
  }

  private loseLife() {
    this.state.lives -= 1;
    this.state.combo = 0;
    this.onSound("lose");
    this.shake = 8;
    this.setWide(false);
    this.wideTimer = 0;
    this.capsules = [];
    if (this.state.lives <= 0) {
      this.state.status = "lost";
      this.emit();
      return;
    }
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
    this.state.status = "ready";
    this.capsules = [];
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

    // dot grid, like the canvas on the home page
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = palette.d;
    for (let x = 12; x < w; x += 24) for (let y = 12; y < h; y += 24) ctx.fillRect(x, y, 1.5, 1.5);
    ctx.globalAlpha = 1;

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
      if (b.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${b.flash * 0.7})`;
        rr(ctx, b.x, b.y, b.w, b.h, 4);
        ctx.fill();
      }
    }

    for (const q of this.particles) {
      ctx.globalAlpha = Math.max(0, q.life / q.max);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, q.size, q.size);
    }
    ctx.globalAlpha = 1;

    for (const c of this.capsules) {
      ctx.fillStyle = c.kind === "wide" ? palette.c : palette.b;
      rr(ctx, c.x - 17, c.y - 10, 34, 20, 10);
      ctx.fill();
      ctx.fillStyle = c.kind === "wide" ? palette.ink : "#fff";
      ctx.font = `600 11px ${palette.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.kind === "wide" ? "W" : "x3", c.x, c.y + 1);
    }

    for (const ball of this.balls) {
      ball.trail.forEach((t, i) => {
        ctx.globalAlpha = (i / ball.trail.length) * 0.35;
        ctx.fillStyle = palette.d;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 7 * (i / ball.trail.length), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Paddle squashes a little on every hit
    const p = this.paddle;
    const sq = p.squash * 0.18;
    const pw = p.w * (1 + sq);
    const ph = p.h * (1 - sq);
    ctx.fillStyle = palette.d;
    rr(ctx, p.x - pw / 2, p.y - ph / 2, pw, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = this.state.wide ? palette.c : palette.b;
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
      ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
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
