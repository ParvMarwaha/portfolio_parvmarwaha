"use client";

import { useEffect } from "react";
import { flushSync } from "react-dom";
import { COBALT, COBALT_DARK } from "@/content/themes";
import { getMode, modeIsChosen, paintFrom, setMode } from "@/utils/theme";

/**
 * Day and night. The site starts in the device's mode; a press switches it (and remembers the choice), with the same
 * circle reveal as the colour button. Both icons are drawn and CSS shows the right one, so the first paint is never wrong.
 */
export default function ModeToggle() {
  // Until the visitor picks one, follow the device if it changes (an evening switch to dark, say).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      if (!modeIsChosen()) setMode(mq.matches ? "dark" : "light", false);
    };
    mq.addEventListener("change", follow);
    return () => mq.removeEventListener("change", follow);
  }, []);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = getMode() === "dark" ? "light" : "dark";
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || box.left + box.width / 2;
    const y = e.clientY || box.top + box.height / 2;
    paintFrom(x, y, () => flushSync(() => setMode(next)), (next === "dark" ? COBALT_DARK : COBALT).vars.paper);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      data-cursor-label="Light / dark"
      className="group hidden h-9 w-9 place-items-center rounded-full bg-paper text-ink ring-1 ring-ink/10 transition-shadow md:bg-paper/85 md:backdrop-blur-md hover:ring-ink/40 sm:grid"
    >
      {/* Moon by day (press for night), sun by night */}
      <svg viewBox="0 0 20 20" aria-hidden className="h-[1.0625rem] w-[1.0625rem] transition-transform duration-500 group-hover:-rotate-12 day-only">
        <path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 20 20" aria-hidden className="night-only h-[1.125rem] w-[1.125rem] transition-transform duration-700 group-hover:rotate-45">
        <circle cx="10" cy="10" r="3.6" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
        </g>
      </svg>
    </button>
  );
}

/** The same switch as a row in the phone menu, where the top bar has no room for it. */
export function ModeRow() {
  return (
    <button
      type="button"
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        const next = getMode() === "dark" ? "light" : "dark";
        paintFrom(box.left + box.width / 2, box.top + box.height / 2, () => flushSync(() => setMode(next)), (next === "dark" ? COBALT_DARK : COBALT).vars.paper);
      }}
      className="flex w-fit items-center gap-3 rounded-full px-4 py-2.5 ring-1 ring-paper/40"
    >
      <span className="text-[0.9375rem] font-medium tracking-normal">
        <span className="day-only">Dark mode off</span>
        <span className="night-only">Dark mode on</span>
      </span>
    </button>
  );
}
