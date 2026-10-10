"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { site } from "@/content/site";
import { getLenis, rem } from "@/utils/lenis";
import LetterHeadline, { useIstClock } from "@/components/hero/LetterHeadline";
import Magnetic from "@/components/ui/Magnetic";
import CommentPin from "@/components/canvas/CommentPin";

const face = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;
const dots = { backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.13) 1px, transparent 1.4px)", backgroundSize: "22px 22px" };

/** The visitor's own copy of my contact details, as a .vcf they can open in any address book. */
function saveContact() {
  const card = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${site.name}`,
    "N:Marwaha;Parv;;;",
    `TITLE:${site.role}`,
    `EMAIL:${site.email}`,
    `TEL:${site.phone.replace(/\s/g, "")}`,
    "END:VCARD",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([card], { type: "text/vcard" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "parv-marwaha.vcf";
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The cover, as a visiting card. It is dealt onto the page once the intro curtain lifts (the name runs a
 * wave of weight, the line writes itself in), it leans toward your cursor, and it flips over to show the back:
 * the contact details, with a button that saves them to your address book.
 */
export default function HeroCard() {
  const time = useIstClock();
  const [pinOpen, setPinOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  // Wait for the intro curtain (or go straight away for a returning visitor), then deal the card.
  useEffect(() => {
    let fired = false;
    const timers: number[] = [];
    const go = () => {
      if (fired) return;
      fired = true;
      setEntered(true);
      timers.push(window.setTimeout(() => window.dispatchEvent(new Event("pm:wave")), 500));
    };
    if (window.__introDone) timers.push(window.setTimeout(go, 80));
    else {
      window.addEventListener("intro:done", go, { once: true });
      timers.push(window.setTimeout(go, 6000)); // never leave the page empty
    }
    return () => {
      window.removeEventListener("intro:done", go);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const toWork = () => {
    const el = document.getElementById("work");
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -rem(84), duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  // The card leans toward the pointer and catches a little light there.
  const lean = (e: React.PointerEvent<HTMLElement>) => {
    const tilt = tiltRef.current;
    if (!tilt || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = Math.min(1, Math.max(-1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    const ny = Math.min(1, Math.max(-1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    tilt.style.transform = `rotateX(${(-ny * 2.4).toFixed(2)}deg) rotateY(${(nx * 3).toFixed(2)}deg)`;
    const glare = glareRef.current;
    if (glare) {
      glare.style.opacity = "1";
      glare.style.background = `radial-gradient(circle at ${((nx + 1) * 50).toFixed(1)}% ${((ny + 1) * 50).toFixed(1)}%, rgba(255,255,255,0.2), transparent 55%)`;
    }
  };
  const settle = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "";
    if (glareRef.current) glareRef.current.style.opacity = "0";
  };

  const rise = (delay: string) =>
    `opacity-0 translate-y-4 transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] group-data-[entered=true]/hero:translate-y-0 group-data-[entered=true]/hero:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 ${delay}`;

  return (
    <div className="px-4 pt-[5.25rem] md:px-6 md:pt-[5.75rem]">
      <div
        className="group/hero relative mx-auto w-full max-w-[85rem] [--pad:1.5rem] md:[--pad:3.5rem]"
        data-entered={entered}
        style={{ perspective: "1600px" }}
      >
        <div
          className="translate-y-14 scale-[0.96] opacity-0 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] group-data-[entered=true]/hero:translate-y-0 group-data-[entered=true]/hero:scale-100 group-data-[entered=true]/hero:opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100"
          onPointerMove={lean}
          onPointerLeave={settle}
        >
          <div ref={tiltRef} style={{ transition: "transform 0.35s ease-out" }}>
            <div
              className="relative"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "none",
                transition: "transform 0.9s cubic-bezier(0.7, 0, 0.2, 1)",
              }}
            >
              {/* FRONT */}
              <section
                aria-label="Cover"
                inert={flipped}
                className="relative flex flex-col justify-between gap-12 overflow-hidden bg-cobalt p-[var(--pad)] text-paper shadow-[0_40px_80px_-40px_rgba(14,15,26,0.7)]"
                style={{
                  minHeight: "clamp(31.25rem, calc(100svh - 9.375rem), 48.75rem)",
                  // The name: as big as the width allows (11rem at most), but never so tall that the card outgrows a short screen.
                  ["--fs" as string]: "max(3.5rem, min(11rem, calc((100svh - 24.5rem) / 2.12), calc((min(85rem, 100vw - 3rem) - 2 * var(--pad)) / 4.3)))",
                  ...face,
                }}
              >
                <div className={`label flex items-center justify-between ${rise("delay-[250ms]")}`}>
                  <span className="opacity-80">Portfolio — 2026</span>
                  <button
                    type="button"
                    onClick={() => setFlipped(true)}
                    className="rounded-full px-3 py-1.5 ring-1 ring-paper/40 transition-colors hover:bg-paper hover:text-cobalt"
                    data-cursor-label="Flip"
                    aria-label="Flip the card to see my contact details"
                  >
                    Flip card ↻
                  </button>
                  <span className="opacity-80">India · {time} IST</span>
                </div>

                <div>
                  <LetterHeadline
                    lines={["Parv", "Marwaha"]}
                    label={site.name}
                    fontSize="var(--fs)"
                  />
                  <p
                    className="mt-3 font-display italic leading-none text-butter transition-[clip-path] duration-[1300ms] ease-[cubic-bezier(0.7,0,0.2,1)] [clip-path:inset(-0.3em_100%_-0.4em_-0.1em)] [transition-delay:700ms] group-data-[entered=true]/hero:[clip-path:inset(-0.3em_-0.2em_-0.4em_-0.1em)] motion-reduce:[clip-path:inset(-0.3em_-0.2em_-0.4em_-0.1em)]"
                    style={{ fontSize: "calc(var(--fs) * 0.4)" }}
                  >
                    {site.coverLine}
                  </p>
                </div>

                <div className={`flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-6 ${rise("delay-[900ms]")}`}>
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inset-0 rounded-full bg-butter" style={{ animation: "pin-pulse 2s ease-out infinite" }} />
                      <span className="relative h-2.5 w-2.5 rounded-full bg-butter" />
                    </span>
                    <span className="text-[0.9375rem] font-medium tracking-tight">{site.availability}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Magnetic>
                      <Link
                        href="/contact"
                        className="block rounded-full bg-vermilion px-6 py-3 text-[0.9375rem] font-semibold tracking-normal text-white transition-transform hover:scale-[1.04]"
                        data-cursor-label="Let's talk"
                      >
                        Hire me ↗
                      </Link>
                    </Magnetic>
                    <button
                      type="button"
                      onClick={toWork}
                      className="rounded-full px-6 py-3 text-[0.9375rem] font-medium tracking-normal text-paper ring-1 ring-paper/40 transition-colors hover:bg-paper hover:text-cobalt"
                    >
                      See the work ↓
                    </button>
                  </div>
                </div>

                <div ref={glareRef} className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300" aria-hidden />
              </section>

              {/* BACK: the contact details, like the other side of a visiting card */}
              <section
                aria-label="Contact details"
                inert={!flipped}
                className="absolute inset-0 flex flex-col justify-between overflow-hidden bg-cobalt p-[var(--pad)] text-paper shadow-[0_40px_80px_-40px_rgba(14,15,26,0.7)]"
                style={{ transform: "rotateY(180deg)", ...dots, ...face }}
              >
                <div className="label flex items-center justify-between">
                  <span className="opacity-80">Visiting card · back</span>
                  <button
                    type="button"
                    onClick={() => setFlipped(false)}
                    className="rounded-full px-3 py-1.5 ring-1 ring-paper/40 transition-colors hover:bg-paper hover:text-cobalt"
                    data-cursor-label="Flip"
                    aria-label="Flip the card back"
                  >
                    ↻ Flip back
                  </button>
                </div>

                <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-x-8">
                  <div className="md:col-span-5">
                    <p className="font-display text-3xl italic leading-none text-butter md:text-5xl">{site.role}</p>
                    <p className="mt-3 text-5xl font-medium leading-[0.9] tracking-tighter md:text-[5.5rem]">
                      Parv
                      <br />
                      Marwaha
                    </p>
                  </div>
                  <div className="flex flex-col gap-5 md:col-span-7">
                    <a
                      href={`mailto:${site.email}`}
                      className="w-fit max-w-full break-all text-2xl font-medium tracking-tight underline decoration-paper/40 underline-offset-[6px] transition-colors hover:decoration-vermilion md:text-4xl"
                      data-cursor-label="Email"
                    >
                      {site.email}
                    </a>
                    <a href={site.phoneHref} className="w-fit text-xl font-medium tracking-tight transition-opacity hover:opacity-70 md:text-2xl">
                      {site.phone}
                    </a>
                    <div className="flex flex-wrap gap-2.5">
                      {site.socials.map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full px-5 py-2.5 text-[0.875rem] font-medium tracking-normal ring-1 ring-paper/40 transition-colors hover:bg-paper hover:text-cobalt"
                        >
                          {s.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={saveContact}
                    className="rounded-full bg-paper px-6 py-3 text-[0.9375rem] font-semibold tracking-normal text-cobalt transition-transform hover:scale-[1.04]"
                    data-cursor-label="Save"
                  >
                    Save contact ↓
                  </button>
                  <Link
                    href="/contact"
                    className="rounded-full bg-vermilion px-6 py-3 text-[0.9375rem] font-semibold tracking-normal text-white transition-transform hover:scale-[1.04]"
                    data-cursor-label="Let's talk"
                  >
                    Hire me ↗
                  </Link>
                  <span className="label ml-1 opacity-70">{site.availability}</span>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* The comment pin sits on the corner, like feedback left on a design file */}
        <div className="absolute right-0 top-0 z-20 h-0 w-0">
          <CommentPin x={0} y={0} open={pinOpen} onToggle={() => setPinOpen((v) => !v)} introOn align="left" />
        </div>
      </div>
    </div>
  );
}
