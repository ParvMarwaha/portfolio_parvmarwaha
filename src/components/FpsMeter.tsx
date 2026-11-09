"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A frame-rate readout for checking smoothness on a real phone: add `?fps` to any address. It shows the frames drawn
 * in the last second and the longest gap between two of them (anything over ~20ms is a visible hitch).
 */
export default function FpsMeter() {
  const [on, setOn] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read once after mount: the address is not known while the page is rendered on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(new URLSearchParams(window.location.search).has("fps"));
  }, []);

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let last = performance.now();
    let since = last;
    let frames = 0;
    let worst = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      worst = Math.max(worst, now - last);
      last = now;
      frames++;
      if (now - since >= 1000) {
        const fps = Math.round((frames * 1000) / (now - since));
        if (outRef.current) outRef.current.textContent = `${fps} fps · worst ${Math.round(worst)}ms`;
        frames = 0;
        worst = 0;
        since = now;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  if (!on) return null;
  return (
    <div
      ref={outRef}
      className="pointer-events-none fixed bottom-3 right-3 z-[10000] rounded-full bg-black/80 px-3 py-1.5 text-[0.75rem] font-medium tabular-nums text-white"
    >
      … fps
    </div>
  );
}
