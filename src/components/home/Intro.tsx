"use client";

import { projects, TYPES, type ProjectType } from "@/content/projects";
import { site } from "@/content/site";
import { getLenis, rem } from "@/utils/lenis";
import Reveal from "@/components/ui/Reveal";

const NAMES: Record<ProjectType, string> = {
  "UI/UX": "UI/UX design",
  Branding: "Brand identity",
  Motion: "Motion graphics",
  Illustration: "Illustration",
};

/** Who I am in one sentence, then what a recruiter wants in five seconds: what I do, with what, where, and how to reach me. */
export default function Intro() {
  const counts = new Map<string, number>();
  for (const p of projects) for (const t of p.tools) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tools = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const [before, emphasis, after] = site.intro;

  // Picking a discipline filters the grid below and takes you there.
  const show = (type: ProjectType) => {
    window.dispatchEvent(new CustomEvent<ProjectType>("pm:filter", { detail: type }));
    const el = document.getElementById("work");
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -rem(84), duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  const col = "border-t border-ink/15 pt-4";
  const big = "text-xl font-medium leading-snug tracking-tight md:text-2xl";
  return (
    <section className="px-4 pt-16 md:px-6 md:pt-28" aria-label="Introduction">
      <div className="mx-auto max-w-[85rem]">
        <p className="label mb-6 text-mute">Hello</p>
        <Reveal>
          <p className="max-w-5xl text-3xl font-medium leading-[1.12] tracking-tighter md:text-[3.5rem]">
            {before}
            <em className="font-display italic text-cobalt">{emphasis}</em>
            {after}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-x-8 gap-y-10 md:mt-20 md:grid-cols-4">
          <div className={col}>
            <p className="label mb-4 text-mute">What I do</p>
            <ul className={big}>
              {TYPES.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => show(t)}
                    className="text-left transition-colors hover:text-cobalt"
                    aria-label={`Show ${NAMES[t]} projects`}
                    data-cursor-label="Show"
                  >
                    {NAMES[t]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className={col}>
            <p className="label mb-4 text-mute">Tools</p>
            <p className={big}>{tools.join(", ")}</p>
          </div>
          <div className={col}>
            <p className="label mb-4 text-mute">Based in</p>
            <p className={big}>India</p>
            <p className="mt-1 text-[0.9375rem] text-mute">{site.availability}</p>
          </div>
          <div className={col}>
            <p className="label mb-4 text-mute">Say hi</p>
            <a
              href={`mailto:${site.email}`}
              className={`block break-all underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-vermilion ${big}`}
              data-cursor-label="Email"
            >
              {site.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
