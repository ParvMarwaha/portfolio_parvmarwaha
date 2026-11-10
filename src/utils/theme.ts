import { COBALT, COBALT_DARK, MODE_KEY, VAR_MAP, type Palette, type Theme } from "@/content/themes";
import { isCoarse } from "@/utils/device";

export type Mode = "light" | "dark";

// The palette on screen right now. It lives only in memory: a reload always starts again from Cobalt (light or dark).
let current: Theme | null = null;

/** Light or dark, as set on <html> before the first paint. */
export function getMode(): Mode {
  return document.documentElement.dataset.mode === "dark" ? "dark" : "light";
}

/** The palette a reset goes back to: Cobalt by day, Cobalt Night in dark mode. */
export function baseTheme(): Theme {
  return getMode() === "dark" ? COBALT_DARK : COBALT;
}

/** The palette currently applied, or null for the base Cobalt of the current mode. */
export function readTheme(): Theme | null {
  return current;
}

const syncMeta = () =>
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", (current ?? baseTheme()).vars.primary);

/** Repaint the whole site (until the page is reloaded). Pass null to go back to Cobalt. Only the site's own colours change, never the project pictures. */
export function applyTheme(theme: Theme | null) {
  const root = document.documentElement;
  (Object.keys(VAR_MAP) as (keyof Palette)[]).forEach((k) => {
    if (theme) root.style.setProperty(VAR_MAP[k], theme.vars[k]);
    else root.style.removeProperty(VAR_MAP[k]);
  });
  if (theme && theme.fx === "xray") root.dataset.fx = "xray";
  else delete root.dataset.fx;
  if (theme) root.dataset.themed = "";
  else delete root.dataset.themed;

  current = theme;
  syncMeta();
  window.dispatchEvent(new Event("pm:theme"));
}

/** Switch between light and dark. A generated palette is dropped, so the switch always lands on plain Cobalt. */
export function setMode(mode: Mode, remember = true) {
  if (remember) {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {}
  }
  document.documentElement.dataset.mode = mode;
  applyTheme(null);
  window.dispatchEvent(new Event("pm:mode"));
}

/** True once the visitor has picked a mode themselves (then the device's setting no longer moves it). */
export function modeIsChosen() {
  try {
    const m = localStorage.getItem(MODE_KEY);
    return m === "light" || m === "dark";
  } catch {
    return false;
  }
}

type ViewTransitionLike = { ready: Promise<void> };
type DocWithTransitions = Document & { startViewTransition?: (update: () => void) => ViewTransitionLike };

/**
 * Change colours with the site's reveal: the new colours grow as a circle out of the point (x, y). On phones, where a
 * page snapshot is heavy, a flat sheet of `flood` floods out instead and the site is repainted underneath it.
 */
export function paintFrom(x: number, y: number, apply: () => void, flood: string) {
  const doc = document as DocWithTransitions;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  if (reduced) {
    apply();
  } else if (doc.startViewTransition && !isCoarse() && window.innerWidth >= 768) {
    doc.startViewTransition(apply).ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 1000, easing: "cubic-bezier(0.65, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      })
      .catch(() => {});
  } else {
    const sheet = document.createElement("div");
    sheet.setAttribute("aria-hidden", "true");
    sheet.style.cssText = `position:fixed;inset:0;z-index:9989;pointer-events:none;clip-path:circle(0px at ${x}px ${y}px);background:${flood}`;
    document.body.appendChild(sheet);
    const grow = sheet.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 450, easing: "cubic-bezier(0.65, 0, 0.2, 1)", fill: "forwards" }
    );
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      apply();
      sheet.animate({ opacity: [1, 0] }, { duration: 350, easing: "ease-out", fill: "forwards" });
      window.setTimeout(() => sheet.remove(), 450);
    };
    grow.finished.then(land, land);
    // If the browser holds animations back (a backgrounded tab), the colours must still change.
    window.setTimeout(land, 700);
  }
}
