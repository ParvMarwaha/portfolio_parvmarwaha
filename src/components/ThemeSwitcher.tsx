"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { COBALT, generateTheme, type Theme } from "@/content/themes";
import { applyTheme, readTheme } from "@/utils/theme";

type ViewTransitionLike = { ready: Promise<void> };
type DocWithTransitions = Document & { startViewTransition?: (update: () => void) => ViewTransitionLike };

const FX_LABEL = { none: "", xray: "x-ray" } as const;

/**
 * One button, no menu: press it and the whole site is repainted in a new, random palette, sometimes a dark,
 * glowing "x-ray" one. The new colours spread out from the
 * button like ink in water. The last palette is remembered; the toast has a way back to Cobalt. Only the site's own
 * colours change: the project pictures always keep theirs.
 */
export default function ThemeSwitcher() {
  const [toast, setToast] = useState<Theme | null>(null);
  const toastTimer = useRef(0);
  const turns = useRef(0);
  // Presses alternate: a plain palette, then an x-ray one, then plain again.
  const nextKind = useRef<"plain" | "xray">("plain");
  const faceRef = useRef<HTMLSpanElement>(null);

  // A palette restored before the page painted still needs the browser bar colour.
  useEffect(() => {
    const saved = readTheme();
    nextKind.current = saved && saved.fx !== "xray" ? "xray" : "plain";
    if (!saved) return;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", saved.vars.primary);
  }, []);

  const change = (e: React.MouseEvent<HTMLElement>, next: Theme | null) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || box.left + box.width / 2;
    const y = e.clientY || box.top + box.height / 2;

    const apply = () => flushSync(() => applyTheme(next));
    const doc = document as DocWithTransitions;
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply();
    } else {
      doc.startViewTransition(apply).ready
        .then(() => {
          const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 1000, easing: "cubic-bezier(0.65, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
          );
        })
        .catch(() => {});
    }

    // The face of the button spins a little further on every press.
    turns.current += 1;
    if (faceRef.current) faceRef.current.style.transform = `rotate(${turns.current * 137}deg)`;

    setToast(next ?? COBALT);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  const shuffle = (e: React.MouseEvent<HTMLElement>) => {
    const kind = nextKind.current;
    nextKind.current = kind === "plain" ? "xray" : "plain";
    change(e, generateTheme(readTheme()?.name ?? COBALT.name, kind));
  };

  return (
    <>
      <button
        type="button"
        onClick={shuffle}
        aria-label="Surprise me: repaint this site in new random colours"
        data-cursor-label="New colours"
        className="group grid h-9 w-9 place-items-center rounded-full bg-paper/85 ring-1 ring-ink/10 backdrop-blur-md transition-shadow hover:ring-ink/40"
      >
        <span
          ref={faceRef}
          aria-hidden
          className="h-[1.125rem] w-[1.125rem] rounded-full transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.9,0.2,1)]"
          style={{ background: "conic-gradient(var(--cobalt) 0 33%, var(--vermilion) 0 66%, var(--butter) 0)" }}
        />
      </button>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[9990] flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.name + toast.vars.primary}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.2, 0.9, 0.2, 1] }}
              className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-[0.875rem] font-medium tracking-normal text-paper"
            >
              <span className="flex" aria-hidden>
                {[toast.vars.primary, toast.vars.accent, toast.vars.highlight].map((c, i) => (
                  <span key={i} className="h-3 w-3 rounded-full" style={{ background: c, marginLeft: i ? -4 : 0, boxShadow: "0 0 0 2px var(--ink)" }} />
                ))}
              </span>
              <span>
                {toast.name}
                {toast.fx !== "none" && <span className="ml-2 rounded-full bg-paper/15 px-2 py-0.5 text-[0.6875rem] uppercase tracking-[0.08em]">{FX_LABEL[toast.fx]}</span>}
              </span>
              {toast.name !== COBALT.name ? (
                <button
                  type="button"
                  onClick={(e) => {
                    nextKind.current = "plain";
                    change(e, null);
                  }}
                  className="rounded-full bg-paper px-3 py-1.5 text-[0.75rem] font-semibold text-ink transition-transform hover:scale-[1.04]"
                  data-cursor-label="Reset"
                >
                  Reset
                </button>
              ) : (
                <span className="w-3" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
