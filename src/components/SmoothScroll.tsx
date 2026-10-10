"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/utils/gsap";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
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
