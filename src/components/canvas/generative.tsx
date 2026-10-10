"use client";

import { useEffect, useRef } from "react";
import { alpha, mix, rgb } from "@/utils/color";

// Generative pictures for the Lab: neurons firing, a strange attractor, a reaction-diffusion pattern, an EEG
// readout, a flow field and a neural globe. Each is drawn live on a canvas, in the site's current colours, and
// reacts to the cursor. They only run while they are on screen.

interface Pal {
  deep: string;
  onDeep: string;
  primary: string;
  accent: string;
  spark: string;
  font: string;
}

interface Env {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number;
  dt: number;
  pointer: { x: number; y: number; active: boolean };
  pal: Pal;
}

type Demo = (env: Env) => void;
type Make = (w: number, h: number) => Demo;

function readPalette(): Pal {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    deep: v("--deep", "#0E0F1A"),
    onDeep: v("--on-deep", "#F4F2EC"),
    primary: v("--cobalt", "#2D3BFF"),
    accent: v("--vermilion", "#FF4D1F"),
    spark: v("--spark", "#FFD84D"),
    font: getComputedStyle(document.body).fontFamily,
  };
}

/** A small seeded random generator, so a demo starts the same way every time. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (x: number, y: number) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Smooth value noise, 0..1. */
function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** 256 colours from the dark surface, through the primary and the spark colour, to the light ink. */
function ramp(pal: Pal): Uint8ClampedArray {
  const stops: [number, string][] = [
    [0, pal.deep],
    [0.38, pal.primary],
    [0.75, pal.spark],
    [1, pal.onDeep],
  ];
  const out = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    let k = 0;
    while (k < stops.length - 2 && v > stops[k + 1][0]) k++;
    const [v0, c0] = stops[k];
    const [v1, c1] = stops[k + 1];
    const [r, g, b] = rgb(mix(c0, c1, (v - v0) / (v1 - v0)));
    out[i * 3] = r;
    out[i * 3 + 1] = g;
    out[i * 3 + 2] = b;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------

/** Neurons joined by synapses. Pulses run along them and set the next neurons off, in cascades. */
const synapse: Make = (w, h) => {
  const rnd = seeded(11);
  const n = Math.max(28, Math.round((w * h) / 3800));
  const nodes = Array.from({ length: n }, () => ({ x: 24 + rnd() * (w - 48), y: 24 + rnd() * (h - 48), glow: 0, adj: [] as number[] }));
  const edges: { a: number; b: number; len: number }[] = [];
  const seen = new Set<string>();
  nodes.forEach((p, i) => {
    nodes
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .forEach(({ j, d }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        const e = edges.push({ a: i, b: j, len: d }) - 1;
        p.adj.push(e);
        nodes[j].adj.push(e);
      });
  });
  const pulses: { e: number; from: number; p: number; s: number }[] = [];
  const fire = (i: number, s: number) => {
    nodes[i].glow = 1;
    if (s < 0.28 || pulses.length > 240) return;
    nodes[i].adj.forEach((e) => {
      if (Math.random() < 0.6) pulses.push({ e, from: i, p: 0, s: s * 0.84 });
    });
  };
  for (let k = 0; k < 3; k++) fire(Math.floor(rnd() * n), 1);

  return ({ ctx, dt, pointer, pal }) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = alpha(pal.deep, 0.3);
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.strokeStyle = alpha(pal.onDeep, 0.1);
    ctx.beginPath();
    for (const e of edges) {
      ctx.moveTo(nodes[e.a].x, nodes[e.a].y);
      ctx.lineTo(nodes[e.b].x, nodes[e.b].y);
    }
    ctx.stroke();

    if (Math.random() < dt * 1.4) fire(Math.floor(Math.random() * n), 1);
    if (pointer.active) {
      nodes.forEach((nd, i) => {
        if (Math.hypot(nd.x - pointer.x, nd.y - pointer.y) < 55 && Math.random() < dt * 9) fire(i, 1);
      });
    }

    ctx.globalCompositeOperation = "lighter";
    for (let k = pulses.length - 1; k >= 0; k--) {
      const pl = pulses[k];
      const e = edges[pl.e];
      pl.p += (dt * 240) / e.len;
      const toIdx = e.a === pl.from ? e.b : e.a;
      const from = nodes[pl.from];
      const to = nodes[toIdx];
      const q = Math.min(pl.p, 1);
      const x = from.x + (to.x - from.x) * q;
      const y = from.y + (to.y - from.y) * q;
      ctx.strokeStyle = alpha(pal.primary, 0.9 * pl.s);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = alpha(pal.spark, pl.s);
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, 6.2832);
      ctx.fill();
      if (pl.p >= 1) {
        pulses.splice(k, 1);
        fire(toIdx, pl.s);
      }
    }
    for (const nd of nodes) {
      nd.glow = Math.max(0, nd.glow - dt * 1.5);
      ctx.fillStyle = alpha(nd.glow > 0.05 ? pal.spark : pal.onDeep, 0.25 + nd.glow * 0.75);
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, 2 + nd.glow * 5, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  };
};

