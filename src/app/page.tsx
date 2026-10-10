import Link from "next/link";
import HeroCard from "@/components/home/HeroCard";
import Intro from "@/components/home/Intro";
import WorkGrid from "@/components/home/WorkGrid";
import Marquee from "@/components/home/Marquee";
import HeroSticky from "@/components/home/HeroSticky";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <main className="relative">
        <HeroSticky>
          <HeroCard />
        </HeroSticky>

        {/* The rest of the page slides up over the cover */}
        <div className="relative z-10 rounded-t-[1.5rem] bg-paper shadow-[0_-40px_70px_-40px_rgba(14,15,26,0.45)] md:rounded-t-[2rem]">
          <div className="pt-5 md:pt-7">
            <Marquee />
          </div>
          <Intro />
          <WorkGrid />

          {/* A small way out to the game */}
          <section className="px-4 pb-8 md:px-6 md:pb-12" aria-label="Off hours">
            <div className="mx-auto flex max-w-[max(85rem,1360px)] flex-col gap-4 border-y border-ink/15 py-6 md:flex-row md:items-center md:justify-between">
              <p className="text-xl font-medium tracking-tight md:text-2xl">
                Off hours: <span className="text-mute">a tiny game called Break the Grid.</span>
              </p>
              <Link
                href="/play"
                className="w-fit rounded-full bg-ink px-5 py-2.5 text-[0.875rem] font-medium tracking-normal text-paper transition-transform hover:scale-[1.04]"
                data-cursor-label="Play"
              >
                Play ↗
              </Link>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
