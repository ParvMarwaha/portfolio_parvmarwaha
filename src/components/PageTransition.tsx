"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { gsap } from "@/utils/gsap";
import { getProject } from "@/content/projects";
import { getLenis } from "@/utils/lenis";

const STRIPS = 6;

const NAMES: Record<string, string> = {
  "/": "Home",
  "/work": "Index",
  "/lab": "Lab",
  "/about": "About",
  "/contact": "Contact",
  "/play": "Off hours",
};

const nameFor = (pathname: string) => {
  if (NAMES[pathname]) return NAMES[pathname];
  const slug = pathname.match(/^\/work\/([^/]+)$/)?.[1];
  return (slug && getProject(slug)?.title) || "One moment";
};

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const done = (tl: gsap.core.Timeline) => new Promise<void>((r) => tl.eventCallback("onComplete", () => r()));

/**
 * Going to another page: coloured panels rise to cover the screen, the name of the place you are heading to
 * is spelled out, the page changes behind them, and they lift away. Links that run their own transition
 * (the project cards and the Lab's frames) carry `data-no-curtain` and are left alone.
 */
export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);
  const arrived = useRef<(() => void) | null>(null);
  const [label, setLabel] = useState("");

  // The new route is in place: let the curtain know.
  useEffect(() => {
    arrived.current?.();
    arrived.current = null;
  }, [pathname]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const run = async (href: string, pathnameTo: string) => {
      const root = rootRef.current;
      if (!root) return router.push(href);
      busy.current = true;
      getLenis()?.stop();
      flushSync(() => setLabel(nameFor(pathnameTo)));

      const strips = root.querySelectorAll("[data-strip]");
      const chars = root.querySelectorAll("[data-char]");
      const caption = root.querySelector("[data-caption]");
      const bar = root.querySelector("[data-bar]");
      const count = { v: 0 };
      if (counterRef.current) counterRef.current.textContent = "000";
      gsap.set(bar, { scaleX: 0 });
      gsap.set(root, { visibility: "visible", pointerEvents: "auto" });

      const cover = gsap.timeline();
      cover
        .to(
          count,
          {
            v: 100,
            duration: 1,
            ease: "power2.inOut",
            onUpdate: () => {
              if (counterRef.current) counterRef.current.textContent = String(Math.round(count.v)).padStart(3, "0");
              gsap.set(bar, { scaleX: count.v / 100 });
            },
          },
          0
        )
        .fromTo(strips, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.6, ease: "expo.inOut", stagger: 0.055 })
        .fromTo(chars, { yPercent: 115 }, { yPercent: 0, duration: 0.55, ease: "expo.out", stagger: 0.03 }, "-=0.35")
        .fromTo(caption, { opacity: 0, y: 8 }, { opacity: 0.8, y: 0, duration: 0.4 }, "<");
      await done(cover);

      const there = new Promise<void>((r) => {
        arrived.current = r;
      });
      router.push(href);
      await Promise.race([there, wait(4000)]);
      await wait(180); // let the new page paint its first frame
      getLenis()?.resize();
      getLenis()?.scrollTo(0, { immediate: true } as never);
      window.scrollTo(0, 0);
      window.setTimeout(() => getLenis()?.resize(), 700);

      const lift = gsap.timeline();
      lift
        .to(chars, { yPercent: -115, duration: 0.4, ease: "expo.in", stagger: 0.015 })
        .to(caption, { opacity: 0, duration: 0.25 }, "<")
        .to(strips, { scaleY: 0, transformOrigin: "50% 0%", duration: 0.65, ease: "expo.inOut", stagger: 0.05 }, "-=0.15");
      await done(lift);

      gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
      getLenis()?.start();
      busy.current = false;
    };

    const onClick = (e: MouseEvent) => {
      if (reduced.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self") || a.closest("[data-no-curtain]")) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation(); // keep Next's own Link handler out of it; we navigate once the panels are up
      if (busy.current) return;
      void run(url.pathname + url.search + url.hash, url.pathname);
    };

    // Capture phase: this runs before the framework sees the click.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return (
    <div ref={rootRef} className="pointer-events-none invisible fixed inset-0 z-[9500]" aria-hidden>
      <div className="absolute inset-0 flex">
        {Array.from({ length: STRIPS }, (_, i) => (
          <div key={i} data-strip className="h-full flex-1 scale-y-0 bg-cobalt" style={{ boxShadow: i ? "-1px 0 0 0 rgba(255,255,255,0.06)" : undefined }} />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col justify-between p-6 text-paper md:p-10">
        <p data-caption className="label opacity-0">
          Going to
        </p>
        <div className="flex items-end justify-between gap-6">
        <div className="text-[clamp(3.25rem,13vw,13.75rem)] font-medium leading-[0.9] tracking-tighter">
          {label.split(" ").map((word, wi) => (
            <span key={wi} className="mr-[0.25em] inline-block whitespace-nowrap">
              {word.split("").map((ch, ci) => (
                <span key={ci} className="-mx-[0.1em] -my-[0.15em] inline-block overflow-hidden px-[0.1em] py-[0.15em] align-bottom">
                  <span data-char className="inline-block">
                    {ch}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </div>
        <span ref={counterRef} className="pb-2 text-[clamp(1.75rem,5vw,5.25rem)] font-medium leading-none tracking-tighter tabular-nums opacity-70">
          000
        </span>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[0.1875rem] bg-paper/15">
        <div data-bar className="h-full origin-left scale-x-0 bg-vermilion" />
      </div>
    </div>
  );
}
