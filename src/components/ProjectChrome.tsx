"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RemoteImage from "@/components/ui/RemoteImage";

/** Thin vermilion bar across the top that fills as you read down the page. */
export function ReadingProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[65] h-[0.1875rem]" aria-hidden>
      <div ref={ref} className="h-full origin-left scale-x-0 bg-vermilion" />
    </div>
  );
}

/** The cover drifts and settles as you scroll away from it. */
export function HeroImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = Math.min(window.scrollY, window.innerHeight * 1.2);
      if (ref.current) ref.current.style.transform = `translate3d(0, ${y * 0.28}px, 0) scale(${1.08 - Math.min(y / window.innerHeight, 1) * 0.06})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className="h-full w-full will-change-transform">
      <RemoteImage src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

interface Neighbour {
  href: string;
  no: string;
  title: string;
}

/** Previous / next project, as pills in the hero and on the arrow keys. */
export function ProjectPager({ prev, next }: { prev: Neighbour; next: Neighbour }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || document.body.dataset.lightbox) return;
      if (e.key === "ArrowRight") router.push(next.href);
      else if (e.key === "ArrowLeft") router.push(prev.href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prev.href, next.href]);

  const pill = "rounded-full bg-paper px-4 py-2 text-[0.75rem] font-medium tracking-normal text-ink ring-1 ring-ink/10 md:bg-paper/90 md:backdrop-blur-md transition-colors hover:bg-ink hover:text-paper";
  return (
    <div className="absolute right-4 top-20 z-10 flex gap-2 md:right-10 md:top-24">
      <Link href={prev.href} className={pill} data-cursor-label="Previous">
        ← {prev.no}
        <span className="hidden sm:inline"> {prev.title}</span>
      </Link>
      <Link href={next.href} className={pill} data-cursor-label="Next">
        <span className="hidden sm:inline">{next.title} </span>
        {next.no} →
      </Link>
    </div>
  );
}