/** A Clifford attractor: one equation, tens of thousands of points a frame, its constants drifting so it morphs. */
const attractor: Make = (w, h) => {
  const gw = 200;
  const gh = Math.max(40, Math.round((gw * h) / w));
  const hist = new Float32Array(gw * gh);
  const off = document.createElement("canvas");
  off.width = gw;
  off.height = gh;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(gw, gh);
  let x = 0.1;
  let y = 0.1;
  let colours: Uint8ClampedArray | null = null;
  let colourKey = "";

  return ({ ctx, t, pointer, pal }) => {
    const key = pal.deep + pal.primary + pal.spark + pal.onDeep;
    if (key !== colourKey || !colours) {
      colours = ramp(pal);
      colourKey = key;
    }
    const px = pointer.active ? pointer.x / w - 0.5 : 0;
    const py = pointer.active ? pointer.y / h - 0.5 : 0;
    const a = -1.4 + 0.32 * Math.sin(t * 0.11) + px * 0.35;
    const b = 1.6 + 0.25 * Math.sin(t * 0.13 + 1) + py * 0.35;
    const c = 1.0 + 0.3 * Math.sin(t * 0.07 + 2);
    const d = 0.7 + 0.25 * Math.sin(t * 0.09 + 3);

    for (let i = 0; i < hist.length; i++) hist[i] *= 0.9;
    const kx = gw / 4.8;
    const ky = gh / 4.8;
    for (let i = 0; i < 26000; i++) {
      const nx = Math.sin(a * y) + c * Math.cos(a * x);
      const ny = Math.sin(b * x) + d * Math.cos(b * y);
      x = nx;
      y = ny;
      const ix = ((x + 2.4) * kx) | 0;
      const iy = ((y + 2.4) * ky) | 0;
      if (ix >= 0 && ix < gw && iy >= 0 && iy < gh) hist[iy * gw + ix] += 1;
    }
    let max = 1;
    for (let i = 0; i < hist.length; i++) if (hist[i] > max) max = hist[i];
    const norm = 1 / Math.log(1 + max);
    const data = img.data;
    for (let i = 0; i < hist.length; i++) {
      const idx = Math.min(255, (Math.log(1 + hist[i]) * norm * 255) | 0) * 3;
      data[i * 4] = colours[idx];
      data[i * 4 + 1] = colours[idx + 1];
      data[i * 4 + 2] = colours[idx + 2];
      data[i * 4 + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, w, h);
  };
};

/** Gray-Scott reaction-diffusion: two imaginary chemicals that grow into coral and labyrinth patterns. Move over it to add more. */
const turing: Make = (w, h) => {
  const gw = Math.max(40, Math.round(w / 4));
  const gh = Math.max(30, Math.round(h / 4));
  const N = gw * gh;
  let A = new Float32Array(N);
  let B = new Float32Array(N);
  let A2 = new Float32Array(N);
  let B2 = new Float32Array(N);
  const off = document.createElement("canvas");
  off.width = gw;
  off.height = gh;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(gw, gh);
  const F = 0.0545;
  const K = 0.062;
  let colours: Uint8ClampedArray | null = null;
  let colourKey = "";
  let frames = 0;

  const seed = () => {
    A.fill(1);
    B.fill(0);
    for (let s = 0; s < 9; s++) {
      const cx = (Math.random() * gw) | 0;
      const cy = (Math.random() * gh) | 0;
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          const i = ((cy + dy + gh) % gh) * gw + ((cx + dx + gw) % gw);
          B[i] = 1;
          A[i] = 0.4;
        }
    }
  };
  const step = () => {
    for (let y = 0; y < gh; y++) {
      const ym = ((y - 1 + gh) % gh) * gw;
      const y0 = y * gw;
      const yp = ((y + 1) % gh) * gw;
      for (let x = 0; x < gw; x++) {
        const xm = (x - 1 + gw) % gw;
        const xp = (x + 1) % gw;
        const i = y0 + x;
        const a = A[i];
        const b = B[i];
        const la = (A[ym + x] + A[yp + x] + A[y0 + xm] + A[y0 + xp]) * 0.2 + (A[ym + xm] + A[ym + xp] + A[yp + xm] + A[yp + xp]) * 0.05 - a;
        const lb = (B[ym + x] + B[yp + x] + B[y0 + xm] + B[y0 + xp]) * 0.2 + (B[ym + xm] + B[ym + xp] + B[yp + xm] + B[yp + xp]) * 0.05 - b;
        const r = a * b * b;
        A2[i] = a + (la - r + F * (1 - a));
        B2[i] = b + (0.5 * lb + r - (K + F) * b);
      }
    }
    [A, A2] = [A2, A];
    [B, B2] = [B2, B];
  };
  seed();
  for (let i = 0; i < 160; i++) step();

  return ({ ctx, pointer, pal }) => {
    const key = pal.deep + pal.primary + pal.spark + pal.onDeep;
    if (key !== colourKey || !colours) {
      colours = ramp(pal);
      colourKey = key;
    }
    if (pointer.active) {
      const cx = ((pointer.x / w) * gw) | 0;
      const cy = ((pointer.y / h) * gh) | 0;
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || y < 0 || x >= gw || y >= gh || dx * dx + dy * dy > 10) continue;
          B[y * gw + x] = 1;
          A[y * gw + x] = 0.4;
        }
    }
    for (let i = 0; i < 8; i++) step();
    // If everything has faded out, plant new seeds.
    if (++frames % 120 === 0) {
      let sum = 0;
      for (let i = 0; i < N; i += 7) sum += B[i];
      if (sum / (N / 7) < 0.004) seed();
    }
    const data = img.data;
    for (let i = 0; i < N; i++) {
      const idx = Math.min(255, (B[i] * 2.6 * 255) | 0) * 3;
      data[i * 4] = colours[idx];
      data[i * 4 + 1] = colours[idx + 1];
      data[i * 4 + 2] = colours[idx + 2];
      data[i * 4 + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, w, h);
  };
};

