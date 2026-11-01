"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/utils/gsap";
import { isCoarse } from "@/utils/device";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Phones keep the browser's own scrolling. Lenis listens to touchmove without `passive`, so every swipe waited on
    // the main thread (and Kern's loop on the cover) before the page could move: that was the stutter. The stand-in
    // below answers the same calls the rest of the site makes.
    if (isCoarse()) {
      const root = document.documentElement;
      // Glides for the buttons that jump down the page (the browser's own smooth scroll is not on every phone).
      let glide = 0;
      const cancel = () => cancelAnimationFrame(glide);
      const native = {
        stop: () => root.classList.add("scroll-locked"),
        start: () => root.classList.remove("scroll-locked"),
        resize: () => {},
        scrollTo: (target: HTMLElement | number | string, o: { offset?: number; duration?: number; immediate?: boolean } = {}) => {
          const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
          if (el === null) return;
          const to = typeof el === "number" ? el : el.getBoundingClientRect().top + window.scrollY + (o.offset ?? 0);
          cancel();
          if (o.immediate) return window.scrollTo(0, to);
          const from = window.scrollY;
          const ms = (o.duration ?? 1.2) * 1000;
          const t0 = performance.now();
          const step = (now: number) => {
            const t = Math.min(1, (now - t0) / ms);
            window.scrollTo(0, from + (to - from) * (1 - Math.pow(1 - t, 4)));
            if (t < 1) glide = requestAnimationFrame(step);
          };
          glide = requestAnimationFrame(step);
        },
      };
      // A finger on the screen takes over from a glide in progress.
      window.addEventListener("touchstart", cancel, { passive: true });
      (window as unknown as { lenis?: typeof native }).lenis = native;
      return () => {
        cancel();
        native.start();
        window.removeEventListener("touchstart", cancel);
        delete (window as unknown as { lenis?: typeof native }).lenis;
      };
    }

    const lenis = new Lenis({
      duration: 2.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.7,
      touchMultiplier: 1.5,
    });

    // Expose lenis globally so the Preloader can physically stop it
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    // Drive Lenis and ScrollTrigger from one animation clock. This keeps scroll
    // position and visual effects in lockstep instead of letting each interpolate
    // on a separate requestAnimationFrame loop.
    const update = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // The scroll limit must follow the page: fonts arriving, a new page, a theme change or a window resize can all
    // change its height, and a stale limit would stop the page short of its real end (the footer cut off).
    const remeasure = () => lenis.resize();
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.documentElement);
    ro.observe(document.body);
    void document.fonts?.ready.then(remeasure);
    window.addEventListener("load", remeasure);
    window.addEventListener("pm:theme", remeasure);

    return () => {
      ro.disconnect();
      window.removeEventListener("load", remeasure);
      window.removeEventListener("pm:theme", remeasure);
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
