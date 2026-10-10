"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Game, LEVELS, setPalette, type GameState, type Sound } from "./engine";

const BEST_KEY = "pm-break-best";
// The board's width in game units is fixed; its height follows the shape of your screen (decided once, when the
// page opens), so the game fills a wide monitor or a tall phone instead of sitting in a small window.
const LAND_W = 960;
const PORT_W = 520;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const noop = () => () => {};

const toggleFullscreen = (el: HTMLElement | null) => {
  if (!el) return;
  if (document.fullscreenElement) void document.exitFullscreen();
  else void el.requestFullscreen?.();
};

const initial: GameState = { score: 0, best: 0, lives: 3, level: 1, levels: LEVELS.length, status: "ready", combo: 0, wide: false };

/**
 * Break the Grid, full screen: move the paddle (mouse, touch or arrow keys), click or press Space to launch,
 * F for the browser's own full screen.
 */
export default function BreakGame() {
  const shellRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const soundOnRef = useRef(false);
  const bestRef = useRef(0);

  const [state, setState] = useState<GameState>(initial);
  const [portrait, setPortrait] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [fs, setFs] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [lock, setLock] = useState<{ portrait: boolean; aspect: number } | null>(null);
  const canFullscreen = useSyncExternalStore(
    noop,
    () => document.fullscreenEnabled,
    () => false
  );

  // The board takes the shape of the play area the first time it is measured, and keeps it (so going full
  // screen later does not restart a game in progress).
  if (box.w > 0 && box.h > 0 && (!lock || lock.portrait !== portrait)) {
    setLock({ portrait, aspect: portrait ? clamp(box.w / box.h, 0.5, 0.8) : clamp(box.w / box.h, 1.3, 2.2) });
  }
  const dims = portrait
    ? { w: PORT_W, h: Math.round(PORT_W / (lock?.aspect ?? 0.667)) }
    : { w: LAND_W, h: Math.round(LAND_W / (lock?.aspect ?? 1.6)) };
  const scale = box.w > 0 ? Math.min(box.w / dims.w, box.h / dims.h) : 0;

  useEffect(() => {
    const el = regionRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const on = () => setFs(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  // Orientation follows the viewport, so phones get a tall board.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setPortrait(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const playSound = useCallback((kind: Sound) => {
    if (!soundOnRef.current) return;
    const ctx = audioRef.current;
    if (!ctx) return;
    const tone = (freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    };
    if (kind === "paddle") tone(220, 0.07, "triangle", 0.09);
    else if (kind === "brick") tone(520 + Math.random() * 120, 0.09, "square", 0.05);
    else if (kind === "tough") tone(180, 0.08, "square", 0.05);
    else if (kind === "wall") tone(300, 0.04, "triangle", 0.04);
    else if (kind === "power") tone(440, 0.22, "sine", 0.08, 880);
    else if (kind === "lose") tone(320, 0.45, "sawtooth", 0.06, 70);
    else tone(520, 0.4, "triangle", 0.08, 1040);
  }, []);

  // The board wears the site's colours, and follows them when the theme is changed.
  useEffect(() => {
    const sync = () => {
      const cs = getComputedStyle(document.documentElement);
      const v = (name: string) => cs.getPropertyValue(name).trim();
      setPalette({ a: v("--cobalt"), b: v("--vermilion"), c: v("--spark"), d: v("--on-deep"), ink: v("--deep"), font: getComputedStyle(document.body).fontFamily });
    };
    sync();
    window.addEventListener("pm:theme", sync);
    return () => window.removeEventListener("pm:theme", sync);
  }, []);

  // Build a fresh game whenever the orientation changes.
  useEffect(() => {
    let best = 0;
    try {
      best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {}
    bestRef.current = best;
    const game = new Game({
      w: dims.w,
      h: dims.h,
      best,
      onState: (s) => {
        setState(s);
        if (s.best > bestRef.current) {
          bestRef.current = s.best;
          try {
            localStorage.setItem(BEST_KEY, String(s.best));
          } catch {}
        }
      },
      onSound: playSound,
    });
    gameRef.current = game;

    const canvas = canvasRef.current!;
    const stage = stageRef.current!;
    const ctx = canvas.getContext("2d")!;
    const fit = () => {
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      const s = (r.width / dims.w) * dpr;
      ctx.setTransform(s, 0, 0, s, 0, 0);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    fit();

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      game.update(dt);
      game.draw(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const keys = { left: false, right: false };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = down;
      else if (k === "ArrowRight" || k === "d" || k === "D") keys.right = down;
      else if (down && (k === " " || k === "Enter")) {
        e.preventDefault();
        game.launch();
      } else if (down && (k === "f" || k === "F")) toggleFullscreen(shellRef.current);
      else if (down && (k === "r" || k === "R")) game.restart();
      else if (down && (k === "p" || k === "P")) {
        game.paused = !game.paused;
        setPaused(game.paused);
      } else return;
      if (k.startsWith("Arrow")) e.preventDefault();
      game.setKeys(keys.left, keys.right);
    };
    const kd = onKey(true);
    const ku = onKey(false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    const onVis = () => {
      game.paused = document.hidden;
      setPaused(game.paused);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      document.removeEventListener("visibilitychange", onVis);
      gameRef.current = null;
    };
  }, [dims.w, dims.h, playSound]);

  const toLogical = (clientX: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * dims.w;
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundOnRef.current = next;
    if (next) {
      audioRef.current ??= new AudioContext();
      void audioRef.current.resume();
      playSound("power");
    }
  };

  const over = state.status === "won" || state.status === "lost";
  const fresh = state.status === "ready" && state.score === 0 && state.level === 1;
  const shape = scale
    ? { width: dims.w * scale, height: dims.h * scale }
    : { width: "100%", aspectRatio: `${dims.w} / ${dims.h}` };

  return (
    <div ref={shellRef} className="fixed inset-0 z-20 select-none overflow-hidden bg-deep text-on-deep">
      {/* The play area: the whole screen, apart from the top bar and a thin strip of controls underneath */}
      <div
        ref={regionRef}
        className={`absolute inset-x-0 bottom-14 flex touch-none items-center justify-center ${fs ? "top-0" : "top-[4.5rem]"}`}
        onPointerMove={(e) => gameRef.current?.setPointer(toLogical(e.clientX))}
        onPointerDown={(e) => {
          gameRef.current?.setPointer(toLogical(e.clientX));
          gameRef.current?.launch();
        }}
        data-cursor-label="Move"
      >
        <div
          ref={stageRef}
          className="relative overflow-hidden rounded-[0.875rem] bg-[color-mix(in_srgb,var(--on-deep)_5%,var(--deep))] ring-1 ring-on-deep/15"
          style={shape}
          role="application"
          aria-label="Break the Grid game. Move with the mouse, touch or arrow keys. Press Space to launch."
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

          {/* HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 md:p-6">
            <div>
              <p className="label opacity-60">Score</p>
              <p className="mt-1 text-3xl font-medium leading-none tracking-tighter tabular-nums md:text-4xl">{String(state.score).padStart(4, "0")}</p>
            </div>
            <div className="text-center">
              <p className="label opacity-60">Level</p>
              <p className="mt-1 text-lg font-medium leading-none tabular-nums md:text-xl">
                {state.level}/{state.levels}
              </p>
            </div>
            <div className="text-right">
              <p className="label opacity-60">Lives · Best {String(state.best).padStart(4, "0")}</p>
              <p className="mt-2 flex justify-end gap-1.5">
                {Array.from({ length: 3 }, (_, i) => (
                  <span key={i} className={`h-3 w-3 rounded-full ring-1 ring-on-deep/60 ${i < state.lives ? "bg-vermilion ring-vermilion" : ""}`} />
                ))}
              </p>
            </div>
          </div>

          {fresh && !over && (
            <div className="pointer-events-none absolute inset-x-0 top-[66%] -translate-y-1/2 px-6 text-center">
              <p className="label mb-3 opacity-70">Off hours · a tiny game</p>
              <h2 className="text-6xl font-medium leading-[0.9] tracking-tighter md:text-8xl">
                Break the <em className="font-display italic text-spark">grid.</em>
              </h2>
              <p className="label mt-5 opacity-80">
                <span className="hidden md:inline">Move to aim · click or press Space to launch</span>
                <span className="md:hidden">Drag to move · tap to launch</span>
              </p>
            </div>
          )}

          {state.status === "ready" && !fresh && !over && (
            <p className="label pointer-events-none absolute inset-x-0 bottom-[4.875rem] text-center text-on-deep/80 md:bottom-[5.75rem]">
              <span className="hidden md:inline">Move to aim · click or press Space to launch</span>
              <span className="md:hidden">Drag to move · tap to launch</span>
            </p>
          )}

          {state.status === "clear" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="font-display text-5xl italic text-spark md:text-7xl">Level cleared</p>
            </div>
          )}

          {paused && !over && (
            <div className="absolute inset-0 flex items-center justify-center bg-deep/70">
              <p className="label text-on-deep">Paused · press P</p>
            </div>
          )}

          {over && (
            <div className="absolute inset-0 flex items-center justify-center bg-deep/85 p-6 backdrop-blur-[2px]">
              <div className="max-w-sm text-center text-on-deep">
                <p className="label mb-4 opacity-70">
                  Score {state.score} · Best {state.best}
                </p>
                <p className="text-5xl font-medium leading-[0.95] tracking-tighter md:text-6xl">
                  {state.status === "won" ? (
                    <>
                      You broke <em className="font-display italic text-spark">HIRE ME.</em>
                    </>
                  ) : (
                    <>
                      Out of <em className="font-display italic text-spark">lives.</em>
                    </>
                  )}
                </p>
                <p className="mt-4 text-[0.9375rem] leading-snug text-on-deep/75">
                  {state.status === "won" ? "Fine. You can hire me anyway." : "Good run. You could still hire me."}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => gameRef.current?.restart()}
                    className="rounded-full bg-on-deep px-6 py-3 text-[0.875rem] font-semibold tracking-normal text-deep transition-transform hover:scale-[1.04]"
                  >
                    {state.status === "won" ? "Play again" : "Try again"}
                  </button>
                  <Link
                    href="/contact"
                    className="rounded-full bg-vermilion px-6 py-3 text-[0.875rem] font-semibold tracking-normal text-white transition-transform hover:scale-[1.04]"
                  >
                    Hire me ↗
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls strip */}
      <div className="label absolute inset-x-0 bottom-0 flex h-14 items-center justify-between gap-3 px-4 text-on-deep/60 md:px-6">
        <span className="hidden md:block">Arrow keys or mouse · Space launches · P pauses · R restarts · F full screen</span>
        <span className="flex items-center gap-2 max-md:ml-auto">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="whitespace-nowrap rounded-full px-3 py-1.5 ring-1 ring-on-deep/25 transition-colors hover:text-on-deep hover:ring-on-deep/60 md:px-4"
          >
            Sound {soundOn ? "on" : "off"}
          </button>
          {canFullscreen && (
            <button
              type="button"
              onClick={() => toggleFullscreen(shellRef.current)}
              aria-pressed={fs}
              className="whitespace-nowrap rounded-full px-3 py-1.5 ring-1 ring-on-deep/25 transition-colors hover:text-on-deep hover:ring-on-deep/60 md:px-4"
            >
              {fs ? "Exit full screen" : "Full screen"}
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
