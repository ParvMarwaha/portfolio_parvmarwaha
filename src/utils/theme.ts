import { COBALT, THEME_KEY, VAR_MAP, type Palette, type Theme } from "@/content/themes";

/** The theme saved by the visitor, if any (the default Cobalt is never saved). */
export function readTheme(): Theme | null {
  try {
    const t = JSON.parse(localStorage.getItem(THEME_KEY) ?? "null");
    return t && t.vars ? (t as Theme) : null;
  } catch {
    return null;
  }
}

/** Repaint the whole site. Pass null to go back to Cobalt. Only the site's own colours change, never the project pictures. */
export function applyTheme(theme: Theme | null) {
  const root = document.documentElement;
  (Object.keys(VAR_MAP) as (keyof Palette)[]).forEach((k) => {
    if (theme) root.style.setProperty(VAR_MAP[k], theme.vars[k]);
    else root.style.removeProperty(VAR_MAP[k]);
  });
  if (theme && theme.fx === "xray") root.dataset.fx = "xray";
  else delete root.dataset.fx;

  try {
    if (theme) localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    else localStorage.removeItem(THEME_KEY);
  } catch {}

  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", (theme ?? COBALT).vars.primary);
  window.dispatchEvent(new Event("pm:theme"));
}
