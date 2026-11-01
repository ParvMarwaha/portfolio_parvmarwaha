"use client";

import { useEffect, useRef } from "react";
import { useEntered } from "@/components/home/hero/shared";
import { SPECS } from "./v3-data";
import { createLidEngine, type LidEngine } from "./v3-engine";
import Sticker from "./v3-stickers";
import { LID_CSS } from "./v3-styles";

// The lid is as big as the box allows: landscape on wide screens, portrait below 1024px (see LID_CSS), with room for the tilt.
const FIT_CSS = `
.lab-lid { width: min(100cqw, calc(100cqh * 1.5625 * 0.86)); }
@media (max-width: 1023.98px) { .lab-lid { width: min(90cqw, calc(100cqh / 1.3 * 0.86)); } }
`;

/**
 * The back of a laptop covered in die-cut stickers (it was the V3 home cover, now a Lab object). Every sticker peels
 * off, moves and sticks back down (mouse, finger or arrow keys). Physics in v3-engine.ts, materials in v3-styles.ts.
 */
export default function StickerObject() {
  const entered = useEntered();
  const lidRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const engineRef = useRef<LidEngine | null>(null);

  useEffect(() => {
    const lid = lidRef.current;
    if (!lid) return;
    const engine = createLidEngine({
      lid,
      items: Array.from(lid.querySelectorAll<HTMLElement>(".lid3-st")),
      announce: (message) => {
        if (liveRef.current) liveRef.current.textContent = message;
      },
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Once everything has landed, one sticker lifts a corner by itself, to say that they peel.
  useEffect(() => {
    if (!entered) return;
    const t = window.setTimeout(() => engineRef.current?.peek("p2"), 2800);
    return () => window.clearTimeout(t);
  }, [entered]);

  return (
    <section
      aria-label="A laptop lid covered in stickers"
      data-entered={entered}
      className="lid3-stage grid h-full w-full place-items-center [container-type:size] [touch-action:pan-y]"
    >
      <style dangerouslySetInnerHTML={{ __html: LID_CSS + FIT_CSS }} />
      <div className="lid3-drop lab-lid">
        <div ref={lidRef} className="lid3-lid">
          <div className="lid3-contact" aria-hidden />
          <div className="lid3-hinge" aria-hidden />
          <div className="lid3-metal" aria-hidden />
          <div className="lid3-sheen" aria-hidden />
          <div className="lid3-mark" aria-hidden />
          {SPECS.map((spec) => (
            <Sticker key={spec.id} spec={spec} />
          ))}
          <button
            type="button"
            className="lid3-reset"
            onClick={() => engineRef.current?.reset()}
            data-cursor-label="Tidy up"
            aria-label="Reset: put all the stickers back where they started"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v3h3" />
            </svg>
            Reset
          </button>
        </div>
      </div>
      <p ref={liveRef} className="sr-only" aria-live="polite" />
    </section>
  );
}
