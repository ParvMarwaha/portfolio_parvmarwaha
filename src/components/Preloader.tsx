"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/utils/gsap";
import { site } from "@/content/site";
import { getLenis } from "@/utils/lenis";

declare global {
  interface Window {
    __introDone?: boolean;
  }
}

const WORDS = ["Parv", "Marwaha"];
const LETTERS = WORDS.join("").length;
const STRIPS = 7;
const PHRASES: [number, string][] = [
  [0, "Opening the file"],
  [0.36, "Setting the type"],
  [0.72, "Almost there"],
  [1, "Ready"],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * The opening sequence, once per session. The name starts as a hairline and gets heavier letter by letter as the
 * counter climbs (the same variable font as the cover), while a design-tool selection box is drawn around it and
 * its size tag ticks along. At 100 the panels lift away from the middle outward and the cover is dealt in.
 */
export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const phraseRef = useRef<HTMLParagraphElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const finish = () => {
      window.__introDone = true;
      window.dispatchEvent(new Event("intro:done"));
    };

    let seen = false;
    try {
      seen = sessionStorage.getItem("pm-intro") === "1";
    } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (seen || reduced) {
      if (rootRef.current) rootRef.current.style.display = "none";
      finish();
      return;
    }

    getLenis()?.stop();
    let phrase = "";
    let tagStep = -1;

    // Everything on screen is a function of one number, 0 to 1.
    const render = (v: number) => {
      const n = Math.round(v * 100);
      if (counterRef.current) {
        counterRef.current.textContent = String(n).padStart(3, "0");
        counterRef.current.style.fontWeight = String(Math.round(300 + 500 * v));
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${v})`;
      letters.current.forEach((el, i) => {
        if (el) el.style.fontWeight = String(Math.round(100 + 800 * smooth(clamp01((v * (LETTERS + 5) - i) / 5))));
      });
      const name = nameRef.current;
      if (name) {
        if (boxRef.current) boxRef.current.style.width = `calc(${v} * (100% + 1.75rem))`;
        // Reading the size forces a layout, so the tag ticks in steps rather than every frame.
        const step = Math.round(v * 24);
        if (tagRef.current && step !== tagStep) {
          tagStep = step;
          tagRef.current.textContent = `${site.name} · ${name.offsetWidth} × ${name.offsetHeight}`;
        }
      }
      const next = [...PHRASES].reverse().find(([from]) => v >= from)?.[1] ?? PHRASES[0][1];
      if (next !== phrase && phraseRef.current) {
        phrase = next;
        phraseRef.current.textContent = next;
      }
    };
    render(0);

    const strips = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-strip]") ?? []);
    const progress = { v: 0 };
    const anims: Animation[] = [];
    let finishTimer = 0;
    const done = () => {
      try {
        sessionStorage.setItem("pm-intro", "1");
      } catch {}
      getLenis()?.start();
      setGone(true);
    };
    // The lift-off runs as Web Animations (transform and opacity only), which the browser plays off the main thread.
    // With a script-driven tween, the cover starting up underneath (Kern dropping in, the page rendering) stole frames
    // from the panels and the reveal stuttered on phones.
    const lift = () => {
      const content = contentRef.current;
      if (content)
        anims.push(
          content.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(-6%)", opacity: 0 }], {
            duration: 600,
            easing: "cubic-bezier(.55,.085,.68,.53)",
            fill: "forwards",
          })
        );
      // The cover wakes up once the panels are well on their way, not on the same frame they start moving.
      finishTimer = window.setTimeout(finish, 450);
      const mid = (strips.length - 1) / 2;
      strips.forEach((el, i) =>
        anims.push(
          el.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(0)" }], {
            duration: 1000,
            delay: 100 + Math.abs(i - mid) * 75,
            easing: "cubic-bezier(.87,0,.13,1)",
            fill: "forwards",
          })
        )
      );
      Promise.all(anims.map((a) => a.finished)).then(done, () => {});
    };

    const tl = gsap.timeline();
    tl.to(progress, { v: 1, duration: 2.3, ease: "power2.inOut", onUpdate: () => render(progress.v) })
      .add(() => render(1))
      .to({}, { duration: 0.4 })
      .add(lift);

    return () => {
      tl.kill();
      anims.forEach((a) => a.cancel());
      window.clearTimeout(finishTimer);
      getLenis()?.start();
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={rootRef} className="preloader fixed inset-0 z-[9998] text-paper" aria-hidden>
      <div className="absolute inset-0 flex">
        {Array.from({ length: STRIPS }, (_, i) => (
          <div key={i} data-strip className="h-full flex-1 origin-top bg-cobalt will-change-transform" style={{ boxShadow: i ? "-1px 0 0 0 rgba(255,255,255,0.05)" : undefined }} />
        ))}
      </div>

      <div
        ref={contentRef}
        className="absolute inset-0 flex flex-col justify-between p-6 will-change-[transform,opacity] md:p-10"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.4px)", backgroundSize: "24px 24px" }}
      >
        <div className="label flex justify-between">
          <span>{site.name}</span>
          <span className="hidden sm:block">{site.role}</span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div ref={nameRef} className="relative text-[min(18.5vw,10rem)] leading-[0.86] tracking-[-0.04em] md:text-[min(12.5vw,13.125rem)]">
            {/* The selection box is drawn as loading goes on */}
            <span ref={boxRef} className="pointer-events-none absolute -bottom-3 -left-[0.875rem] -top-3 w-0" aria-hidden>
              <span className="absolute inset-0 border-[1.5px] border-paper/80" />
              {["-left-[0.1875rem] -top-[0.1875rem]", "-right-[0.1875rem] -top-[0.1875rem]", "-left-[0.1875rem] -bottom-[0.1875rem]", "-right-[0.1875rem] -bottom-[0.1875rem]"].map((pos) => (
                <span key={pos} className={`absolute h-[0.4375rem] w-[0.4375rem] border border-paper bg-cobalt ${pos}`} />
              ))}
            </span>
            {WORDS.map((word, wi) => (
              <span key={word} className="block whitespace-nowrap md:inline-block md:[&:not(:last-child)]:mr-[0.25em]">
                {word.split("").map((ch, ci) => {
                  const index = WORDS.slice(0, wi).join("").length + ci;
                  return (
                    <span
                      key={ci}
                      ref={(el) => {
                        letters.current[index] = el;
                      }}
                      className="inline-block"
                      style={{ fontWeight: 100 }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </span>
            ))}
            <span
              ref={tagRef}
              className="absolute left-1/2 top-full mt-5 -translate-x-1/2 whitespace-nowrap rounded-[0.1875rem] bg-paper px-2 py-1 text-[0.6875rem] font-medium leading-none tracking-normal text-cobalt"
            />
          </div>
        </div>

        <div className="flex items-end justify-between gap-6">
          <p ref={phraseRef} className="label pb-2 opacity-80">
            {PHRASES[0][1]}
          </p>
          <span ref={counterRef} className="text-[clamp(3.5rem,11vw,10.625rem)] leading-[0.8] tracking-tighter tabular-nums">
            000
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[0.1875rem] bg-white/10">
        <div ref={barRef} className="h-full origin-left scale-x-0 bg-vermilion" />
      </div>
    </div>
  );
}
