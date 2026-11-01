"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { projectHref, projects, projectsOpenOnBehance, getProject } from "@/content/projects";
import { duckMusic, gameSound, toggleAmbient, useAmbient } from "@/utils/ambient";
import { Game, LEVELS, setPalette, type GameState } from "./engine";

const BEST_KEY = "pm-break-best";
// The board's width in game units is fixed; its height follows the shape of your screen (decided once, when the
// page opens), so the game fills a wide monitor or a tall phone instead of sitting in a small window.
const LAND_W = 960;
const PORT_W = 520;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const noop = () => () => {};
// The score bar above the board, and the gap between it and the board.
const HUD_H = 56;
const HUD_GAP = 12;
const PROJECT_LIST = projects.map(({ slug, title }) => ({ slug, title }));

const toggleFullscreen = (el: HTMLElement | null) => {
  if (!el) return;
  if (document.fullscreenElement) void document.exitFullscreen();
  else void el.requestFullscreen?.();
};

const initial: GameState = { score: 0, best: 0, lives: 3, level: 1, levels: LEVELS.length, levelName: LEVELS[0].name, status: "ready", combo: 0, mult: 1, found: [] };

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
  const bestRef = useRef(0);

  const [state, setState] = useState<GameState>(initial);
  const [portrait, setPortrait] = useState(false);
  const soundOn = useAmbient();
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
  const boardH = box.h - HUD_H - HUD_GAP;
  if (box.w > 0 && boardH > 0 && (!lock || lock.portrait !== portrait)) {
    setLock({ portrait, aspect: portrait ? clamp(box.w / boardH, 0.5, 0.8) : clamp(box.w / boardH, 1.3, 2.2) });
  }
  const dims = portrait
    ? { w: PORT_W, h: Math.round(PORT_W / (lock?.aspect ?? 0.667)) }
    : { w: LAND_W, h: Math.round(LAND_W / (lock?.aspect ?? 1.6)) };
  const scale = box.w > 0 && boardH > 0 ? Math.min(box.w / dims.w, boardH / dims.h) : 0;

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

  // The music steps back a little while you play, so the effects carry.
  useEffect(() => {
    duckMusic(0.5);
    return () => duckMusic(1);
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
      projects: PROJECT_LIST,
      onState: (s) => {
        setState(s);
        if (s.best > bestRef.current) {
          bestRef.current = s.best;
          try {
            localStorage.setItem(BEST_KEY, String(s.best));
          } catch {}
        }
      },
      onSound: gameSound,
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
  }, [dims.w, dims.h]);

  const toLogical = (clientX: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * dims.w;
  };

  const over = state.status === "won" || state.status === "lost";
  const fresh = state.status === "ready" && state.score === 0 && state.level === 1;
  const shape = scale
    ? { width: dims.w * scale, height: dims.h * scale }
    : { width: "100%", aspectRatio: `${dims.w} / ${dims.h}` };

  const slots = Math.max(3, state.lives);
  const found = state.found.map((slug) => getProject(slug)).filter((x) => x !== undefined);
  const external = projectsOpenOnBehance();

  return (
    <div ref={shellRef} className="fixed inset-0 z-20 select-none overflow-hidden bg-deep text-on-deep">
      {/* The play area: the whole screen, apart from the top bar and a thin strip of controls underneath */}
      <div
        ref={regionRef}
        className={`absolute inset-x-3 bottom-14 flex touch-none flex-col items-center justify-center md:inset-x-5 ${fs ? "top-0" : "top-[4.5rem]"}`}
        style={{ gap: HUD_GAP }}
        onPointerMove={(e) => gameRef.current?.setPointer(toLogical(e.clientX))}
        onPointerDown={(e) => {
          gameRef.current?.setPointer(toLogical(e.clientX));
          gameRef.current?.launch();
        }}
        data-cursor-label="Move"
      >
        {/* Score bar, the same width as the board */}
        <div className="flex items-center justify-between px-1" style={{ width: shape.width, height: HUD_H }}>
          <div className="flex items-baseline gap-3">
            <div>
              <p className="label opacity-60">Score</p>
              <p className="mt-1 text-3xl font-medium leading-none tracking-tighter tabular-nums md:text-4xl">{String(state.score).padStart(4, "0")}</p>
            </div>
            <p className="label hidden opacity-50 sm:block">Best {String(state.best).padStart(4, "0")}</p>
          </div>
          <div className="text-center">
            <p className="label opacity-60">
              Level {state.level}/{state.levels}
            </p>
            <p className="mt-1 font-display text-xl italic leading-none text-spark md:text-2xl">{state.levelName}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="label opacity-60" title="Project bricks uncovered">
              ★ {state.found.length}/{projects.length}
            </p>
            <p className="flex gap-1.5">
              {Array.from({ length: slots }, (_, i) => (
                <span key={i} className={`h-3 w-3 rounded-full ring-1 transition-all ${i < state.lives ? "bg-vermilion ring-vermilion" : "ring-on-deep/40"}`} />
              ))}
            </p>
          </div>
        </div>

        <div
          ref={stageRef}
          className="relative overflow-hidden rounded-[0.875rem] bg-[color-mix(in_srgb,var(--on-deep)_5%,var(--deep))] ring-1 ring-on-deep/15"
          style={shape}
          role="application"
          aria-label="Break the Grid game. Move with the mouse, touch or arrow keys. Press Space to launch."
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

          {fresh && !over && (
            <div className="pointer-events-none absolute inset-x-0 top-[62%] -translate-y-1/2 px-6 text-center">
              <p className="label mb-3 opacity-70">Off hours · a tiny game</p>
              <h2 className="text-6xl font-medium leading-[0.9] tracking-tighter md:text-8xl">
                Break the <em className="font-display italic text-spark">grid.</em>
              </h2>
              <p className="label mt-5 opacity-80">
                <span className="hidden md:inline">Move to aim · click or press Space to launch</span>
                <span className="md:hidden">Drag to move · tap to launch</span>
              </p>
              <p className="label mx-auto mt-4 max-w-xl leading-relaxed opacity-55">
                Catch capsules: W wide · x3 more balls · S slow · F fireball · L lasers · +1 life. Break the ★ bricks to uncover my work.
              </p>
            </div>
          )}

          {state.status === "ready" && !fresh && !over && (
            <div className="pointer-events-none absolute inset-x-0 top-[74%] -translate-y-1/2 px-6 text-center">
              <p className="label mb-2 opacity-70">
                Level {state.level} of {state.levels}
              </p>
              <p className="font-display text-4xl italic leading-none text-spark md:text-6xl">{state.levelName}</p>
              <p className="label mt-4 opacity-80">
                <span className="hidden md:inline">Move to aim · click or press Space to launch</span>
                <span className="md:hidden">Drag to move · tap to launch</span>
              </p>
            </div>
          )}

          {state.status === "clear" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="font-display text-5xl italic text-spark md:text-7xl">Level cleared</p>
            </div>
          )}

          {paused && !over && (
            <button
              type="button"
              onClick={() => {
                if (gameRef.current) gameRef.current.paused = false;
                setPaused(false);
              }}
              className="absolute inset-0 flex items-center justify-center bg-deep/70"
            >
              <span className="label text-on-deep">
                Paused · <span className="pointer-coarse:hidden">press P</span>
                <span className="hidden pointer-coarse:inline">tap to play</span>
              </span>
            </button>
          )}

          {over && (
            <div className="absolute inset-0 flex items-center justify-center bg-deep/85 p-6 backdrop-blur-[2px]">
              <div className="max-w-md text-center text-on-deep">
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
                {found.length > 0 && (
                  <div className="mt-6">
                    <p className="label mb-2.5 opacity-60">Work you uncovered</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {found.map((pr) => (
                        <a
                          key={pr.slug}
                          href={projectHref(pr)}
                          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          className="rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium tracking-normal ring-1 ring-on-deep/35 transition-colors hover:bg-on-deep hover:text-deep"
                        >
                          {pr.title} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}
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
            onClick={toggleAmbient}
            data-sound-toggle
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
