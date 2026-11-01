"use client";

import { useEffect, useState } from "react";
import { getLenis, rem } from "@/utils/lenis";

/** The cover shapes shared by the experimental heroes: same footprint as the old visiting card. */
export const STAGE_MIN = "clamp(31.25rem, calc(100svh - 9.375rem), 48.75rem)";
/** The name: as big as the width allows (11rem at most), but never so tall that the cover outgrows a short screen. */
export const NAME_SIZE =
  "max(3.5rem, min(11rem, calc((100svh - 24.5rem) / 2.12), calc((min(100vw, 100vw - 3rem) - 2 * var(--pad)) / 4.3)))";

/** True once the intro curtain has lifted (straight away for a returning visitor). Asks the name for one wave of weight. */
export function useEntered() {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    let fired = false;
    const timers: number[] = [];
    const go = () => {
      if (fired) return;
      fired = true;
      setEntered(true);
      timers.push(window.setTimeout(() => window.dispatchEvent(new Event("pm:wave")), 500));
    };
    if (window.__introDone) timers.push(window.setTimeout(go, 80));
    else {
      window.addEventListener("intro:done", go, { once: true });
      timers.push(window.setTimeout(go, 6000)); // never leave the page empty
    }
    return () => {
      window.removeEventListener("intro:done", go);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  return entered;
}

/** Scrolls to the work on the home page; from anywhere else (a Lab object, say) it goes there. */
export function toWork() {
  const el = document.getElementById("work");
  if (!el) return window.location.assign("/#work");
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(el, { offset: -rem(84), duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}
