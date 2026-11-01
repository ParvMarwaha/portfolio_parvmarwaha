import HeroV7 from "@/components/home/hero/HeroV7";
import Intro from "@/components/home/Intro";
import WorkGrid from "@/components/home/WorkGrid";
import HeroSticky from "@/components/home/HeroSticky";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <main className="relative">
        <HeroSticky>
          <HeroV7 />
        </HeroSticky>

        {/* The rest of the page slides up over the cover: a light canvas with the intro as a text layer and the work as frames */}
        <div
          className="relative z-10 rounded-t-[1.5rem] bg-paper-2 shadow-[0_-40px_70px_-40px_rgba(14,15,26,0.45)] md:rounded-t-[2rem]"
          style={{ backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--ink) 11%, transparent) 1px, transparent 1.5px)", backgroundSize: "24px 24px" }}
        >
          <Intro />
          <WorkGrid />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
