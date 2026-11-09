"use client";

import Link from "next/link";

/**
 * A small way back from a project page, always to the home page. Coming from home, it steps back through the history
 * so the page returns to where the visitor was (PageTransition remembers the previous page); from anywhere else, or
 * when the project was opened directly, it opens home.
 */
export default function BackLink() {
  return (
    <Link
      href="/"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        let cameFrom: string | null = null;
        try {
          cameFrom = sessionStorage.getItem("pm-came-from");
        } catch {}
        // the page curtain plays either way: back through the history, or on to home (PageTransition)
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("pm:back", { detail: { to: "/", back: cameFrom === "/" } }));
      }}
      className="group mb-6 inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-[0.875rem] text-mute transition-colors hover:text-ink"
      data-cursor-label="Back"
      // it runs the curtain itself (going back through the history when that leads home)
      data-no-curtain
    >
      <span aria-hidden className="inline-block transition-transform duration-300 group-hover:-translate-x-1">
        ←
      </span>
      Back
    </Link>
  );
}
