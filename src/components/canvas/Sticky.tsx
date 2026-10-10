"use client";

import { useRef, useState } from "react";
import type { NoteSpec } from "./world";
import { introStyle } from "./Frame";

/** A sticky note you can pick up and move around the canvas. */
export default function Sticky({
  spec,
  index,
  introOn,
  zoom,
}: {
  spec: NoteSpec;
  index: number;
  introOn: boolean;
  zoom: () => number;
}) {
  const [pos, setPos] = useState({ x: spec.x, y: spec.y });
  const [held, setHeld] = useState(false);
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const tone = spec.tone === "butter" ? "bg-butter text-ink" : "bg-vermilion text-white";

  return (
    <div
      data-nodrag
      data-cursor-label="Drag"
      className="absolute"
      style={{ left: pos.x, top: pos.y, width: 150, height: 150, zIndex: held ? 30 : 5, ...introStyle(introOn, 10 + index) }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
        setHeld(true);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const z = zoom();
        setPos({ x: start.current.x + (e.clientX - start.current.px) / z, y: start.current.y + (e.clientY - start.current.py) / z });
      }}
      onPointerUp={() => {
        start.current = null;
        setHeld(false);
      }}
      onPointerCancel={() => {
        start.current = null;
        setHeld(false);
      }}
    >
      <div
        className={`flex h-full w-full touch-none select-none items-start p-4 text-[0.9375rem] font-medium leading-snug tracking-tight transition-[transform,box-shadow] duration-300 ${tone}`}
        style={{
          transform: `rotate(${held ? 0 : spec.rot}deg) scale(${held ? 1.06 : 1})`,
          boxShadow: held
            ? "0 30px 40px -16px rgba(14,15,26,0.45)"
            : "0 1px 0 rgba(14,15,26,0.06), 0 14px 22px -14px rgba(14,15,26,0.5)",
        }}
      >
        <span className="whitespace-pre-line">{spec.text}</span>
      </div>
    </div>
  );
}
