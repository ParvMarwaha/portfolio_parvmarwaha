import { useCallback, useSyncExternalStore } from "react";

/** A phone or tablet: the main pointer is a finger. Evaluated when called, so only use it in effects and handlers. */
export const isCoarse = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/**
 * A media query as state. `serverValue` is what the server (and the hydration pass) sees, so pass null to
 * tell "not known yet" apart from a real false.
 */
export function useMedia<S extends boolean | null = false>(query: string, serverValue: S = false as S): boolean | S {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore<boolean | S>(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}

/** True on touch devices. False on the server and while hydrating. */
export const useCoarse = () => useMedia("(pointer: coarse)");
