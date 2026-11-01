"use client";

import { projects, type ProjectType } from "@/content/projects";
import { site } from "@/content/site";
import { getLenis, rem } from "@/utils/lenis";
import Reveal from "@/components/ui/Reveal";

/**
 * Who I am, as one text layer on the canvas. The kinds of work in it are selectable layers: hover one and it gets a
 * selection box with a count, click it and the frames below are filtered to that kind.
 */
function Layer({ type, children }: { type: ProjectType; children: React.ReactNode }) {
  const n = projects.filter((p) => p.type === type).length;
  const show = () => {
    window.dispatchEvent(new CustomEvent<ProjectType>("pm:filter", { detail: type }));
    const el = document.getElementById("work");
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -rem(96), duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <button
      type="button"
      onClick={show}
      className="group/layer relative inline-block text-cobalt outline-none"
      aria-label={`Show ${type} projects`}
      data-cursor-label={`${n} ${n === 1 ? "frame" : "frames"} ↓`}
    >
      {children}
      <span className="pointer-events-none absolute -inset-x-[0.08em] -inset-y-[0.02em] opacity-0 transition-opacity duration-200 group-hover/layer:opacity-100 group-focus-visible/layer:opacity-100" aria-hidden>
        <span className="absolute inset-0 border-[1.5px] border-cobalt" />
        {["-left-[3px] -top-[3px]", "-right-[3px] -top-[3px]", "-left-[3px] -bottom-[3px]", "-right-[3px] -bottom-[3px]"].map((c) => (
          <span key={c} className={`absolute h-[7px] w-[7px] border-[1.5px] border-cobalt bg-paper ${c}`} />
        ))}
      </span>
    </button>
  );
}

export default function Intro() {
  const facts: [string, React.ReactNode][] = [
    ["Works in", site.tools.join(", ")],
    ["Based in", "India"],
    ["Status", site.availability],
    [
      "Say hi",
      <a key="e" href={`mailto:${site.email}`} className="break-all underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-vermilion" data-cursor-label="Email">
        {site.email}
      </a>,
    ],
  ];
  return (
    <section className="px-4 pb-16 pt-20 md:px-6 md:pb-24 md:pt-28" aria-label="Introduction">
      <div className="grid gap-y-12 lg:grid-cols-12 lg:items-end lg:gap-x-10">
        <Reveal className="lg:col-span-8">
          <p className="text-balance text-[clamp(2.125rem,4.4vw,4.5rem)] font-medium leading-[1.06] tracking-[-0.035em] text-ink">
            {/* The same words as site.intro, with the kinds of work as selectable layers */}
            I&apos;m Parv, a <em className="font-display font-normal italic">designer</em> from India. I design{" "}
            <span className="whitespace-nowrap">
              <Layer type="UI/UX">interfaces</Layer>,
            </span>{" "}
            <Layer type="Branding">brands</Layer> and{" "}
            <span className="whitespace-nowrap">
              <Layer type="Motion">motion</Layer>,
            </span>{" "}
            and I can build and ship them too.
          </p>
        </Reveal>

        {/* The facts, as a small properties list beside the statement */}
        <dl className="grid grid-cols-1 gap-y-4 border-t border-ink/15 pt-5 sm:grid-cols-2 sm:gap-x-8 lg:col-span-4 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          {facts.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[6rem_1fr] items-baseline gap-3">
              <dt className="text-[0.8125rem] tracking-tight text-mute">{k}</dt>
              <dd className="text-[0.9375rem] font-medium leading-snug tracking-tight text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