/** An invented EEG: six channels sweeping across, with now and then a spike-and-wave burst. Move over it to stimulate. */
const brainwave: Make = (w, h) => {
  const ch = 6;
  const labels = ["Fp1", "Fp2", "C3", "C4", "O1", "O2"];
  const phase = labels.map((_, i) => i * 1.7 + 0.4);
  const lastY: number[] = Array(ch).fill(NaN);
  let head = 0;
  let clock = 0;
  let spikeStart = -10;
  let nextSpike = 2 + Math.random() * 3;
  let primed = false;
  const speed = 150;

  return ({ ctx, dt, pointer, pal }) => {
    if (!primed) {
      ctx.fillStyle = pal.deep;
      ctx.fillRect(0, 0, w, h);
      primed = true;
    }
    if (pointer.active && Math.random() < dt * 0.7 && clock > spikeStart + 1.2) spikeStart = clock;
    const gain = 1 + (pointer.active ? 0.9 : 0);
    const steps = Math.max(1, Math.round(dt * speed));
    const lane = h / ch;
    for (let s = 0; s < steps; s++) {
      clock += 1 / speed;
      if (clock > nextSpike) {
        spikeStart = clock;
        nextSpike = clock + 3 + Math.random() * 4;
      }
      const tau = clock - spikeStart;
      const burst = tau >= 0 && tau < 0.6 ? Math.exp(-tau * 5) * Math.sin(tau * 46) * 2.4 : 0;
      ctx.fillStyle = pal.deep;
      ctx.fillRect(head + 1, 0, 16, h);
      for (let i = 0; i < ch; i++) {
        const v =
          0.55 * Math.sin(clock * 6.2832 * 1.6 + phase[i]) +
          0.32 * Math.sin(clock * 6.2832 * (9.5 + i * 0.4) + phase[i] * 2) +
          0.18 * Math.sin(clock * 6.2832 * 22 + phase[i] * 3) +
          (Math.random() - 0.5) * 0.22 +
          burst * (i % 2 ? 1 : -1);
        const y = lane * (i + 0.5) + v * lane * 0.3 * gain;
        if (!Number.isNaN(lastY[i]) && head > 0) {
          ctx.strokeStyle = i % 2 ? pal.spark : pal.primary;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(head - 1, lastY[i]);
          ctx.lineTo(head, y);
          ctx.stroke();
        }
        lastY[i] = y;
      }
      head++;
      if (head >= w) {
        head = 0;
        lastY.fill(NaN);
      }
    }
    ctx.font = `10px ${pal.font}`;
    ctx.fillStyle = alpha(pal.onDeep, 0.55);
    labels.forEach((l, i) => ctx.fillText(l, 10, lane * (i + 0.5) - 14));
    ctx.fillStyle = alpha(pal.spark, 0.9);
    ctx.fillRect(head, 0, 1.5, h);
  };
};

