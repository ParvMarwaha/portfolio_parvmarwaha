"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { site } from "@/content/site";
import { projects, projectHref, projectsOpenOnBehance } from "@/content/projects";
import { useIstClock } from "@/components/hero/LetterHeadline";
import Magnetic from "@/components/ui/Magnetic";
import RemoteImage from "@/components/ui/RemoteImage";
import { sfx, uiSound } from "@/utils/ambient";
import KernArt, { type KernFace } from "@/components/kern/KernArt";
import { answer, type KernAction } from "@/components/kern/kern-brain";

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
import { toWork, useEntered } from "./shared";

/**
 * V7 "Kern": Parv's design buddy, a little creature made of a design tool's selection box (the corner handles are its
 * hands and feet). It lives on the giant name: letters get heavier where it stands and get pushed when it bumps into
 * them, and when nobody is looking it fixes the kerning by shoving letters apart and back. It talks: the speech bubble
 * has reply chips (who is Parv, is he available, show me the work, hire him) and Kern acts each answer out. You can also
 * pick it up and throw it, or poke it for a different reaction each time.
 */

const LINES = ["Parv", "Marwaha"];
type Face = KernFace;
type Pose = "idle" | "wave" | "up" | "point";
type Act = "tour" | "copy" | "hire" | "work" | "all" | "prev" | "next";
type NodeId = "hello" | "back" | "who" | "avail" | "copied" | "work" | "chat" | "t1" | "t2" | "t3" | "t4";
interface Chip {
  label: string;
  go?: NodeId;
  act?: Act;
}
interface Line {
  text: string;
  chips: Chip[];
}

const NODES: Record<NodeId, Line> = {
  hello: {
    text: "Hi, I'm Kern. I keep Parv's pixels in line. Want the quick tour?",
    chips: [{ label: "Sure", act: "tour" }, { label: "Who's Parv?", go: "who" }, { label: "Show me the work", act: "work" }],
  },
  back: {
    text: "Oh, you're back. I kept your spot warm. Where to?",
    chips: [{ label: "Quick tour", act: "tour" }, { label: "Who's Parv?", go: "who" }, { label: "Show me the work", act: "work" }],
  },
  who: {
    text: "A designer from India. Interfaces, brand identity and motion, and he builds them too. That's how I exist.",
    chips: [{ label: "Is he available?", go: "avail" }, { label: "Show me the work", act: "work" }],
  },
  avail: {
    text: "Yes. Freelance and full-time, from now-ish.",
    chips: [{ label: "Copy his email", act: "copy" }, { label: "Hire him", act: "hire" }],
  },
  copied: {
    text: "Copied! He replies fast, I've seen it.",
    chips: [{ label: "Hire him", act: "hire" }, { label: "Show me the work", act: "work" }],
  },
  work: { text: "", chips: [] },
  chat: { text: "", chips: [{ label: "Show me the work", act: "work" }, { label: "Hire him", act: "hire" }] },
  t1: { text: "This is his name. I kern it every morning. Watch.", chips: [] },
  t2: { text: "He designs interfaces, brands and motion.", chips: [] },
  t3: { text: "And he ships the code. I'm proof.", chips: [] },
  t4: {
    text: "That's the tour. Your move.",
    chips: [{ label: "Hire him", act: "hire" }, { label: "Show me the work", act: "work" }, { label: "Who's Parv?", go: "who" }],
  },
};

const POKES: { line: string; act: "hop" | "spin" | "dizzy" | "stretch" | "confetti" | "snap" | "wiggle" }[] = [
  { line: "Boing. Gravity is a design choice.", act: "hop" },
  { line: "Did you see that spin? Pixel perfect.", act: "spin" },
  { line: "Okay. Too many revisions…", act: "dizzy" },
  { line: "Resizing… hold shift, hold shift.", act: "stretch" },
  { line: "Ta-da! Brand colours.", act: "confetti" },
  { line: "Snapped to the grid. So satisfying.", act: "snap" },
  { line: "Careful, I'm 2px off-grid now.", act: "wiggle" },
  { line: "Poke me again and I'll auto-layout you.", act: "hop" },
];

const WORK = projects.slice(0, 8);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));


