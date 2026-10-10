"use client";

import type { Rect } from "./world";
import { FrameName, Selection } from "./Selection";
import { introStyle } from "./Frame";

const rows = ["bg-cobalt", "bg-vermilion", "bg-butter", "bg-on-deep"];

/** A "prototype" frame: a tiny breakout wall with a bouncing ball, leading to the real game. */
export default function PlayFrame({
  rect,
  introOn,
  dev,
  highlighted,
  onOpen,
}: {
  rect: Rect;
  introOn: boolean;
  dev: boolean;
  highlighted: boolean;
  onOpen: () => void;
}) {
  return (
    <a
      href="/play"
      data-frame="play"
      data-no-curtain
      data-cursor-label="Play"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onOpen();
      }}
      className="group absolute block outline-none"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, ...introStyle(introOn, 9) }}
    >
      <FrameName>
        Prototype · <span className="text-ink">Off hours</span>
      </FrameName>
      <div className="relative h-full w-full overflow-hidden bg-deep p-5 shadow-[0_24px_48px_-24px_rgba(14,15,26,0.6)]">
        <div className="grid grid-cols-8 gap-[0.3125rem]">
          {rows.flatMap((c, r) => Array.from({ length: 8 }, (_, i) => <span key={`${r}-${i}`} className={`h-[0.875rem] ${c} ${(r + i) % 5 === 0 ? "opacity-30" : ""}`} />))}
        </div>
        <span
          className="absolute left-[3.75rem] top-[8rem] h-3 w-3 rounded-full bg-vermilion"
          style={{ animation: "ball-bounce 2.4s ease-in-out infinite" }}
        />
        <span className="absolute bottom-5 left-1/2 h-2 w-24 -translate-x-1/2 rounded-full bg-on-deep" />
        <span className="absolute right-5 top-[5.5rem] flex h-10 w-10 items-center justify-center rounded-full bg-on-deep text-deep transition-transform duration-300 group-hover:scale-110">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
            <path d="M3 1.5v11l9-5.5-9-5.5Z" />
          </svg>
        </span>
      </div>
      <Selection w={rect.w} h={rect.h} dev={dev} show={highlighted} />
    </a>
  );
}