/** Particles riding a noise field. Your cursor pushes them away. */
const field: Make = (w, h) => {
  const P = Math.round((w * h) / 180);
  const ps = Array.from({ length: P }, () => ({ x: Math.random() * w, y: Math.random() * h, life: Math.random() * 6 }));
  let primed = false;
  return ({ ctx, t, dt, pointer, pal }) => {
    if (!primed) {
      ctx.fillStyle = pal.deep;
      ctx.fillRect(0, 0, w, h);
      primed = true;
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = alpha(pal.deep, 0.07);
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 1.2;
    const colours = [alpha(pal.primary, 0.75), alpha(pal.spark, 0.7), alpha(pal.onDeep, 0.3)];
    for (let c = 0; c < 3; c++) {
      ctx.strokeStyle = colours[c];
      ctx.beginPath();
      for (let k = c; k < P; k += 3) {
        const p = ps[k];
        const ang = noise(p.x * 0.006 + t * 0.05, p.y * 0.006) * 12.566;
        let vx = Math.cos(ang);
        let vy = Math.sin(ang);
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < 90) {
            const f = (1 - d / 90) * 2.4;
            vx += (dx / (d + 1)) * f;
            vy += (dy / (d + 1)) * f;
          }
        }
        const nx = p.x + vx * 55 * dt;
        const ny = p.y + vy * 55 * dt;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        p.x = nx;
        p.y = ny;
        p.life -= dt;
        if (p.life < 0 || nx < 0 || nx > w || ny < 0 || ny > h) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.life = 3 + Math.random() * 5;
        }
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  };
};

