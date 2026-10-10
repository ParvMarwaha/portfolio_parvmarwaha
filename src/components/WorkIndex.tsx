"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "@/utils/gsap";
import { projects, numberOf, displayTitle, projectHref, projectsOpenOnBehance, TYPES, type ProjectType } from "@/content/projects";
import RemoteImage from "@/components/ui/RemoteImage";

const filters: ("All" | ProjectType)[] = ["All", ...TYPES];

/** The whole canvas as a plain, scannable list. Pointing at a row floats its image beside the cursor. */
export default function WorkIndex() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [hover, setHover] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = previewRef.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const move = (e: MouseEvent) => {
      x(e.clientX + 32);
      y(e.clientY - 100);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const rows = projects.filter((p) => filter === "All" || p.type === filter);
  const active = projects.find((p) => p.slug === hover);

  return (
    <>
      <div className="mb-10 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
        <h1 className="text-6xl font-medium leading-[0.9] tracking-tighter md:text-[9rem]">
          In<em className="font-display italic text-cobalt">dex</em>
        </h1>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-full px-4 py-1.5 text-[0.8125rem] font-medium tracking-normal ring-1 transition-colors ${
                filter === f ? "bg-ink text-paper ring-ink" : "text-ink/70 ring-ink/20 hover:text-ink hover:ring-ink/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="label grid grid-cols-[3rem_1fr_auto] gap-4 border-b border-line pb-3 text-mute md:grid-cols-[5rem_1fr_10rem_5rem]">
        <span>No.</span>
        <span>Project</span>
        <span className="hidden md:block">Type</span>
        <span className="text-right">Year</span>
      </div>

      <ul onPointerLeave={() => setHover(null)}>
        {rows.map((p) => {
          const external = projectsOpenOnBehance();
          const row = (
            <>
              <span className="label">
                <span className="px-1 transition-colors group-hover:bg-vermilion group-hover:text-white">{numberOf(p)}</span>
              </span>
              <span className="text-3xl font-medium tracking-tighter transition-transform duration-500 group-hover:translate-x-2 md:text-6xl">
                {displayTitle(p)}
                {external && <span className="sr-only"> (opens Behance in a new tab)</span>}
              </span>
              <span className="label hidden md:block">{p.type}</span>
              <span className="label text-right">{p.year}</span>
            </>
          );
          const props = {
            href: projectHref(p),
            onPointerEnter: () => setHover(p.slug),
            onFocus: () => setHover(p.slug),
            onBlur: () => setHover(null),
            className: `group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-5 transition-opacity duration-300 md:grid-cols-[5rem_1fr_10rem_5rem] md:py-7 ${
              hover && hover !== p.slug ? "opacity-35" : ""
            }`,
            "data-cursor-label": external ? "Behance ↗" : "Open",
          };
          return (
            <li key={p.slug} className="border-b border-line">
              {external ? (
                <a {...props} target="_blank" rel="noopener noreferrer">
                  {row}
                </a>
              ) : (
                <Link {...props}>{row}</Link>
              )}
            </li>
          );
        })}
      </ul>

      <div
        ref={previewRef}
        className={`pointer-events-none fixed left-0 top-0 z-30 hidden w-[20rem] md:block ${active ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        aria-hidden
      >
        {active && (
          <RemoteImage
            src={active.image}
            alt=""
            className="aspect-[16/10] w-full object-cover shadow-[0_30px_60px_-24px_rgba(14,15,26,0.6)]"
          />
        )}
      </div>
    </>
  );
}
