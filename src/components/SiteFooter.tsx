import Link from "next/link";
import { site } from "@/content/site";
import LetterHeadline from "@/components/hero/LetterHeadline";
import KernCameo from "@/components/kern/KernCameo";

/**
 * The one footer, the full width of the site. A cobalt band that rises under the page like the cover sheet does,
 * so the page ends where it began: how to hire me, then my name in the same weight-reacting type, then the way
 * around the site. Its content sits on the same full-width column (with side gutters) as every page.
 * `cta={false}` drops the hiring row (the contact page already is one).
 */
export default function SiteFooter({ cta = true }: { cta?: boolean }) {
  const pill = "rounded-full px-5 py-2.5 text-[0.875rem] font-medium tracking-normal ring-1 ring-paper/40 transition-colors hover:bg-paper hover:text-cobalt";
  const link = "transition-colors hover:text-paper";
  return (
    <footer className="mt-12 md:mt-20" aria-label="Contact and site links">
      <div className="rounded-t-[1.5rem] bg-cobalt text-paper md:rounded-t-[2rem]">
        <div className="mx-auto box-content max-w-[100vw] px-4 pb-10 pt-14 [--gutter:2rem] md:px-6 md:pb-12 md:pt-24 md:[--gutter:3rem]">
        {cta && (
          <div className="mb-14 flex flex-col gap-8 md:mb-20 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-xl text-5xl font-medium leading-[0.95] tracking-tighter md:text-[4.5rem]">
              Let&apos;s work <em className="font-display italic text-butter">together.</em>
            </h2>
            <div className="flex flex-col gap-5 md:items-end">
              <a
                href={`mailto:${site.email}`}
                className="break-all text-2xl font-medium tracking-tight underline decoration-paper/40 underline-offset-[6px] transition-colors hover:decoration-vermilion md:text-3xl"
                data-cursor-label="Email"
              >
                {site.email}
              </a>
              <p className="flex items-center gap-3 text-[0.9375rem] opacity-90">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inset-0 rounded-full bg-butter" style={{ animation: "pin-pulse 2s ease-out infinite" }} />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-butter" />
                </span>
                {site.availability}
              </p>
              <div className="flex flex-wrap gap-2.5 md:justify-end">
                <Link
                  href="/contact"
                  className="rounded-full bg-vermilion px-6 py-3 text-[0.9375rem] font-semibold tracking-normal text-white transition-transform hover:scale-[1.04]"
                  data-cursor-label="Let's talk"
                >
                  Hire me ↗
                </Link>
                {site.socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={pill}>
                    {s.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* The big name, with Kern from the cover sitting on its first letter */}
        <div className="relative mb-8 w-fit md:mb-12" style={{ fontSize: "min(18.75rem, calc(min(100vw, 100vw - var(--gutter)) / 6.6))" }}>
          <LetterHeadline lines={["Parv Marwaha"]} label={site.name} decorative fontSize="1em" />
          <KernCameo className="h-[0.36em] w-[0.36em]" style={{ left: "0.1em", top: "0.165em", transform: "translateY(-100%)" }} />
        </div>

        <div className="label flex flex-col gap-4 text-paper/70 md:flex-row md:items-center md:justify-between">
          <span>2026 © {site.name}</span>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Link href="/" className={link} data-cursor="hover">Home</Link>
            <Link href="/lab" className={link} data-cursor="hover">Lab</Link>
            <Link href="/work" className={link} data-cursor="hover">Index</Link>
            <Link href="/play" className={link} data-cursor="hover">Off hours</Link>
            {!cta &&
              site.socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={link} data-cursor="hover">
                  {s.label}
                </a>
              ))}
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
}
