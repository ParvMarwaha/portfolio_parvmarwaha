"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { displayTitle, projectHref, projects, linkTarget } from "@/content/projects";
import RemoteImage from "@/components/ui/RemoteImage";
import { useEntered } from "@/components/home/hero/shared";
import { ClawView, type ClawItem } from "./v2-view";
import { CLAW_CSS } from "./v2-style";

const ITEMS: ClawItem[] = projects.map((p) => ({ title: p.title, accent: p.accent, image: p.image }));

const IDLE_TEXT = "Grab a project";

const bulbs = (shift: string) => ({
  backgroundImage: "radial-gradient(circle, var(--spark) 0 26%, transparent 34%)",
  backgroundSize: "4.4cqw 100%",
  backgroundPosition: `${shift} 0`,
  backgroundRepeat: "repeat-x" as const,
});

/** The wooden-ish, painted, slightly worn cabinet: everything in it is sized in cqw, so it is one drawing at any size. */
const bodyStyle = {
  background:
    "linear-gradient(158deg, color-mix(in oklab, var(--cobalt) 86%, white) 0%, var(--cobalt) 34%, color-mix(in oklab, var(--cobalt) 80%, black) 100%)",
  boxShadow:
    "inset 0 0.5cqw 0 rgba(255,255,255,0.3), inset 0 -1.2cqw 2.4cqw rgba(0,0,0,0.24), inset 0.5cqw 0 0 rgba(255,255,255,0.1), inset -0.5cqw 0 0 rgba(0,0,0,0.14), 0 2.4cqw 3.4cqw -2cqw rgba(14,15,26,0.55), 0 0.8cqw 1.4cqw rgba(14,15,26,0.2)",
  borderRadius: "5cqw 5cqw 3.4cqw 3.4cqw",
};

const wellBg = "color-mix(in oklab, var(--cobalt) 52%, #05060f)";

function PrizeBox({ index }: { index: number }) {
  const p = projects[index];
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: p.accent, borderRadius: "2cqw", boxShadow: "0 0.8cqw 1.4cqw rgba(0,0,0,0.35), inset 0 0 0 0.25cqw rgba(0,0,0,0.25)" }}>
      <RemoteImage src={p.image} className="absolute inset-0 h-full w-full object-cover" />
      <span className="absolute inset-x-0 top-0 bg-paper/95" style={{ height: "17%" }} />
      <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-vermilion/90" style={{ width: "8%" }} />
      <span className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 45%, rgba(0,0,0,0.25))" }} />
    </div>
  );
}

/**
 * An arcade claw machine where my projects are the prizes (it was the V2 home cover, now a Lab object). It fills the
 * box it is given; physics and drawing are in v2-sim.ts / v2-view.ts.
 */
