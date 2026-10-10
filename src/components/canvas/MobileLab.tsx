"use client";

import Link from "next/link";
import { experiments, lab } from "@/content/lab";
import { getLenis, rem } from "@/utils/lenis";
import LetterHeadline, { useIstClock } from "@/components/hero/LetterHeadline";
import { EXPERIMENT_VIEWS } from "./experiments";

// The notes are written for a cursor; on a phone it is a finger.
const forTouch = (note: string) =>
  note
    .replace("Move your cursor over it", "Touch it")
    .replace("Move over it", "Touch it")
    .replace("follows your cursor", "reacts to a tap")
    .replace("Your cursor", "Your finger");

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(el, { offset: -rem(84), duration: 1.2 });
  else el.scrollIntoView({ behavior: "smooth" });
};

/**
 * The Lab on a phone: the free-roaming canvas needs two hands and a mouse, so here it is one plain column.
 * Scroll down, each experiment gets a full-width card, and only the ones on screen are running.
 */
export default function MobileLab() {
  const time = useIstClock();
  const fs = "calc((min(100vw, 40rem) - 2rem - 3rem) / 4.3)";

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-[5.25rem] md:max-w-2xl">
      <section aria-label="Cover" className="flex min-h-[26rem] flex-col justify-between gap-10 bg-cobalt p-6 text-paper shadow-[0_40px_80px_-40px_rgba(14,15,26,0.7)]">
        <div className="label flex justify-between opacity-80">
          <span>Experiments — 2026</span>
          <span>India · {time} IST</span>
        </div>
        <div>
          <LetterHeadline lines={["Parv's", lab.title]} fontSize={fs} label={`Parv's ${lab.title}`} />
          <p className="mt-3 font-display italic leading-none text-butter" style={{ fontSize: `calc(${fs} * 0.4)` }}>
            {lab.tagline}
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <p className="text-[0.9375rem] font-medium tracking-tight">{lab.note}</p>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/" className="rounded-full px-5 py-3 text-[0.9375rem] font-medium tracking-normal ring-1 ring-paper/40">
              ← Home
            </Link>
            <button
              type="button"
              onClick={() => scrollToId("experiments")}
              className="rounded-full bg-paper px-5 py-3 text-[0.9375rem] font-semibold tracking-normal text-cobalt"
            >
              See the experiments ↓
            </button>
          </div>
        </div>
      </section>

      <section id="experiments" aria-label="Experiments" className="pt-12">
        <p className="label text-mute">{String(experiments.length).padStart(2, "0")} experiments · tap to play</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Jump to an experiment">
          {experiments.map((e, i) => (
            <button
              key={e.id}
              type="button"
              onClick={() => scrollToId(`lab-${e.id}`)}
              className="rounded-full px-3.5 py-2 text-[0.8125rem] font-medium tracking-normal text-ink/80 ring-1 ring-ink/20"
            >
              <span className="opacity-50">{String(i + 1).padStart(2, "0")}</span> {e.title}
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-14">
          {experiments.map((e, i) => (
            <article key={e.id} id={`lab-${e.id}`} aria-label={e.title}>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2 className="text-2xl font-medium tracking-tighter">
                  <span className="mr-2 text-[0.8125rem] opacity-50">{String(i + 1).padStart(2, "0")}</span>
                  {e.title}
                </h2>
                <span className="label text-mute">{e.kind}</span>
              </div>
              <div className="relative aspect-[5/4] overflow-hidden bg-paper shadow-[0_1px_0_rgba(14,15,26,0.05),0_24px_48px_-24px_rgba(14,15,26,0.45)]">
                {EXPERIMENT_VIEWS[e.id]}
              </div>
              <p className="mt-3 text-[0.9375rem] leading-snug text-mute">{forTouch(e.note)}</p>
            </article>
          ))}
        </div>

        <Link
          href="/play"
          data-no-curtain
          className="mt-14 flex items-center justify-between gap-4 bg-deep p-6 text-on-deep shadow-[0_24px_48px_-24px_rgba(14,15,26,0.6)]"
        >
          <span>
            <span className="label block opacity-60">Off hours</span>
            <span className="mt-1 block text-2xl font-medium tracking-tighter">Break the Grid</span>
          </span>
          <span className="rounded-full bg-on-deep px-5 py-3 text-[0.875rem] font-semibold tracking-normal text-deep">Play ↗</span>
        </Link>
      </section>
    </main>
  );
}
