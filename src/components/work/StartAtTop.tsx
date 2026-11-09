"use client";

import { useEffect } from "react";
import { getLenis } from "@/utils/lenis";

/**
 * A project page always opens at its top. The page can otherwise land part-way down: the scroll carried over from the
 * page you came from, or something on it (an embed) pulling the view as it loads. For the first moments after
 * arriving the top is held; the first wheel, touch or key from the reader lets go.
 */
export default function StartAtTop() {
  useEffect(() => {
    if (window.location.hash) return;
    let held = true;
    const top = () => {
      if (!held) return;
      getLenis()?.scrollTo(0, { immediate: true, force: true } as never);
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    const release = () => (held = false);
    top();
    const raf = requestAnimationFrame(top);
    const timers = [120, 400, 900].map((ms) => window.setTimeout(top, ms));
    const end = window.setTimeout(release, 1000);
    const opts = { passive: true, once: true } as const;
    window.addEventListener("wheel", release, opts);
    window.addEventListener("touchstart", release, opts);
    window.addEventListener("keydown", release, opts);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      clearTimeout(end);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      window.removeEventListener("keydown", release);
    };
  }, []);
  return null;
}
