"use client";

import Link from "next/link";
import { site } from "@/content/site";
import { introStyle } from "./Frame";

/** A comment pin on the cover. Opens a thread with the hire call, like feedback left on a design file. */
export default function CommentPin({
  x,
  y,
  open,
  onToggle,
  introOn,
  align = "right",
}: {
  x: number;
  y: number;
  open: boolean;
  onToggle: () => void;
  introOn: boolean;
  /** Which way the thread opens from the pin. */
  align?: "right" | "left";
}) {
  return (
    <div
      className="absolute left-0 top-0 z-20"
      style={{ transform: `translate(${x}px, ${y}px) scale(var(--inv, 1))`, transformOrigin: "0 0" }}
      data-nodrag
    >
      <div style={introStyle(introOn, 11)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label="Open comment"
        data-cursor-label="Reply"
        className="absolute -left-[1.0625rem] -top-[1.0625rem] flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-full rounded-bl-none bg-vermilion text-[0.8125rem] font-semibold text-white ring-[3px] ring-white"
        style={{ boxShadow: "0 8px 16px -6px rgba(14,15,26,0.5)" }}
      >
        <span className="absolute inset-0 rounded-full bg-vermilion" style={{ animation: "pin-pulse 2s ease-out infinite" }} aria-hidden />
        <span className="relative">P</span>
      </button>

      <div
        className={`absolute top-[-0.875rem] w-[18.75rem] max-w-[calc(100vw-3rem)] rounded-2xl bg-paper p-4 text-ink shadow-[0_24px_50px_-16px_rgba(14,15,26,0.55)] transition-all duration-300 ${
          align === "left" ? "right-[1.625rem] origin-top-right rounded-tr-none" : "left-[1.625rem] origin-top-left rounded-tl-none"
        } ${open ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cobalt text-[0.75rem] font-semibold text-white">P</span>
          <span className="text-[0.875rem] font-semibold tracking-tight">Parv</span>
          <span className="text-[0.75rem] text-mute">just now</span>
        </div>
        <p className="mt-3 text-[0.9375rem] leading-snug tracking-tight">{site.hireComment}</p>
        <div className="mt-4 flex items-center gap-2">
          <Link
            href="/contact"
            className="rounded-full bg-vermilion px-4 py-2 text-[0.8125rem] font-semibold tracking-normal text-white transition-transform hover:scale-[1.04]"
          >
            Hire me ↗
          </Link>
          <a
            href={`mailto:${site.email}`}
            className="rounded-full px-3 py-2 text-[0.8125rem] font-medium tracking-normal text-ink/70 ring-1 ring-ink/15 transition-colors hover:text-ink"
          >
            Email
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}