export default function ClawObject() {
  const entered = useEntered();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<ClawView | null>(null);
  const leverRef = useRef<SVGGElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const cabRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);
  const keysRef = useRef({ left: false, right: false });
  const timerRef = useRef(0);
  const countRef = useRef(0);

  const [prize, setPrize] = useState<{ index: number; n: number } | null>(null);
  const [status, setStatus] = useState({ text: IDLE_TEXT, flash: false, n: 0 });
  const [announce, setAnnounce] = useState({ text: "", n: 0 });
  const [played, setPlayed] = useState(false);

  // The machine: built once, torn down with the page.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tell = (text: string) => setAnnounce((a) => ({ text, n: a.n + 1 }));
    const say = (text: string, flash: boolean, hold: number) => {
      window.clearTimeout(timerRef.current);
      countRef.current += 1;
      setStatus({ text, flash, n: countRef.current });
      timerRef.current = window.setTimeout(() => {
        countRef.current += 1;
        setStatus({ text: IDLE_TEXT, flash: false, n: countRef.current });
      }, hold);
    };
    const view = new ClawView(canvas, ITEMS, {
      onWin: (index) => {
        countRef.current += 1;
        setPrize({ index, n: countRef.current });
        say(projects[index].title, true, 3600);
        tell(`You caught ${displayTitle(projects[index])}. It is in the prize tray, with a link to open it.`);
      },
      onStatus: (kind) => {
        if (kind === "drop") {
          setPlayed(true);
          say("Here goes…", false, 6000);
          tell("The claw is dropping.");
        } else if (kind === "grip") {
          say("Got something!", false, 6000);
          tell("The claw has a grip.");
        } else if (kind === "slip") {
          say("So close…", false, 1800);
          tell("The prize slipped out of the claw.");
        } else {
          say("Nothing but air", false, 1800);
          tell("The claw closed on nothing.");
        }
      },
      onFrame: (lever, busy, x) => {
        if (leverRef.current) leverRef.current.style.transform = `rotate(${(lever * 26).toFixed(2)}deg)`;
        if (glareRef.current) glareRef.current.style.transform = `translate3d(${(-(x - 50) * 0.06).toFixed(2)}%,0,0)`;
        const cab = cabRef.current;
        if (cab) {
          const v = busy ? "true" : "false";
          if (cab.dataset.busy !== v) cab.dataset.busy = v;
        }
      },
    });
    viewRef.current = view;
    return () => {
      window.clearTimeout(timerRef.current);
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Once the cabinet has landed, the prizes rain in.
  useEffect(() => {
    if (!entered) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => viewRef.current?.start(reduced), reduced ? 0 : 450);
    return () => window.clearTimeout(t);
  }, [entered]);

  const aim = (e: React.PointerEvent<HTMLDivElement>) => viewRef.current?.aim(e.clientX);
  const drop = () => viewRef.current?.drop();
  const steer = () => viewRef.current?.setKey((keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0));

  const prizeProject = prize ? projects[prize.index] : null;

  return (
    <div className="group/hero relative h-full w-full" data-entered={entered}>
      <style dangerouslySetInnerHTML={{ __html: CLAW_CSS }} />
      <div className="h-full w-full" style={{ containerType: "size", display: "grid", placeItems: "center" }}>
        <div
          className="translate-y-[-3.5rem] scale-[0.94] opacity-0 transition-[opacity,translate,scale] duration-[1100ms] ease-[cubic-bezier(0.2,1.25,0.35,1)] group-data-[entered=true]/hero:translate-y-0 group-data-[entered=true]/hero:scale-100 group-data-[entered=true]/hero:opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100"
          style={{ width: "min(100cqw, 75cqh)", aspectRatio: "3 / 4" }}
        >
          <div ref={cabRef} data-busy="false" className="relative w-full select-none" style={{ containerType: "inline-size", aspectRatio: "3 / 4" }}>
            <div className="absolute inset-0" style={bodyStyle} aria-hidden />

            {/* side trim and kick plate */}
            <span className="absolute rounded-full bg-butter" style={{ left: "1.7cqw", top: "22cqw", bottom: "12cqw", width: "0.8cqw", opacity: 0.9 }} aria-hidden />
            <span className="absolute rounded-full bg-butter" style={{ right: "1.7cqw", top: "22cqw", bottom: "12cqw", width: "0.8cqw", opacity: 0.9 }} aria-hidden />
            <span className="absolute rounded-full bg-butter" style={{ left: "6cqw", right: "6cqw", bottom: "2.6cqw", height: "1cqw" }} aria-hidden />
            <span className="absolute rounded-full bg-vermilion" style={{ left: "6cqw", right: "6cqw", bottom: "4.4cqw", height: "0.5cqw", opacity: 0.9 }} aria-hidden />

            {/* marquee */}
            <div className="absolute" style={{ left: "4.5cqw", top: "3.1cqw", width: "91cqw", height: "12.6cqw" }} aria-hidden>
              <div
                className="relative h-full w-full overflow-hidden bg-deep text-on-deep"
                style={{ borderRadius: "2.2cqw", boxShadow: "inset 0 0 0 0.35cqw rgba(255,255,255,0.1), inset 0 -1cqw 2cqw rgba(0,0,0,0.35), 0 0 4cqw -1cqw color-mix(in oklab, var(--spark) 55%, transparent)" }}
              >
                <div className={`absolute inset-x-0 ${entered ? "v2-bulbs-a" : "opacity-25"}`} style={{ top: "0.7cqw", height: "1.7cqw", ...bulbs("0cqw") }} />
                <div className={`absolute inset-x-0 ${entered ? "v2-bulbs-b" : "opacity-25"}`} style={{ top: "0.7cqw", height: "1.7cqw", ...bulbs("2.2cqw") }} />
                <div className={`absolute inset-x-0 ${entered ? "v2-bulbs-b" : "opacity-25"}`} style={{ bottom: "0.7cqw", height: "1.7cqw", ...bulbs("0cqw") }} />
                <div className={`absolute inset-x-0 ${entered ? "v2-bulbs-a" : "opacity-25"}`} style={{ bottom: "0.7cqw", height: "1.7cqw", ...bulbs("2.2cqw") }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ paddingTop: "0.4cqw", gap: "0.6cqw" }}>
                  <span className="font-medium uppercase" style={{ fontSize: "max(0.625rem, 2.6cqw)", letterSpacing: "0.16em", opacity: 0.8, lineHeight: 1 }}>
                    Parv Marwaha — Designer
                  </span>
                  <span
                    key={status.n}
                    className={`block max-w-[84cqw] truncate font-semibold text-spark ${status.flash ? "v2-flash" : ""}`}
                    style={{ fontSize: "max(0.75rem, 4.1cqw)", lineHeight: 1.1, letterSpacing: "-0.01em" }}
                  >
                    {status.text}
                  </span>
                </div>
              </div>
            </div>
            <span className="absolute bg-vermilion" style={{ left: "4.5cqw", width: "91cqw", top: "16.3cqw", height: "0.7cqw", borderRadius: "1cqw" }} aria-hidden />

            {/* the glass */}
            <div
              className="absolute"
              style={{
                left: "4.6cqw",
                top: "17.9cqw",
                width: "90.8cqw",
                height: "78.8cqw",
                padding: "1.4cqw",
                borderRadius: "2.4cqw",
                background: "color-mix(in oklab, var(--cobalt) 38%, #05060f)",
                boxShadow: "inset 0 0.4cqw 0.8cqw rgba(0,0,0,0.5), 0 0.3cqw 0 rgba(255,255,255,0.18)",
              }}
            >
              <div
                role="group"
                aria-roledescription="claw machine"
                aria-label="Claw machine. Left and right arrow keys move the claw. Space or Enter drops it."
                tabIndex={0}
                data-cursor-label="Drop"
                className="relative h-full w-full touch-pan-y overflow-hidden outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ borderRadius: "1.4cqw", WebkitTapHighlightColor: "transparent" }}
                onPointerMove={(e) => {
                  if (e.pointerType === "mouse" || e.pointerType === "pen" || dragRef.current) aim(e);
                }}
                onPointerDown={(e) => {
                  if (e.pointerType !== "mouse") dragRef.current = true;
                  aim(e);
                }}
                onPointerUp={(e) => {
                  if (e.pointerType !== "mouse" && dragRef.current) {
                    dragRef.current = false;
                    drop();
                  }
                }}
                onPointerCancel={() => {
                  dragRef.current = false;
                }}
                onClick={(e) => {
                  if ((e.nativeEvent as PointerEvent).pointerType === "touch") return;
                  drop();
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                    e.preventDefault();
                    if (e.key === "ArrowLeft") keysRef.current.left = true;
                    else keysRef.current.right = true;
                    steer();
                  } else if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    if (!e.repeat) drop();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === "ArrowLeft") keysRef.current.left = false;
                  else if (e.key === "ArrowRight") keysRef.current.right = false;
                  else return;
                  steer();
                }}
                onBlur={() => {
                  keysRef.current.left = false;
                  keysRef.current.right = false;
                  steer();
                }}
              >
                {/* the back wall of the box */}
                <div className="v2-wall absolute inset-0" />
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
                {/* the lights come on */}
                <div className="pointer-events-none absolute inset-0 bg-[rgba(8,10,30,0.42)] opacity-100 transition-opacity delay-[700ms] duration-[900ms] group-data-[entered=true]/hero:opacity-0 motion-reduce:opacity-0" />
                {/* glass: reflections that slide a little as the claw moves */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                  <div
                    ref={glareRef}
                    className="absolute inset-y-0"
                    style={{
                      left: "-15%",
                      width: "130%",
                      background:
                        "linear-gradient(112deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 13%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.07) 65%, rgba(255,255,255,0) 72%)",
                    }}
                  />
                  <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 3cqw rgba(8,10,30,0.28), inset 0 0.6cqw 0 rgba(255,255,255,0.35)", borderRadius: "1.4cqw" }} />
                </div>
                {/* first-time hint: engraved on the dark floor slab, so it never sits on the claw or the prizes */}
                <div
                  className={`pointer-events-none absolute right-0 flex items-center justify-center overflow-hidden text-on-deep transition-opacity duration-500 ${played || !entered ? "opacity-0" : "opacity-100"}`}
                  style={{ left: "24%", bottom: 0, height: "6cqw" }}
                  aria-hidden
                >
                  <span className="v2-sway whitespace-nowrap" style={{ fontSize: "max(0.625rem, 2.5cqw)", fontWeight: 500, letterSpacing: "0.04em", opacity: 0.85 }}>
                    <span className="[@media(pointer:coarse)]:hidden">← aim · click to drop →</span>
                    <span className="hidden [@media(pointer:coarse)]:inline">← drag · let go to drop →</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ---- the prize tray ---- */}
            <div className="absolute" style={{ left: "4.6cqw", top: "98.4cqw", width: "44.4cqw", height: "29.2cqw" }}>
              <div
                className="relative h-full w-full overflow-hidden"
                style={{ borderRadius: "2cqw", background: wellBg, boxShadow: "inset 0 1cqw 1.8cqw rgba(0,0,0,0.6), inset 0 -0.3cqw 0 rgba(255,255,255,0.14), 0 0.3cqw 0 rgba(255,255,255,0.16)" }}
              >
                {!prize && (
                  <p className="absolute inset-x-0 text-center text-on-deep" style={{ top: "11cqw", fontSize: "max(0.625rem, 2.7cqw)", opacity: 0.55, lineHeight: 1.25, padding: "0 4cqw" }}>
                    Prizes land here
                  </p>
                )}
                {prize && prizeProject && (
                  <div key={prize.n} className="absolute inset-0">
                    <div className="v2-land absolute" style={{ left: "2.4cqw", bottom: "2.6cqw", width: "16cqw", height: "16cqw" }}>
                      <PrizeBox index={prize.index} />
                    </div>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className="v2-spark absolute rounded-full bg-spark"
                        style={
                          {
                            left: "10.4cqw",
                            bottom: "10.6cqw",
                            width: "1.3cqw",
                            height: "1.3cqw",
                            ["--dx" as string]: `${Math.cos((i / 6) * Math.PI * 2) * 11}cqw`,
                            ["--dy" as string]: `${Math.sin((i / 6) * Math.PI * 2) * 9 - 3}cqw`,
                            animationDelay: "0.3s",
                          } as React.CSSProperties
                        }
                        aria-hidden
                      />
                    ))}
                    <div
                      className="v2-tag absolute flex flex-col bg-paper text-ink"
                      style={{ left: "20.4cqw", top: "5.4cqw", width: "21.8cqw", padding: "1.4cqw 1.6cqw 1.6cqw", borderRadius: "1.2cqw", gap: "1cqw", boxShadow: "0 0.6cqw 1.2cqw rgba(0,0,0,0.35)" }}
                    >
                      <span className="block font-semibold" style={{ fontSize: "max(0.625rem, 2.8cqw)", lineHeight: 1.12, letterSpacing: "-0.01em" }}>
                        {prizeProject.title}
                        {prizeProject.kind && (
                          <span className="block font-normal text-mute" style={{ fontSize: "max(0.5625rem, 2.3cqw)", marginTop: "0.3cqw" }}>
                            {prizeProject.kind}
                          </span>
                        )}
                      </span>
                      <a
                        href={projectHref(prizeProject)}
                        {...linkTarget(prizeProject)}
                        className="relative w-fit rounded-full bg-vermilion font-semibold text-white outline-none transition-transform before:absolute before:-inset-2 hover:scale-[1.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                        style={{ padding: "0.9cqw 2.2cqw", fontSize: "max(0.625rem, 2.5cqw)" }}
                        data-cursor-label="Open"
                      >
                        Open ↗
                      </a>
                    </div>
                  </div>
                )}
                {/* the flap */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0"
                  style={{ height: "4.4cqw", background: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.06))", borderBottom: "0.3cqw solid rgba(255,255,255,0.28)" }}
                  aria-hidden
                />
              </div>
            </div>

            {/* ---- the control panel ---- */}
            <div
              className="absolute flex items-center justify-between"
              style={{
                left: "50.4cqw",
                top: "98.4cqw",
                width: "45cqw",
                height: "29.2cqw",
                padding: "0 2.6cqw",
                borderRadius: "2cqw",
                background: "linear-gradient(180deg, color-mix(in oklab, var(--cobalt) 70%, #05060f), color-mix(in oklab, var(--cobalt) 58%, #05060f))",
                boxShadow: "inset 0 0.5cqw 0 rgba(255,255,255,0.16), inset 0 -0.8cqw 1.4cqw rgba(0,0,0,0.35), 0 0.3cqw 0 rgba(255,255,255,0.12)",
              }}
            >
              {[
                { left: "1.2cqw", top: "1.2cqw" },
                { right: "1.2cqw", top: "1.2cqw" },
                { left: "1.2cqw", bottom: "1.2cqw" },
                { right: "1.2cqw", bottom: "1.2cqw" },
              ].map((pos, i) => (
                <span key={i} className="absolute rounded-full" style={{ ...pos, width: "0.9cqw", height: "0.9cqw", background: "rgba(255,255,255,0.28)", boxShadow: "inset 0 0.15cqw 0 rgba(0,0,0,0.4)" }} aria-hidden />
              ))}

              {/* joystick: decorative, but it leans where the claw is being sent */}
              <div className="relative shrink-0" style={{ width: "9.4cqw", height: "10.3cqw" }} aria-hidden>
                <svg viewBox="0 0 40 44" className="block h-full w-full overflow-visible">
                  <ellipse cx="20" cy="36" rx="16.5" ry="6.6" fill="rgba(0,0,0,0.5)" />
                  <ellipse cx="20" cy="33.5" rx="15.5" ry="6.2" fill="#2a2e3d" />
                  <ellipse cx="20" cy="32.4" rx="12" ry="4.4" fill="#444a5d" />
                  <g ref={leverRef} style={{ transformOrigin: "20px 32px", transformBox: "view-box" }}>
                    <rect x="18.3" y="8" width="3.4" height="24.5" rx="1.7" fill="#aeb4c2" />
                    <rect x="19" y="8" width="1.1" height="24" rx="0.55" fill="rgba(255,255,255,0.75)" />
                    <circle cx="20" cy="8" r="7.4" style={{ fill: "var(--vermilion)" }} />
                    <ellipse cx="17.4" cy="5.2" rx="3" ry="2" fill="rgba(255,255,255,0.55)" />
                  </g>
                </svg>
              </div>

              {/* the big DROP button */}
              <button
                type="button"
                onClick={drop}
                aria-label="Drop the claw"
                data-cursor-label="Drop"
                className="group/drop v2-drop relative shrink-0 rounded-full outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ width: "16.4cqw", height: "16.4cqw" }}
              >
                <span className="absolute inset-0 rounded-full" style={{ background: "rgba(0,0,0,0.5)", transform: "translateY(7%)" }} />
                <span
                  className="absolute inset-0 rounded-full bg-vermilion transition-transform duration-75 group-active/drop:translate-y-[6%]"
                  style={{ boxShadow: "inset 0 -1cqw 0 rgba(0,0,0,0.22), inset 0 0.7cqw 0.7cqw rgba(255,255,255,0.4), 0 0 0 0.9cqw rgba(255,255,255,0.1)" }}
                >
                  <span className="grid h-full w-full place-items-center font-bold tracking-wider text-white" style={{ fontSize: "max(0.6875rem, 3.2cqw)", textShadow: "0 0.2cqw 0 rgba(0,0,0,0.25)" }}>
                    DROP
                  </span>
                </span>
              </button>

              {/* the coin slot: it takes a hire */}
              <Link
                href="/contact"
                data-cursor-label="Let's talk"
                className="group/coin relative shrink-0 bg-paper text-ink outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ width: "11.2cqw", height: "20cqw", borderRadius: "1.5cqw", boxShadow: "inset 0 -0.7cqw 0 rgba(0,0,0,0.14), 0 0.7cqw 0 rgba(0,0,0,0.38)" }}
              >
                <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-ink" style={{ top: "6.6cqw", width: "0.9cqw", height: "3.8cqw" }} aria-hidden />
                <span
                  className="v2-coin absolute left-1/2 -translate-x-1/2 rounded-full bg-vermilion group-hover/coin:translate-y-[3.2cqw] group-hover/coin:scale-x-[0.16] group-focus-visible/coin:translate-y-[3.2cqw] group-focus-visible/coin:scale-x-[0.16]"
                  style={{ top: "1.2cqw", width: "4.6cqw", height: "4.6cqw", boxShadow: "inset 0 -0.4cqw 0 rgba(0,0,0,0.22), inset 0 0.3cqw 0 rgba(255,255,255,0.45)" }}
                  aria-hidden
                />
                <span className="absolute inset-x-0 text-center font-bold leading-[1.1]" style={{ bottom: "1.6cqw", fontSize: "max(0.625rem, 2.6cqw)", letterSpacing: "0.01em" }}>
                  Hire
                  <br />
                  me ↗
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Not in the toy: every project as a plain link (visible when focused), and wins read out. */}
      <nav aria-label="Projects in the claw machine">
        <ul>
          {projects.map((p) => (
            <li key={p.slug}>
              <a
                href={projectHref(p)}
                {...linkTarget(p)}
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-24 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-[0.875rem] focus:font-medium focus:text-paper"
              >
                {displayTitle(p)}, {p.year}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="sr-only" aria-live="polite" role="status">
        <span key={announce.n}>{announce.text}</span>
      </p>
    </div>
  );
}
