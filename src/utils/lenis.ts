// SmoothScroll exposes its Lenis instance on window; this is the only typed way the rest of the site touches it.
type LenisHandle = {
  stop: () => void;
  start: () => void;
  resize: () => void;
  scrollTo: (target: HTMLElement | number | string, options?: { offset?: number; duration?: number }) => void;
};
export const getLenis = () => (typeof window === "undefined" ? undefined : (window as unknown as { lenis?: LenisHandle }).lenis);

/** A length written for the 16px base, scaled to the current root size (the whole site scales on large screens). */
export const rem = (px: number) => (typeof window === "undefined" ? px : (px * parseFloat(getComputedStyle(document.documentElement).fontSize)) / 16);