/** A globe of 170 nodes joined to their neighbours. It turns on its own; move over it to tilt it. */
const orbit: Make = (w, h) => {
  const N = 170;
  const R = Math.min(w, h) * 0.36;
  const base = Array.from({ length: N }, (_, i) => {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * 2.399963;
    return { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
  });
  const sx = new Float32Array(N);
  const sy = new Float32Array(N);
  const rx3 = new Float32Array(N);
  const ry3 = new Float32Array(N);
  const rz3 = new Float32Array(N);
  let tilt = 0.35;

  return ({ ctx, t, dt, pointer, pal }) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = alpha(pal.deep, 0.5);
    ctx.fillRect(0, 0, w, h);
    const targetTilt = pointer.active ? (pointer.y / h - 0.5) * 1.2 : 0.35;
    tilt += (targetTilt - tilt) * Math.min(1, dt * 3);
    const spin = t * 0.28 + (pointer.active ? (pointer.x / w - 0.5) * 2.4 : 0);
    const cy = Math.cos(spin);
    const sy_ = Math.sin(spin);
    const cx = Math.cos(tilt);
    const sx_ = Math.sin(tilt);
    const mx = w / 2;
    const my = h / 2;
    for (let i = 0; i < N; i++) {
      const p = base[i];
      const x1 = p.x * cy + p.z * sy_;
      const z1 = -p.x * sy_ + p.z * cy;
      const y2 = p.y * cx - z1 * sx_;
      const z2 = p.y * sx_ + z1 * cx;
      rx3[i] = x1;
      ry3[i] = y2;
      rz3[i] = z2;
      const f = 1 / (1 - z2 * 0.28);
      sx[i] = mx + x1 * R * f;
      sy[i] = my + y2 * R * f;
    }

    ctx.globalCompositeOperation = "lighter";
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(spin * 0.2);
    ctx.scale(1, 0.26 + 0.12 * Math.sin(tilt));
    ctx.setLineDash([4, 9]);
    ctx.strokeStyle = alpha(pal.onDeep, 0.22);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.3, 0, 6.2832);
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);

    // Neighbour links, in three strengths so each is a single stroke.
    const bands: Path2D[] = [new Path2D(), new Path2D(), new Path2D()];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = rx3[i] - rx3[j];
        const dy = ry3[i] - ry3[j];
        const dz = rz3[i] - rz3[j];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > 0.19) continue;
        const near = (rz3[i] + rz3[j]) * 0.5 + 1;
        const b = near > 1.35 ? 2 : near > 0.7 ? 1 : 0;
        bands[b].moveTo(sx[i], sy[i]);
        bands[b].lineTo(sx[j], sy[j]);
      }
    }
    const strengths = [0.1, 0.22, 0.42];
    bands.forEach((band, b) => {
      ctx.strokeStyle = alpha(pal.primary, strengths[b]);
      ctx.lineWidth = 0.8 + b * 0.35;
      ctx.stroke(band);
    });

    for (let i = 0; i < N; i++) {
      const depth = (rz3[i] + 1) / 2;
      const lit = Math.sin(t * 1.3 + i * 12.9898) > 0.93;
      ctx.fillStyle = lit ? alpha(pal.spark, 0.95) : alpha(pal.onDeep, 0.2 + depth * 0.7);
      ctx.beginPath();
      ctx.arc(sx[i], sy[i], (lit ? 3 : 1) + depth * 1.8, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  };
};

// ---------------------------------------------------------------------------------------------------------

function Live({ make, fps = 60, caption, tag }: { make: Make; fps?: number; caption: string; tag?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, active: false };
    let pal = readPalette();
    let demo: Demo | null = null;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    const t0 = performance.now();
    let last = t0;

    const build = () => {
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      demo = make(w, h);
      // Reduced motion: a still picture, drawn by running the demo for a moment.
      if (reduced) for (let i = 0; i < 90; i++) demo({ ctx, w, h, t: i / 60, dt: 1 / 60, pointer, pal });
    };
    const ro = new ResizeObserver(() => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      build();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.01 });
    io.observe(canvas);

    const onTheme = () => {
      pal = readPalette();
      build();
    };
    window.addEventListener("pm:theme", onTheme);

    // Frames can be zoomed and tilted on the canvas, so work out the pointer from the bounding box.
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * w;
      pointer.y = ((e.clientY - r.top) / r.height) * h;
      pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (reduced || !visible || document.hidden || !demo) return;
      if (fps < 60 && now - last < 1000 / fps - 2) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      demo({ ctx, w, h, t: (now - t0) / 1000, dt, pointer, pal });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pm:theme", onTheme);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [make, fps]);

  return (
    <div className="absolute inset-0 bg-deep">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />
      <span className="label pointer-events-none absolute left-4 top-4 text-on-deep/70">{caption}</span>
      {tag && <span className="label pointer-events-none absolute bottom-4 right-4 text-on-deep/50">{tag}</span>}
    </div>
  );
}

export const SynapseLab = () => <Live make={synapse} caption="Neurons · cascade" tag="move to stimulate" />;
export const AttractorLab = () => <Live make={attractor} fps={30} caption="Clifford attractor" tag="move to bend it" />;
export const TuringLab = () => <Live make={turing} fps={30} caption="Reaction–diffusion" tag="move to add more" />;
export const BrainwaveLab = () => <Live make={brainwave} caption="EEG · 6 channels" tag="move to stimulate" />;
export const FieldLab = () => <Live make={field} caption="Flow field" tag="move to push" />;
export const OrbitLab = () => <Live make={orbit} caption="Neural globe" tag="move to tilt" />;
