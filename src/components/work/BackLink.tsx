"use client";

import Link from "next/link";

/**
 * A small way back from a project page: to wherever the visitor came from on this site (the home grid, the index;
 * PageTransition remembers it), or to the work index when the page was opened directly.
 */
export default function BackLink() {
  return (
    <Link
      href="/work"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        let cameFrom: string | null = null;
        try {
          cameFrom = sessionStorage.getItem("pm-came-from");
        } catch {}
        // the page curtain plays either way: back through the history, or on to the index (PageTransition)
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("pm:back", { detail: { to: cameFrom ?? "/work", back: !!cameFrom } }));
      }}
      className="group mb-6 inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-[0.875rem] text-mute transition-colors hover:text-ink"
      data-cursor-label="Back"
      // it runs the curtain itself (going back through the history rather than on to /work)
      data-no-curtain
    >
      <span aria-hidden className="inline-block transition-transform duration-300 group-hover:-translate-x-1">
        ←
      </span>
      Back
    </Link>
  );
}
