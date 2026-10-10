import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Ph } from "@/components/ui/Placeholder";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/content/site";
import { projects, TYPES } from "@/content/projects";

export const metadata: Metadata = { title: "About" };

const DISCIPLINE_NAMES = { "UI/UX": "UI/UX design", Branding: "Brand identity", Motion: "Motion graphics", Illustration: "Illustration" } as const;

// The text lives in src/content/site.ts (marked DRAFT). The portrait is a real photo; the three pictures further down are placeholders until the rest arrive.
export default function About() {
  const counts = new Map<string, number>();
  for (const p of projects) for (const t of p.tools) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tools = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);

  const facts: [string, React.ReactNode][] = [
    ["Based in", "India"],
    ["Status", site.availability],
    ["Email", <a key="e" href={`mailto:${site.email}`} className="break-all underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-vermilion">{site.email}</a>],
    ["Phone", <a key="p" href={site.phoneHref} className="underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-vermilion">{site.phone}</a>],
  ];

  return (
    <>
      <main className="px-4 pb-20 pt-28 md:px-6 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-[85rem]">
        <p className="label mb-5 text-mute">About</p>
        <h1 className="text-6xl font-medium leading-[0.9] tracking-tighter md:text-[9rem]">
          Ab<em className="font-display italic text-cobalt">out</em>
        </h1>

        <div className="mt-12 grid gap-10 md:mt-20 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-28">
              <Reveal>
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-2 shadow-[0_0_0_1px_rgba(14,15,26,0.1),0_30px_60px_-34px_rgba(14,15,26,0.55)]">
                  <Image
                    src="/images/parv-marwaha.webp"
                    alt="Parv Marwaha smiling at the camera from behind red flowers in a café"
                    fill
                    preload
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                    style={{ objectPosition: "50% 64%" }}
                  />
                </div>
              </Reveal>
            </div>
          </div>
          <div className="flex flex-col gap-12 md:col-span-7">
            <p className="text-3xl font-medium leading-[1.12] tracking-tighter md:text-5xl">{site.about.lead}</p>
            <div className="grid gap-6 text-[1.0625rem] leading-relaxed text-ink/75 md:grid-cols-2 md:gap-8">
              {site.about.paragraphs.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
            <dl className="grid border-t border-ink/15 sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-ink/15 py-4 sm:odd:pr-6 sm:even:pl-6">
                  <dt className="label text-mute">{k}</dt>
                  <dd className="text-right text-[1rem] font-medium tracking-tight">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <section className="mt-20 md:mt-32" aria-label="What I do">
          <p className="label mb-6 text-mute">What I do</p>
          <ul className="grid gap-x-8 gap-y-10 md:grid-cols-4">
            {TYPES.map((t, i) => {
              const mine = projects.filter((p) => p.type === t);
              return (
                <li key={t} className="border-t border-ink/15 pt-4">
                  <p className="label flex justify-between text-mute">
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      {mine.length} {mine.length === 1 ? "project" : "projects"}
                    </span>
                  </p>
                  <h2 className="mt-4 text-2xl font-medium tracking-tighter">{DISCIPLINE_NAMES[t]}</h2>
                  <p className="mt-2 text-[0.9375rem] leading-snug text-mute">{site.about.disciplines[t]}</p>
                  <p className="mt-4 text-[0.875rem] leading-snug">{mine.map((p) => p.title).join(", ")}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-20 md:mt-32" aria-label="Toolkit">
          <p className="label mb-6 text-mute">Toolkit</p>
          <div className="flex flex-wrap gap-2.5">
            {tools.map((t) => (
              <span key={t} className="rounded-full px-5 py-2.5 text-[0.9375rem] font-medium tracking-tight ring-1 ring-ink/20">
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-20 md:mt-32" aria-label="In pictures">
          <p className="label mb-6 text-mute">In pictures · coming soon</p>
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            <Ph label="Workspace" ratio="4 / 5" />
            <Ph label="Sketchbook" ratio="4 / 5" className="md:mt-12" />
            <Ph label="Moodboard" ratio="4 / 5" />
          </div>
        </section>

        <div className="mt-20 flex flex-wrap items-center gap-3 md:mt-28">
          <Link href="/contact" className="rounded-full bg-vermilion px-6 py-3 text-[0.9375rem] font-semibold tracking-normal text-white transition-transform hover:scale-[1.04]">
            Hire me ↗
          </Link>
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-full px-5 py-3 text-[0.875rem] font-medium tracking-normal ring-1 ring-ink/25 transition-colors hover:bg-ink hover:text-paper">
              {s.label} ↗
            </a>
          ))}
        </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