export default function HeroV7() {
  const entered = useEntered();
  const time = useIstClock();
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const kernRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef<SVGGElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);
  const hireRef = useRef<HTMLAnchorElement>(null);
  const workRef = useRef<HTMLButtonElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [face, setFace] = useState<Face>("open");
  const [node, setNode] = useState<NodeId | null>(null);
  const [aside, setAside] = useState<string | null>(null); // a quick reaction that briefly replaces the line
  const [workIdx, setWorkIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  // Free-text questions, answered by Kern's own offline brain (src/components/kern/kern-brain.ts).
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [typing, setTyping] = useState(false);
  const nodeRef = useRef<NodeId | null>(null);
  const api = useRef<{
    poke: () => void;
    react: (t: string, ms?: number, f?: Face) => void;
    look: (el: HTMLElement | null) => void;
    walk: (dir: number) => void;
    tour: () => void;
    goTo: (el: HTMLElement | null, then?: () => void) => void;
    pose: (p: Pose, ms?: number) => void;
    cheer: () => void;
    listen: (on: boolean) => void;
    act: (a: KernAction) => void;
  } | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const kern = kernRef.current;
    const body = bodyRef.current;
    if (!stage || !kern || !body) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const letters = letterRefs.current.filter((e): e is HTMLSpanElement => !!e);
    const ox = letters.map(() => 0); // horizontal push on each letter (springs)
    const ov = letters.map(() => 0);
    const otarget = letters.map(() => 0);
    const press = letters.map(() => 0);

    // ---- geometry (layout px inside the stage; the sticky cover scales slightly, so divide screen px by `scale`)
    let W = 0;
    let H = 0;
    let scale = 1;
    let fs = 120;
    let K = 90;
    let boxes: { x: number; w: number; top: number; line: number }[] = [];
    let bridges: typeof boxes = [];
    let boards: { x: number; w: number; top: number }[] = [];
    const measure = () => {
      W = stage.offsetWidth;
      H = stage.offsetHeight;
      const r = stage.getBoundingClientRect();
      scale = W ? r.width / W : 1;
      fs = parseFloat(getComputedStyle(letters[0] ?? stage).fontSize) || fs;
      K = clamp(fs * 0.5, 54, 132);
      kern.style.width = `${K}px`;
      kern.style.height = `${K}px`;
      const ctx = document.createElement("canvas").getContext("2d");
      boxes = letters.map((el, i) => {
        const lr = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const h = lr.height / scale;
        let inkTop = fs * 0.12;
        if (ctx) {
          ctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
          const m = ctx.measureText(el.textContent ?? "");
          const fa = m.fontBoundingBoxAscent || fs * 0.9;
          const fd = m.fontBoundingBoxDescent || fs * 0.25;
          inkTop = (h - (fa + fd)) / 2 + fa - m.actualBoundingBoxAscent;
        }
        // getBoundingClientRect includes the current push; store the resting position.
        return { x: (lr.left - r.left) / scale - ox[i], w: lr.width / scale, top: (lr.top - r.top) / scale + inkTop, line: Math.round(el.offsetTop) };
      });
      boards = Array.from(stage.querySelectorAll<HTMLElement>("[data-board]"))
        .map((el) => el.getBoundingClientRect())
        .filter((b) => b.width > 0)
        .map((b) => ({ x: (b.left - r.left) / scale + 6, w: b.width / scale - 12, top: (b.top - r.top) / scale + 2 }));
      bridges = [];
      for (let i = 1; i < boxes.length; i++) {
        const a = boxes[i - 1];
        const b = boxes[i];
        const gap = b.x - (a.x + a.w);
        if (a.line === b.line && gap > 1) bridges.push({ x: a.x + a.w, w: gap, top: Math.max(a.top, b.top), line: a.line });
      }
    };
    measure();

    const surfaces = () => {
      const out = boxes.map((b, i) => ({ x: b.x + ox[i], w: b.w, top: b.top }));
      return out.concat(bridges.map((b) => ({ x: b.x, w: b.w, top: b.top })), boards);
    };
    // The highest surface under Kern that is not above it: a letter top, a word space, or the stage floor.
    const floorAt = (x: number, fromY: number) => {
      let best = H;
      const half = K * 0.3;
      for (const b of surfaces()) {
        if (x + half < b.x || x - half > b.x + b.w) continue;
        if (b.top >= fromY - 6 && b.top < best) best = b.top;
      }
      return best;
    };
    const centerOf = (i: number) => (boxes[i] ? boxes[i].x + boxes[i].w / 2 : W / 2);

    // ---- state
    const s = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      mode: "hidden" as "hidden" | "ground" | "air" | "held",
      sq: 0,
      sqv: 0,
      rot: 0,
      rotv: 0,
      spin: 0,
      targetX: null as number | null,
      onArrive: null as null | (() => void),
      facing: 1,
      walkT: 0,
      wv: 0, // walking speed, eased in and out
      startledAt: 0,
      tickleAt: 0,
      hoverSince: 0,
      saccadeAt: 0,
      idleLook: { x: 0, y: 0 },
      lastInput: performance.now(),
      sleeping: false,
      busy: false, // a scripted bit (tour, kerning) is running: no wandering
      look: { x: 0, y: 0 },
      lookAt: null as HTMLElement | null,
      blinkAt: performance.now() + 2500,
      stretchT: 0,
      wiggleT: 0,
      pose: "idle" as Pose,
      poseUntil: 0,
      kernAt: 0,
      listening: false, // the bubble has reply chips: stay put so they don't run away from the cursor
    };
    // Where the cursor is, how fast it moves, and since when it has been resting (Kern only walks over to a cursor that
    // has settled, so it doesn't chase every twitch).
    const pointer = { x: 0, y: 0, inside: false, vx: 0, speed: 0, t: 0, restSince: 0, leftAt: 0, lastX: 0, lastY: 0 };
    const held = { dx: 0, dy: 0, lastX: 0, lastY: 0, lastT: 0, downX: 0, downY: 0, downT: 0, moved: false, id: -1, ax: 0 };

    // Put Kern back on top of whatever is under it when the layout changes, instead of letting it fall through.
    const ro = new ResizeObserver(() => {
      measure();
      if (s.mode === "ground" || s.mode === "air") {
        s.x = clamp(s.x, K / 2, W - K / 2);
        s.y = floorAt(s.x, -Infinity);
        s.vx = s.vy = 0;
        s.mode = "ground";
      }
    });
    ro.observe(stage);

    // ---- talk
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    let asideTimer = 0;
    let faceTimer = 0;
    const setF = (f: Face, ms = 1800) => {
      window.clearTimeout(faceTimer);
      setFace(f);
      if (f !== "sleepy") faceTimer = window.setTimeout(() => setFace("open"), ms);
    };
    const react = (text: string, ms = 2400, f?: Face) => {
      window.clearTimeout(asideTimer);
      setAside(text);
      asideTimer = window.setTimeout(() => setAside(null), ms);
      if (f) setF(f, Math.min(ms, 1800));
    };
    const setPose = (p: Pose, ms = 1400) => {
      s.pose = p;
      s.poseUntil = performance.now() + ms;
    };

    // ---- sounds (all no-ops until the site's sound is on)
    const pan = () => clamp((s.x / Math.max(1, W)) * 2 - 1, -1, 1) * 0.6;
    const boop = () => sfx.blip("triangle", 520, 880, 0.12, 0.22, 0, pan());
    const thud = (v: number) => {
      const lvl = clamp(v / 1800, 0.15, 0.7);
      sfx.blip("sine", 170, 60, 0.18, lvl, 0, pan());
      sfx.burst("lowpass", 900, 0.08, lvl * 0.5, 0, pan());
    };
    const lift = () => sfx.blip("sine", 300, 640, 0.16, 0.2, 0, pan());
    const shove = () => sfx.blip("square", 140, 90, 0.12, 0.12, 0, pan(), 900);
    const sparkle = () => [0, 4, 7, 12].forEach((n, i) => sfx.blip("triangle", sfx.tone(n, 4), sfx.tone(n, 4), 0.25, 0.16, i * 0.06, pan()));

    // letters get heavier where Kern presses, and are shoved sideways when it bumps into them
    const hit = (x: number, strength: number) => {
      boxes.forEach((b, i) => {
        const d = Math.abs(b.x + ox[i] + b.w / 2 - x) / Math.max(1, fs);
        press[i] = Math.max(press[i], strength * Math.max(0, 1 - d * 0.9));
        if (strength > 0.6 && d < 0.9) ov[i] += Math.sign(b.x + ox[i] + b.w / 2 - x || 1) * strength * fs * 0.9;
      });
    };

    const confetti = () => {
      const host = confettiRef.current;
      if (!host || reduced) return;
      const colours = ["var(--paper)", "var(--vermilion)", "var(--butter)", "var(--ink)"];
      for (let i = 0; i < 22; i++) {
        const p = document.createElement("span");
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const v = 160 + Math.random() * 260;
        p.style.cssText = `position:absolute;left:${s.x}px;top:${s.y - K * 0.7}px;width:9px;height:9px;background:${colours[i % 4]};pointer-events:none`;
        host.appendChild(p);
        p.animate(
          [
            { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(a) * v}px), calc(-50% + ${Math.sin(a) * v + 140}px)) rotate(${Math.random() * 540}deg)`, opacity: 0 },
          ],
          { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.8,.4,1)" }
        ).onfinish = () => p.remove();
      }
    };

    // ---- actions
    const jump = (power = 1) => {
      s.mode = "air";
      s.vy = -Math.sqrt(2 * 2600 * K * 1.3) * power;
      s.sq = -0.25;
    };
    const walkTo = (x: number, then?: () => void) => {
      s.sleeping = false;
      s.targetX = clamp(x, K / 2, W - K / 2);
      s.onArrive = then ?? null;
    };

    // The kerning bit: squeeze into a gap between two letters, shove the word apart, show the number, let it settle.
    const kernGap = (then?: () => void) => {
      if (reduced || boxes.length < 2) {
        then?.();
        return;
      }
      const pairs: number[] = [];
      for (let i = 1; i < boxes.length; i++) if (boxes[i].line === boxes[i - 1].line) pairs.push(i);
      const i = pairs[Math.floor(Math.random() * pairs.length)];
      const gx = (boxes[i - 1].x + boxes[i - 1].w + boxes[i].x) / 2;
      s.busy = true;
      walkTo(gx, () => {
        setPose("up", 1600);
        setF("wow", 1400);
        shove();
        const d = fs * 0.22;
        boxes.forEach((b, j) => {
          if (b.line !== boxes[i].line) return;
          otarget[j] = j < i ? -d : d;
        });
        s.kernAt = performance.now();
        if (tagRef.current) tagRef.current.dataset.kern = `+${Math.round(d)}`;
        later(() => {
          otarget.fill(0);
          if (tagRef.current) tagRef.current.dataset.kern = "0";
          setF("happy", 1400);
          sparkle();
          // hop out before the letters close back in
          if (s.mode === "ground") jump(1.05);
        }, 1100);
        later(() => {
          if (tagRef.current) delete tagRef.current.dataset.kern;
          s.busy = false;
          then?.();
        }, 2000);
      });
    };

    const tour = () => {
      s.busy = true;
      s.lastInput = performance.now();
      setNode("t1");
      later(
        () =>
          kernGap(() => {
            setNode("t2");
            s.busy = true;
            walkTo(centerOf(Math.min(boxes.length - 1, 6)), () => {
              setPose("wave", 1600);
              later(() => {
                setNode("t3");
                jump(0.9);
                later(() => {
                  confetti();
                  sparkle();
                  setNode("t4");
                  setF("happy");
                  s.busy = false;
                }, 1500);
              }, 1900);
            });
          }),
        900
      );
    };

    // Walk under an element (a button) and point at it.
    const goTo = (el: HTMLElement | null, then?: () => void) => {
      if (!el) {
        then?.();
        return;
      }
      const r = el.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const x = (r.left + r.width / 2 - sr.left) / scale;
      s.busy = true;
      s.lookAt = el;
      if (reduced) {
        s.x = clamp(x, K / 2, W - K / 2);
        s.y = floorAt(s.x, -Infinity);
      }
      walkTo(x, () => {
        setPose("point", 1600);
        setF("happy");
        later(() => {
          s.busy = false;
          s.lookAt = null;
          then?.();
        }, reduced ? 50 : 650);
      });
    };

    let pokeN = 0;
    const poke = () => {
      s.lastInput = performance.now();
      // With the bubble tucked away, a poke means "hey Kern": it waves and asks where to next.
      if (nodeRef.current === null && !s.sleeping) {
        setNode("back");
        setPose("wave", 1600);
        setF("happy");
        boop();
        return;
      }
      if (s.sleeping) {
        s.sleeping = false;
        react("Huh? I wasn't sleeping. I was rendering.", 2600, "wow");
        jump(0.7);
        return;
      }
      const r = POKES[pokeN % POKES.length];
      pokeN++;
      boop();
      if (reduced) {
        react(r.line, 2600, "happy");
        return;
      }
      if (r.act === "hop") {
        jump();
        react(r.line, 2400, "happy");
      } else if (r.act === "spin") {
        jump(1.15);
        s.spin = 1;
        react(r.line, 2600, "happy");
      } else if (r.act === "dizzy") {
        s.rotv += 9;
        react(r.line, 2600, "dizzy");
      } else if (r.act === "stretch") {
        s.stretchT = 1.1;
        react(r.line, 2600, "wow");
      } else if (r.act === "confetti") {
        jump(0.8);
        confetti();
        sparkle();
        setPose("up", 1200);
        react(r.line, 2400, "happy");
      } else if (r.act === "snap") {
        s.x = Math.round(s.x / 24) * 24;
        s.sq = 0.3;
        hit(s.x, 1);
        react(r.line, 2400, "happy");
      } else {
        s.wiggleT = 0.9;
        react(r.line, 2600, "wow");
      }
    };

    api.current = {
      poke,
      react,
      look: (el) => {
        s.lookAt = el;
      },
      walk: (dir) => {
        s.lastInput = performance.now();
        walkTo(s.x + dir * K * 1.2);
      },
      tour,
      goTo,
      pose: setPose,
      // Things a chat answer can ask Kern to do on screen.
      act: (a) => {
        s.lastInput = performance.now();
        if (reduced && a !== "theme") return;
        if (a === "dance") {
          s.wiggleT = 1.4;
          setPose("wave", 2200);
          jump(0.55);
          later(() => s.mode === "ground" && jump(0.55), 650);
          later(() => s.mode === "ground" && jump(0.55), 1300);
        } else if (a === "spin") {
          jump(1.15);
          s.spin = 1;
        } else if (a === "hop") jump();
        else if (a === "party") {
          jump(0.9);
          confetti();
          sparkle();
          setPose("up", 1600);
        } else if (a === "sleep") {
          s.sleeping = true;
          setF("sleepy");
        } else if (a === "theme") {
          document.querySelector<HTMLButtonElement>('button[aria-label^="Surprise me"]')?.click();
          jump(0.6);
        }
      },
      listen: (on) => {
        s.listening = on;
        if (on && !s.busy) {
          s.targetX = null;
          s.onArrive = null;
        }
      },
      cheer: () => {
        setPose("up", 1200);
        setF("happy");
        sparkle();
        if (!reduced && s.mode === "ground") jump(0.6);
      },
    };

    // ---- entrance: drop onto the "a" of Parv and wave
    let didEnter = false;
    const enter = () => {
      if (didEnter || !W) return;
      didEnter = true;
      const b = boxes[1] ?? boxes[0];
      s.x = b ? b.x + b.w / 2 : W * 0.3;
      s.y = reduced ? floorAt(s.x, -Infinity) : K * 0.6;
      s.mode = reduced ? "ground" : "air";
      kern.style.transform = `translate3d(${(s.x - K / 2).toFixed(1)}px, ${(s.y - K).toFixed(1)}px, 0)`;
      kern.style.opacity = "1";
      let back = false;
      try {
        back = sessionStorage.getItem("pm-kern") === "1";
        sessionStorage.setItem("pm-kern", "1");
      } catch {}
      later(
        () => {
          setNode(back ? "back" : "hello");
          setPose("wave", 1800);
          setF("happy");
        },
        reduced ? 150 : 900
      );
    };
    kern.addEventListener("kern:enter", enter);

    // ---- input
    const local = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      const now = performance.now();
      const pdt = Math.max(8, now - pointer.t) / 1000;
      const vx = (p.x - pointer.x) / pdt;
      const sp = Math.hypot(p.x - pointer.x, p.y - pointer.y) / pdt;
      pointer.vx += (vx - pointer.vx) * 0.35;
      pointer.speed += (sp - pointer.speed) * 0.35;
      if (pointer.speed > 420 || !pointer.inside) pointer.restSince = now;
      pointer.t = now;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.inside = e.pointerType === "mouse";
      if (held.id !== -1 && e.pointerType === "mouse" && e.buttons === 0) {
        release(e.pointerId);
        return;
      }
      if (held.id === e.pointerId) {
        if (Math.hypot(e.clientX - held.downX, e.clientY - held.downY) > 5) held.moved = true;
        const now = performance.now();
        const dt = Math.max(1, now - held.lastT) / 1000;
        const nvx = s.vx * 0.5 + ((p.x - held.lastX) / dt) * 0.5;
        held.ax = held.ax * 0.6 + ((nvx - s.vx) / dt) * 0.4;
        s.vx = nvx;
        s.vy = s.vy * 0.5 + ((p.y - held.lastY) / dt) * 0.5;
        held.lastX = p.x;
        held.lastY = p.y;
        held.lastT = now;
      }
      if (s.sleeping && e.pointerType === "mouse") {
        s.sleeping = false;
        setFace("open");
      }
      s.lastInput = performance.now();
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.leftAt = performance.now();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      kern.setPointerCapture(e.pointerId);
      const p = local(e);
      Object.assign(held, { id: e.pointerId, moved: false, downX: e.clientX, downY: e.clientY, downT: performance.now(), dx: s.x - p.x, dy: s.y - p.y, lastX: p.x, lastY: p.y, lastT: performance.now() });
      if (!reduced) {
        s.mode = "held";
        s.wv = 0;
        held.ax = 0;
        s.targetX = null;
        s.onArrive = null;
        s.busy = false;
        lift();
        setFace("wow");
      }
    };
    // Letting go. Called from pointerup / pointercancel (on Kern and on the window), from a lost pointer capture, from
    // the window losing focus, and from a move with no button held: whichever arrives first, so Kern never stays stuck
    // to the cursor when one of those events goes missing.
    const release = (id: number) => {
      if (held.id === -1 || (id !== -1 && held.id !== id)) return;
      try {
        if (kern.hasPointerCapture(held.id)) kern.releasePointerCapture(held.id);
      } catch {}
      held.id = -1;
      const quick = !held.moved && performance.now() - held.downT < 350;
      if (s.mode === "held") {
        s.mode = "air";
        s.vx = clamp(s.vx, -2600, 2600);
        s.vy = clamp(s.vy, -2600, 2600);
        if (quick) {
          s.vx = 0;
          s.vy = 0;
        } else {
          setF(Math.hypot(s.vx, s.vy) > 900 ? "wow" : "happy");
          if (Math.hypot(s.vx, s.vy) > 1100) react("Wheeeee!", 1400);
        }
      }
      if (quick) poke();
    };
    const onUp = (e: PointerEvent) => release(e.pointerId);
    const onLost = (e: PointerEvent) => release(e.pointerId);
    const onBlur = () => release(-1);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onBlur);
    kern.addEventListener("lostpointercapture", onLost);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    kern.addEventListener("pointerdown", onDown);
    kern.addEventListener("pointerup", onUp);
    kern.addEventListener("pointercancel", onUp);
    kern.addEventListener("pointermove", onMove);
    const onWinMove = (e: PointerEvent) => {
      if (held.id !== -1) onMove(e);
    };
    window.addEventListener("pointermove", onWinMove);

    let visible = true;
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
    });
    io.observe(stage);

    // ---- loop
    const feet = { l: kern.querySelector("[data-foot='l']"), r: kern.querySelector("[data-foot='r']") };
    const hands = { l: kern.querySelector("[data-hand='l']"), r: kern.querySelector("[data-hand='r']") };
    const arms = { l: kern.querySelector("[data-arm='l']"), r: kern.querySelector("[data-arm='r']") };
    let raf = 0;
    let last = performance.now();
    let lastTag = "";
    let lastBubble = "";
    const G = 2600;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;

      if (s.mode !== "hidden") {
        const idle = now - s.lastInput;
        if (s.mode === "ground" && !reduced && !s.busy && !s.listening) {
          if (!s.sleeping && idle > 28000) {
            s.sleeping = true;
            setF("sleepy");
            react("Zzz… (designing in my sleep)", 4000);
          }
          const pdx = pointer.x - s.x;
          const pdy = pointer.y - (s.y - K / 2);
          const near = pointer.inside && Math.abs(pdx) < K * 0.9 && Math.abs(pdy) < K * 0.9;
          // A cursor that rushes right at Kern makes it jump back; one that rests on it tickles.
          if (near && pointer.speed > 1400 && now - s.startledAt > 2500 && !s.sleeping) {
            s.startledAt = now;
            setF("wow", 900);
            s.mode = "air";
            s.vy = -Math.sqrt(2 * G * K * 0.45);
            s.vx = -Math.sign(pdx || 1) * 260;
            s.targetX = null;
          } else if (near && pointer.speed < 200) {
            if (!s.hoverSince) s.hoverSince = now;
            if (now - s.hoverSince > 900 && now - s.tickleAt > 9000) {
              s.tickleAt = now;
              s.wiggleT = 0.8;
              setF("happy", 1600);
              if (Math.random() < 0.6) react(pick(["Hehe, that tickles.", "Personal space! …okay, fine.", "Are you trying to select me?"]), 1800);
            }
          } else s.hoverSince = 0;

          if (s.targetX === null && !s.sleeping) {
            // Walk over to a cursor that has come to rest a little way off, and stop beside it, not under it.
            const rested = pointer.inside && now - pointer.restSince > 260;
            if (rested && Math.abs(pdx) > K * 1.7 && idle < 5000) walkTo(pointer.x - Math.sign(pdx) * K * 0.95);
            else if (idle > 6000 && now - s.kernAt > 15000 && Math.random() < dt * 0.25) kernGap();
            else if (!pointer.inside && Math.random() < dt * 0.08) walkTo(s.x + (Math.random() - 0.5) * W * 0.4);
          }
        }
        if (s.mode === "ground" && s.targetX !== null) {
          const d = s.targetX - s.x;
          if (Math.abs(d) < 3 && Math.abs(s.wv) < 40) {
            s.targetX = null;
            s.wv = 0;
            const cb = s.onArrive;
            s.onArrive = null;
            cb?.();
          } else {
            s.facing = Math.sign(d) || s.facing;
            const top = s.busy ? 280 : 200;
            const want = Math.sign(d) * Math.min(top, Math.abs(d) * 4 + 20);
            s.wv += (want - s.wv) * Math.min(1, dt * (Math.abs(want) > Math.abs(s.wv) ? 5 : 9));
            const step = Math.abs(s.wv * dt) > Math.abs(d) ? d : s.wv * dt;
            const nx = s.x + step;
            const f = floorAt(nx, s.y - K * 0.9);
            if (f < s.y - 6) {
              s.mode = "air";
              s.vy = -Math.sqrt(2 * G * (s.y - f + K * 0.35));
              s.vx = Math.sign(d) * 170;
            }
            s.x = nx;
            s.walkT += dt * (4 + Math.abs(s.wv) / 26);
            if (Math.random() < dt * 3) hit(s.x, 0.35);
          }
        }

        if (s.mode === "held") {
          s.x += (pointer.x + held.dx - s.x) * Math.min(1, dt * 22);
          s.y += (pointer.y + held.dy - s.y) * Math.min(1, dt * 22);
          s.rotv += (clamp(s.vx * 0.01 - held.ax * 0.0025, -32, 32) - s.rot) * dt * 26;
          s.sq += (-0.12 - s.sq) * dt * 10;
        } else if (s.mode === "air") {
          s.vy += G * dt;
          s.x += s.vx * dt;
          const prevY = s.y;
          s.y += s.vy * dt;
          s.vx *= 1 - dt * 0.4;
          if (s.x < K / 2 || s.x > W - K / 2) {
            s.x = clamp(s.x, K / 2, W - K / 2);
            s.vx *= -0.5;
          }
          if (s.y < -K * 2) s.y = -K * 2;
          const f = floorAt(s.x, prevY - 2);
          if (s.vy > 0 && s.y >= f) {
            s.y = f;
            const v = s.vy;
            hit(s.x, clamp(v / 1400, 0.25, 1));
            s.sq = clamp(v / 2200, 0.08, 0.45);
            if (v > 900) {
              s.vy = -v * 0.32;
              thud(v);
            } else {
              s.vy = 0;
              s.vx = 0;
              s.mode = "ground";
              if (v > 250) thud(v);
            }
            s.spin = 0;
          }
        } else if (s.mode === "ground") {
          const f = floorAt(s.x, s.y - 4);
          if (f > s.y + 6) {
            s.mode = "air";
            s.vy = 0;
            s.vx = s.facing * 90;
          } else s.y = f;
          hit(s.x, 0.55);
        }

        // springs
        s.sqv += (-170 * s.sq - 12 * s.sqv) * dt;
        s.sq += s.sqv * dt;
        s.rotv += (-120 * s.rot - 10 * s.rotv) * dt;
        s.rot += s.rotv * dt;
        if (s.spin > 0) s.spin = Math.max(0, s.spin - dt * 1.4);
        if (s.stretchT > 0) s.stretchT = Math.max(0, s.stretchT - dt);
        if (s.wiggleT > 0) s.wiggleT = Math.max(0, s.wiggleT - dt);
        if (s.pose !== "idle" && now > s.poseUntil) s.pose = "idle";

        const walking = s.mode === "ground" && s.targetX !== null && Math.abs(s.wv) > 15;
        const bob = walking ? Math.abs(Math.sin(s.walkT)) * K * 0.08 : 0;
        const stretch = s.stretchT > 0 ? Math.sin((1 - s.stretchT / 1.1) * Math.PI) * 0.6 : 0;
        const airS = s.mode === "air" ? Math.min(0.12, Math.abs(s.vy) / 9000) : 0;
        const sx = 1 + s.sq * 0.9 - airS - stretch * 0.25;
        const sy = 1 - s.sq + airS + stretch;
        const wig = s.wiggleT > 0 ? Math.sin(s.wiggleT * 40) * 8 * s.wiggleT : 0;
        const breathe = s.sleeping ? Math.sin(now / 700) * 0.03 : walking ? 0 : Math.sin(now / 900) * 0.012;
        const curious = s.mode === "ground" && !walking && pointer.inside ? clamp((pointer.x - s.x) / Math.max(1, W) * 14, -5, 5) : 0;
        const rot = s.rot + wig + s.spin * 360 + (walking ? Math.sin(s.walkT) * 3 + s.wv * 0.025 : curious);
        kern.style.transform = `translate3d(${(s.x - K / 2).toFixed(1)}px, ${(s.y - K - bob).toFixed(1)}px, 0)`;
        body.style.transform = `rotate(${rot.toFixed(1)}deg) scale(${(sx - breathe).toFixed(3)}, ${(sy + breathe).toFixed(3)})`;

        // limbs: feet step, hands follow the pose (the arms are drawn from the frame corners to the hands)
        const step = walking ? Math.sin(s.walkT) * 6 : 0;
        feet.l?.setAttribute("transform", `translate(0 ${Math.min(0, step).toFixed(1)})`);
        feet.r?.setAttribute("transform", `translate(0 ${Math.min(0, -step).toFixed(1)})`);
        let hl = [0, 0];
        let hr = [0, 0];
        const t = now / 1000;
        if (s.mode === "held" || s.mode === "air") {
          hl = [-6, -12];
          hr = [6, -12];
        } else if (s.pose === "wave") {
          hr = [10 + Math.sin(t * 14) * 6, -20 + Math.cos(t * 14) * 3];
        } else if (s.pose === "up") {
          hl = [-8, -18];
          hr = [8, -18];
        } else if (s.pose === "point") {
          hr = [8, 34];
          hl = [-2, 4];
        }
        hands.l?.setAttribute("transform", `translate(${hl[0].toFixed(1)} ${hl[1].toFixed(1)})`);
        hands.r?.setAttribute("transform", `translate(${hr[0].toFixed(1)} ${hr[1].toFixed(1)})`);
        arms.l?.setAttribute("x2", String(-4 + hl[0]));
        arms.l?.setAttribute("y2", String(-4 + hl[1]));
        arms.r?.setAttribute("x2", String(104 + hr[0]));
        arms.r?.setAttribute("y2", String(-4 + hr[1]));

        // eyes follow the cursor, or whatever Kern is curious about
        let lx = pointer.x;
        let ly = pointer.y;
        if (s.lookAt) {
          const r = s.lookAt.getBoundingClientRect();
          const sr = stage.getBoundingClientRect();
          lx = (r.left + r.width / 2 - sr.left) / scale;
          ly = (r.top + r.height / 2 - sr.top) / scale;
        }
        const dx = lx - s.x;
        const dy = ly - (s.y - K / 2);
        const dl = Math.hypot(dx, dy) || 1;
        let tx = 0;
        let ty = 0;
        if (pointer.inside || s.lookAt || now - pointer.leftAt < 1200) {
          const reach = 3.2 * Math.min(1, dl / (K * 0.8)); // a cursor right on top of Kern makes it look almost straight on
          tx = (dx / dl) * reach;
          ty = (dy / dl) * reach;
        } else {
          // nobody around: little glances here and there
          if (now > s.saccadeAt) {
            s.saccadeAt = now + 900 + Math.random() * 2600;
            s.idleLook = { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 3 };
          }
          tx = s.idleLook.x;
          ty = s.idleLook.y;
        }
        // eyes move fast (a saccade), not a drift
        const ek = Math.min(1, dt * 18);
        s.look.x += (tx - s.look.x) * ek;
        s.look.y += (ty - s.look.y) * ek;
        kern.querySelectorAll("[data-pupil]").forEach((p) => p.setAttribute("transform", `translate(${s.look.x.toFixed(2)} ${s.look.y.toFixed(2)})`));
        if (lookRef.current) {
          const blink = now > s.blinkAt && now < s.blinkAt + 130;
          if (now > s.blinkAt + 130) s.blinkAt = now + 2200 + Math.random() * 3800;
          lookRef.current.style.transform = blink ? "scaleY(0.12)" : "";
        }

        // the size tag under it; during the kerning bit it shows the kerning value instead
        const tagEl = tagRef.current;
        const tag = tagEl?.dataset.kern !== undefined ? `kern ${tagEl.dataset.kern}` : `${Math.round(K * sx)} × ${Math.round(K * sy)}`;
        if (tag !== lastTag && tagEl) {
          lastTag = tag;
          tagEl.textContent = tag;
        }
        const bub = bubbleRef.current;
        if (bub) {
          const bw = bub.offsetWidth;
          const bx = clamp(s.x, bw / 2 + 4, W - bw / 2 - 4);
          const by = s.y - K * sy - bob - 18;
          const pos = `${bx.toFixed(0)},${by.toFixed(0)},${bw}`;
          if (pos !== lastBubble) {
            lastBubble = pos;
            bub.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0) translate(-50%, -100%)`;
            bub.style.setProperty("--tail", `${clamp(s.x - bx + bw / 2, 18, bw - 18).toFixed(0)}px`);
          }
        }
      }

      // letters: spring their push, and set weight from the cursor and Kern's pressure
      letters.forEach((el, i) => {
        ov[i] += (-180 * (ox[i] - otarget[i]) - 16 * ov[i]) * dt;
        ox[i] += ov[i] * dt;
        press[i] *= Math.exp(-dt * 2.2);
        const b = boxes[i];
        let near = 0;
        if (pointer.inside && b) {
          const d = Math.hypot(pointer.x - (b.x + ox[i] + b.w / 2), pointer.y - (b.top + fs * 0.3)) / fs;
          near = Math.max(0, 1 - d / 1.4);
        }
        const w = clamp(420 + near * 220 + press[i] * 480, 300, 900);
        const cur = Number(el.dataset.w || 420);
        const nw = cur + (w - cur) * Math.min(1, dt * 12);
        el.dataset.w = String(nw);
        const fw = String(Math.round(nw / 4) * 4);
        if (el.style.fontWeight !== fw) el.style.fontWeight = fw;
        const tr = Math.abs(ox[i]) > 0.2 ? `translateX(${ox[i].toFixed(1)}px)` : "";
        if (el.style.transform !== tr) el.style.transform = tr;
      });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(asideTimer);
      window.clearTimeout(faceTimer);
      ro.disconnect();
      io.disconnect();
      kern.removeEventListener("kern:enter", enter);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      kern.removeEventListener("pointerdown", onDown);
      kern.removeEventListener("pointerup", onUp);
      kern.removeEventListener("pointercancel", onUp);
      kern.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointermove", onWinMove);
      kern.removeEventListener("lostpointercapture", onLost);
      api.current = null;
    };
  }, []);

  useEffect(() => {
    if (entered) kernRef.current?.dispatchEvent(new Event("kern:enter"));
  }, [entered]);

  // While the bubble offers choices, Kern stands still and listens.
  useEffect(() => {
    nodeRef.current = node;
    const asking = node === "work" || (node !== null && NODES[node].chips.length > 0);
    api.current?.listen(asking);
    if (!asking || typing || thinking) return;
    // Nobody answered: tuck the bubble away and let Kern get on with its day (poking Kern brings it back).
    const t = window.setTimeout(() => setNode(null), 20000);
    return () => window.clearTimeout(t);
  }, [node, workIdx, typing, thinking, chat]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      uiSound("click");
      setNode("copied");
      api.current?.cheer();
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.assign(`mailto:${site.email}`);
    }
  };

  const ask = async (question: string) => {
    const q = question.trim().slice(0, 300);
    if (!q || thinking) return;
    uiSound("click");
    setDraft("");
    setNode("chat");
    setThinking(true);
    setFace("wow");
    api.current?.pose("up", 1400);
    setChat([...chat, { role: "user", content: q }, { role: "assistant", content: "" }]);
    const write = (fn: (prev: string) => string) =>
      setChat((c) => {
        const next = c.slice();
        next[next.length - 1] = { role: "assistant", content: fn(next[next.length - 1].content) };
        return next;
      });
    // Kern's own brain (src/components/kern/kern-brain.ts): free, offline, nothing leaves the browser.
    // A short pause to "think", then the reply types itself out.
    const { text: reply, action } = answer(q);
    try {
      await new Promise((r) => window.setTimeout(r, 450 + Math.random() * 400));
      setFace("happy");
      for (let i = 0; i < reply.length; i += 3) {
        const part = reply.slice(i, i + 3);
        write((prev) => prev + part);
        await new Promise((r) => window.setTimeout(r, 18));
      }
      if (action === "work") {
        setNode("work");
        api.current?.cheer();
      } else if (action === "hire") api.current?.goTo(hireRef.current);
      else if (action) api.current?.act(action);
    } finally {
      setThinking(false);
      window.setTimeout(() => setFace("open"), 1600);
    }
  };

  const choose = (c: Chip) => {
    uiSound("click");
    if (c.go) {
      setNode(c.go);
      api.current?.pose("wave", 900);
      return;
    }
    if (c.act === "tour") api.current?.tour();
    else if (c.act === "copy") void copyEmail();
    else if (c.act === "hire") api.current?.goTo(hireRef.current, () => router.push("/contact"));
    else if (c.act === "work") {
      setNode("work");
      api.current?.cheer();
    } else if (c.act === "all") api.current?.goTo(workRef.current, toWork);
    else if (c.act === "prev") setWorkIdx((i) => (i + WORK.length - 1) % WORK.length);
    else if (c.act === "next") setWorkIdx((i) => (i + 1) % WORK.length);
  };

  const p = WORK[workIdx];
  const ext = projectsOpenOnBehance() ? ({ target: "_blank", rel: "noopener noreferrer" } as const) : {};
  const line = node ? NODES[node] : null;
  const chip =
    "rounded-full px-3 py-1.5 text-[0.8125rem] font-medium tracking-tight ring-1 ring-paper/30 transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-butter";

  let idx = 0;
  return (
    <div
      className="relative overflow-hidden rounded-b-[1.5rem] bg-cobalt px-4 pb-4 pt-[5.25rem] text-paper md:rounded-b-[2rem] md:px-6 md:pb-6 md:pt-[5.75rem]"
      style={{ backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--paper) 16%, transparent) 1px, transparent 1.5px)", backgroundSize: "24px 24px" }}
    >
      <div className="group/hero mx-auto w-full max-w-[100vw]" data-entered={entered}>
        <section aria-label="Introduction" className="flex h-[calc(100svh-7.5rem)] min-h-[34rem] flex-col justify-between gap-4 md:h-[calc(100svh-8.75rem)]">
          <div className="label flex items-center justify-between text-paper/70">
            <span>Portfolio · 2026</span>
            <span>India · {time} IST</span>
          </div>

          {/* The stage: the name, with Kern living on it; the space above is where Kern talks */}
          <div ref={stageRef} className="relative flex min-h-0 flex-1 select-none flex-col justify-end pb-[2svh]" style={{ touchAction: "pan-y" }}>
            <h1 className="v7-name relative leading-[0.86] tracking-[-0.045em] text-paper">
              <span className="sr-only">Parv Marwaha</span>
              {LINES.map((ln) => (
                <span key={ln} className="block whitespace-nowrap md:inline md:[&:not(:last-child)]:mr-[0.22em]" aria-hidden>
                  {ln.split("").map((ch) => {
                    const i = idx++;
                    return (
                      <span
                        key={i}
                        ref={(el) => {
                          letterRefs.current[i] = el;
                        }}
                        className="inline-block will-change-transform"
                        style={{ fontWeight: 420 }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </span>
              ))}
            </h1>

            <div ref={confettiRef} className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden />

            {/* Kern's speech bubble: what it says, plus reply chips */}
            <div ref={bubbleRef} className="absolute left-0 top-0 z-20 w-[min(26rem,calc(100vw-2rem))]" aria-live="polite">
              {(aside || line) && (
                <div
                  key={aside ? `a-${aside}` : (node ?? "")}
                  className="relative rounded-[1.25rem] bg-ink p-4 text-paper shadow-[0_22px_44px_-18px_rgba(0,0,0,0.6)] ring-1 ring-paper/10 motion-safe:animate-[kern-pop_0.34s_cubic-bezier(.2,1.4,.4,1)]"
                >
                  {aside ? (
                    <p className="text-[0.9375rem] font-medium leading-snug tracking-tight">{aside}</p>
                  ) : node === "work" ? (
                    <div className="flex gap-3">
                      <a href={projectHref(p)} {...ext} className="relative block aspect-[4/3] w-[8.5rem] shrink-0 overflow-hidden rounded-lg" style={{ background: p.accent }} data-cursor-label="Open">
                        <RemoteImage key={p.slug} src={p.image} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />
                      </a>
                      <div className="flex min-w-0 flex-col justify-between">
                        <div>
                          <p className="label text-paper/60">
                            {String(workIdx + 1).padStart(2, "0")} / {String(WORK.length).padStart(2, "0")}
                          </p>
                          <p className="mt-1 truncate text-[1rem] font-semibold tracking-tight">{p.title}</p>
                          <p className="text-[0.8125rem] text-paper/70">
                            {p.kind ?? p.type} · {p.year}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button type="button" className={chip} onClick={() => choose({ label: "", act: "prev" })} aria-label="Previous project">
                            ←
                          </button>
                          <button type="button" className={chip} onClick={() => choose({ label: "", act: "next" })} aria-label="Next project">
                            →
                          </button>
                          <a href={projectHref(p)} {...ext} className={chip}>
                            Open ↗
                          </a>
                          <button type="button" className={chip} onClick={() => choose({ label: "", act: "all" })}>
                            All ↓
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : node === "chat" ? (
                    <>
                      <p className="mb-1.5 truncate text-[0.75rem] text-paper/50">You: {chat[chat.length - 2]?.content}</p>
                      <p className="max-h-[11rem] overflow-y-auto text-[0.9375rem] font-medium leading-snug tracking-tight" data-lenis-prevent>
                        {chat[chat.length - 1]?.content || (
                          <span className="inline-flex gap-1" aria-label="Kern is thinking">
                            {[0, 1, 2].map((i) => (
                              <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-paper/70" style={{ animationDelay: `${i * 120}ms` }} />
                            ))}
                          </span>
                        )}
                      </p>
                      {!thinking && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {NODES.chat.chips.map((c) => (
                            <button key={c.label} type="button" className={chip} onClick={() => choose(c)}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[0.9375rem] font-medium leading-snug tracking-tight">{line?.text}</p>
                      {line && line.chips.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {line.chips.map((c) => (
                            <button key={c.label} type="button" className={chip} onClick={() => choose(c)}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {/* ask anything: answered by Kern's offline brain */}
                  {!aside && node !== "work" && !(node && node.startsWith("t") && node !== "t4") && (
                    <form
                      className="mt-3 flex items-center gap-1.5 border-t border-paper/10 pt-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void ask(draft);
                      }}
                    >
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onFocus={() => setTyping(true)}
                        onBlur={() => setTyping(false)}
                        maxLength={300}
                        placeholder={chat.length ? "Ask something else…" : "Ask Kern anything about Parv…"}
                        aria-label="Ask Kern a question"
                        className="min-w-0 flex-1 select-text rounded-full bg-paper/10 px-3.5 py-2 text-[0.875rem] text-paper outline-none placeholder:text-paper/45 focus:ring-1 focus:ring-butter"
                        data-cursor-label="Type"
                      />
                      <button
                        type="submit"
                        disabled={thinking || !draft.trim()}
                        aria-label="Send"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-butter text-ink transition-opacity disabled:opacity-40"
                      >
                        ↑
                      </button>
                    </form>
                  )}
                  <span className="absolute -bottom-1.5 h-3 w-3 -translate-x-1/2 rotate-45 bg-ink" style={{ left: "var(--tail, 50%)" }} />
                </div>
              )}
            </div>

            <button
              ref={kernRef}
              type="button"
              aria-label="Kern, Parv's design buddy. Press to poke; arrow keys walk."
              data-cursor-label="Grab me"
              className="absolute left-0 top-0 z-10 cursor-grab touch-none opacity-0 outline-none focus-visible:[&_svg]:drop-shadow-[0_0_0_3px_var(--vermilion)] active:cursor-grabbing"
              style={{ transition: "opacity .3s" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  api.current?.poke();
                } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  e.preventDefault();
                  api.current?.walk(e.key === "ArrowLeft" ? -1 : 1);
                }
              }}
            >
              <div ref={bodyRef} className="h-full w-full origin-bottom will-change-transform">
                <KernArt face={face} lookRef={lookRef} />
              </div>
              <span
                ref={tagRef}
                className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-[0.1875rem] bg-paper px-1.5 py-0.5 text-[0.625rem] font-medium leading-none tracking-normal text-cobalt tabular-nums"
              />
            </button>
          </div>

          {/* Who, availability and the ways forward: one calm row on desktop, stacked on a phone */}
          <div className="flex flex-col gap-4 border-t border-paper/20 pt-4 md:flex-row md:items-center md:justify-between md:gap-8 md:pt-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
              <p className="max-w-[24rem] text-balance text-[1.0625rem] font-medium leading-snug tracking-tight text-paper md:text-[1.1875rem]">
                <em className="font-display text-[1.15em] font-normal italic text-butter">Designer</em> for UI/UX, brand identity and motion, who ships the code too.
              </p>
              <p className="flex w-fit items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.8125rem] font-medium tracking-tight text-paper ring-1 ring-paper/25">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-butter" style={{ animation: "pin-pulse 2s ease-out infinite" }} />
                  <span className="relative h-2 w-2 rounded-full bg-butter" />
                </span>
                {site.availability}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Magnetic>
                <Link
                  ref={hireRef}
                  href="/contact"
                  onPointerEnter={() => {
                    api.current?.look(hireRef.current);
                    api.current?.react("Ooh, the good button.", 1800, "happy");
                  }}
                  onPointerLeave={() => api.current?.look(null)}
                  className="block rounded-full bg-vermilion px-6 py-3 text-[0.9375rem] font-semibold tracking-normal text-white transition-transform hover:scale-[1.04]"
                  data-cursor-label="Let's talk"
                >
                  Hire me ↗
                </Link>
              </Magnetic>
              <button
                ref={workRef}
                type="button"
                onClick={toWork}
                onPointerEnter={() => {
                  api.current?.look(workRef.current);
                  api.current?.react("His work is right below. I checked, it's good.", 2200);
                }}
                onPointerLeave={() => api.current?.look(null)}
                className="rounded-full px-6 py-3 text-[0.9375rem] font-medium tracking-normal text-paper ring-1 ring-paper/40 transition-colors hover:bg-paper hover:text-cobalt"
              >
                See the work ↓
              </button>
              <button type="button" onClick={copyEmail} className="rounded-full px-4 py-3 text-[0.875rem] font-medium tracking-normal text-paper/70 transition-colors hover:text-paper" data-cursor-label="Copy">
                {copied ? "Copied ✓" : "Copy email"}
              </button>
            </div>
          </div>
        </section>
      </div>
      <style>{`
        .v7-name{font-size:min(20vw,8rem)}
        @media (min-width:768px){.v7-name{font-size:min(calc((100vw - 3rem) / 5.9),calc(100svh - 23rem))}}
        @keyframes kern-pop{from{opacity:0;transform:translateY(8px) scale(.92)}to{opacity:1;transform:none}}
      `}</style>
    </div>
  );
}
