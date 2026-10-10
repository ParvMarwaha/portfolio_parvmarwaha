"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "@/utils/gsap";
import RemoteImage from "@/components/ui/RemoteImage";

/**
 * Click a project and its picture opens out to fill the screen, landing exactly on the project page's
 * cover. If anything interrupts the animation the page still opens.
 */
export function usePageEnter() {
  const router = useRouter();
  const [state, setState] = useState<{ href: string; from: DOMRect; src?: string } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const timer = useRef(0);

  const enter = useCallback(
    (href: string, el: HTMLElement) => {
      if (busy.current) return;
      busy.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }
      router.prefetch(href);
      timer.current = window.setTimeout(() => router.push(href), 2200);
      const img = el.querySelector("img");
      setState({ href, from: el.getBoundingClientRect(), src: img?.currentSrc || img?.src });
    },
    [router]
  );

  useEffect(() => {
    const el = overlayRef.current;
    if (!state || !el) return;
    gsap.set(el, { left: state.from.left, top: state.from.top, width: state.from.width, height: state.from.height });
    const tween = gsap.to(el, {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      duration: 0.65,
      ease: "expo.inOut",
      onComplete: () => router.push(state.href),
    });
    return () => {
      tween.kill();
    };
  }, [state, router]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const overlay = state ? (
    <div ref={overlayRef} className="pointer-events-none fixed z-[70] overflow-hidden bg-deep">
      {state.src && <RemoteImage src={state.src} alt="" className="h-full w-full object-cover" />}
    </div>
  ) : null;

  return { enter, overlay };
}
