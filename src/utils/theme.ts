import { COBALT, VAR_MAP, type Palette, type Theme } from "@/content/themes";

// The palette on screen right now. It lives only in memory: a reload always starts again from Cobalt.
let current: Theme | null = null;

/** The palette currently applied, or null for the default Cobalt. */
export function readTheme(): Theme | null {
  return current;
}

/** Repaint the whole site (until the page is reloaded). Pass null to go back to Cobalt. Only the site's own colours change, never the project pictures. */
export function applyTheme(theme: Theme | null) {
  const root = document.documentElement;
  (Object.keys(VAR_MAP) as (keyof Palette)[]).forEach((k) => {
    if (theme) root.style.setProperty(VAR_MAP[k], theme.vars[k]);
    else root.style.removeProperty(VAR_MAP[k]);
  });
  if (theme && theme.fx === "xray") root.dataset.fx = "xray";
  else delete root.dataset.fx;

  current = theme;

  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", (theme ?? COBALT).vars.primary);
  window.dispatchEvent(new Event("pm:theme"));
}
