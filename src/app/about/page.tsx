import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/content/site";
import { projects, DISCIPLINES, isOfType } from "@/content/projects";

export const metadata: Metadata = { title: "About" };

const DISCIPLINE_NAMES = { "UI/UX": "UI/UX design", Branding: "Brand identity", Motion: "Motion graphics", Illustration: "Illustration" } as const;

/**
 * About, kept as quiet as the case studies: one narrow column with the portrait and a few lines about me, then what I
 * do (only the kinds there is work for), the tools, and a way to get in touch. The text lives in src/content/site.ts.
 */
export default function About() {
  const facts: [string, React.ReactNode][] = [
    ["Based in", "India"],
    ["Status", site.availability],
    ["Email", <a key="e" href={`mailto:${site.email}`} className="break-all underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink">{site.email}</a>],
    ["Phone", <a key="p" href={site.phoneHref} className="underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink">{site.phone}</a>],
  ];
  const kinds = DISCIPLINES.map((t) => ({ t, work: projects.filter((p) => isOfType(p, t)) })).filter((k) => k.work.length);

  return (
    <>
      <main className="mx-auto w-full max-w-[62rem] px-4 pb-24 pt-28 md:px-6 md:pb-32 md:pt-36">
        <h1 className="text-[1.25rem] font-medium tracking-tight">About</h1>

        <div className="mt-8 grid gap-10 md:grid-cols-[18rem_1fr] md:gap-16">
          <Reveal>
            <div className="relative aspect-[4/5] w-full max-w-[18rem] overflow-hidden rounded-[1rem] bg-paper-2 ring-1 ring-ink/10">
              <Image
                src="/images/parv-marwaha.webp"
                alt="Parv Marwaha smiling at the camera from behind red flowers in a café"
                fill
                preload
                sizes="(max-width: 768px) 100vw, 18rem"
                className="object-cover"
                style={{ objectPosition: "50% 64%" }}
              />
            </div>
          </Reveal>
          <div>
            <p className="text-[1.5rem] font-medium leading-snug tracking-tight md:text-[1.75rem]">{site.about.lead}</p>
            {site.about.paragraphs.map((t) => (
              <p key={t} className="mt-4 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink/75">
                {t}
              </p>
            ))}
            <dl className="mt-10 grid gap-5 sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[0.8125rem] text-mute">{k}</dt>
                  <dd className="mt-0.5 text-[0.9375rem] leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <section className="mt-24 md:mt-32" aria-label="What I do">
          <h2 className="text-[1.125rem] font-medium tracking-tight md:text-[1.25rem]">What I do</h2>
          <ul className="mt-6 border-t border-ink/10">
            {kinds.map(({ t }) => (
              <li key={t} className="grid gap-1 border-b border-ink/10 py-5 md:grid-cols-[14rem_1fr] md:gap-8">
                <h3 className="text-[1rem] font-medium tracking-tight">{DISCIPLINE_NAMES[t]}</h3>
                <p className="max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink/75">{site.about.disciplines[t]}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-24 md:mt-32" aria-label="Toolkit">
          <h2 className="text-[1.125rem] font-medium tracking-tight md:text-[1.25rem]">Toolkit</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {site.tools.map((t) => (
              <li key={t} className="rounded-full bg-paper-2 px-4 py-2 text-[0.875rem] font-medium tracking-tight ring-1 ring-ink/10">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink/75">{site.aiNote.short}</p>
        </section>

        <div className="mt-24 flex flex-wrap items-center gap-3 md:mt-32">
          <Link href="/contact" className="rounded-full bg-vermilion px-6 py-3 text-[0.9375rem] font-semibold tracking-normal text-white transition-transform hover:scale-[1.04]">
            Hire me ↗
          </Link>
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-full px-5 py-3 text-[0.875rem] font-medium tracking-normal ring-1 ring-ink/20 transition-colors hover:bg-ink hover:text-paper">
              {s.label} ↗
            </a>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
