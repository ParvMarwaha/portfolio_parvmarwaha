"use client";

import { useEffect, useState } from "react";
import KernArt, { type KernFace } from "./KernArt";
import { sfx } from "@/utils/ambient";

const LINES = ["Scrolled all the way? Respect.", "Still here? He's still available.", "That's the end. Go on, say hi.", "I'll keep the kerning tight till you're back."];

/**
 * Kern, sitting on the footer's big name: breathes, blinks, says a line when you come near and hops when poked.
 * Purely decorative (the footer's real links are next to it), so it is hidden from screen readers.
 */
export default function KernCameo({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const [face, setFace] = useState<KernFace>("open");
  const [line, setLine] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const [hop, setHop] = useState(0);

  // Blink now and then.
  useEffect(() => {
    let t = 0;
    const blink = () => {
      setFace((f) => (f === "open" ? "sleepy" : f));
      window.setTimeout(() => setFace((f) => (f === "sleepy" ? "open" : f)), 140);
      t = window.setTimeout(blink, 2600 + Math.random() * 3200);
    };
    t = window.setTimeout(blink, 2000);
    return () => window.clearTimeout(t);
  }, []);

  const talk = () => {
    setLine(LINES[n % LINES.length]);
    setFace("happy");
    window.setTimeout(() => {
      setLine(null);
      setFace("open");
    }, 2400);
  };

  return (
    <div className={`pointer-events-auto absolute select-none ${className}`} style={style} aria-hidden>
      {line && (
        <p className="absolute bottom-full left-1/2 mb-3 w-max max-w-[16rem] -translate-x-1/2 rounded-2xl bg-ink px-3.5 py-2 text-[0.875rem] font-medium leading-snug tracking-tight text-paper shadow-[0_14px_30px_-16px_rgba(0,0,0,0.6)] motion-safe:animate-[kern-cameo-pop_0.3s_cubic-bezier(.2,1.4,.4,1)]">
          {line}
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-ink" />
        </p>
      )}
      <button
        type="button"
        tabIndex={-1}
        onPointerEnter={() => !line && talk()}
        onClick={() => {
          setN((v) => v + 1);
          setHop((v) => v + 1);
          talk();
          sfx.blip("triangle", 520, 880, 0.12, 0.2);
        }}
        className="block h-full w-full cursor-pointer motion-safe:animate-[kern-bob_2.6s_ease-in-out_infinite]"
        data-cursor-label="Poke"
      >
        <span key={hop} className="block h-full w-full origin-bottom motion-safe:animate-[kern-hop_0.6s_cubic-bezier(.3,1.6,.5,1)]">
          <KernArt face={face} />
        </span>
      </button>
      <style>{`
        @keyframes kern-bob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(0) scale(1.03,.97)}}
        @keyframes kern-hop{0%{transform:translateY(0) scale(1.15,.8)}40%{transform:translateY(-55%) scale(.92,1.1)}75%{transform:translateY(0) scale(1.1,.88)}100%{transform:none}}
        @keyframes kern-cameo-pop{from{opacity:0;transform:translate(-50%,6px) scale(.92)}to{opacity:1;transform:translate(-50%,0)}}
      `}</style>
    </div>
  );
}
