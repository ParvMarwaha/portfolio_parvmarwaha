"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { projects, displayTitle, projectHref, projectsOpenOnBehance, TYPES, type Project, type ProjectType } from "@/content/projects";
import RemoteImage from "@/components/ui/RemoteImage";
import { usePageEnter } from "./usePageEnter";

const filters: ("All" | ProjectType)[] = ["All", ...TYPES];

/**
 * One project as a frame on the canvas: the frame's name above it (like a design file), the cover, and on hover the
 * frame gets selected and a comment card with the summary and a way in appears.
 */
function Frame({ project, onOpen }: { project: Project; onOpen: (href: string, el: HTMLElement) => void }) {
  const href = projectHref(project);
  const external = projectsOpenOnBehance();
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Wipe the picture in the first time the frame scrolls into view (on a phone it fades up instead: a clip-path wipe
  // repaints the whole picture every frame, which stutters while scrolling).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.shown = "1";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const parallax = (e: React.PointerEvent<HTMLElement>) => {
    const img = imgRef.current;
    if (!img || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    img.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5) * 2));
    img.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const settle = () => {
    imgRef.current?.style.setProperty("--px", "0");
    imgRef.current?.style.setProperty("--py", "0");
  };

  const body = (
    <>
      <p className="mb-2 flex items-baseline justify-between gap-4 text-[0.875rem] tracking-tight">
        <span className="truncate font-medium text-ink">
          {displayTitle(project)}
          {external && <span className="sr-only"> (opens Behance in a new tab)</span>}
        </span>
        <span className="shrink-0 text-mute">
          {project.type} · {project.year}
        </span>
      </p>
      <div className="relative">
        <div
          data-card-image
          onPointerMove={parallax}
          onPointerLeave={settle}
          className="relative aspect-video overflow-hidden bg-paper shadow-[0_1px_2px_rgba(14,15,26,0.08),0_18px_40px_-26px_rgba(14,15,26,0.45)] [clip-path:inset(0_0_100%_0)] [transition:clip-path_1100ms_cubic-bezier(0.2,0.9,0.2,1)] group-data-[shown=1]/card:[clip-path:inset(0)] pointer-coarse:translate-y-6 pointer-coarse:opacity-0 pointer-coarse:[clip-path:none] pointer-coarse:[transition:opacity_700ms_ease-out,translate_700ms_cubic-bezier(0.2,0.9,0.2,1)] pointer-coarse:group-data-[shown=1]/card:translate-y-0 pointer-coarse:group-data-[shown=1]/card:opacity-100"
        >
          <RemoteImage
            ref={imgRef}
            src={project.image}
            alt={`${displayTitle(project)} cover`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out"
            style={{ transform: "translate3d(calc(var(--px, 0) * -8px), calc(var(--py, 0) * -6px), 0) scale(1.04)" }}
          />
        </div>

        {/* hover: the frame is selected */}
        <span className="pointer-events-none absolute -inset-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
          <span className="absolute inset-0 border-[1.5px] border-cobalt" />
          {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map((c) => (
            <span key={c} className={`absolute h-2.5 w-2.5 border-[1.5px] border-cobalt bg-paper ${c}`} />
          ))}
        </span>

        {/* hover: a comment pinned to the frame, with what it is and the way in */}
        <span className="pointer-events-none absolute bottom-4 left-4 max-w-[min(22rem,calc(100%-2rem))] translate-y-2 rounded-[0.875rem] rounded-bl-[0.25rem] bg-paper p-3.5 text-ink opacity-0 shadow-[0_18px_40px_-18px_rgba(14,15,26,0.55)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="block text-[0.875rem] leading-snug">{project.summary}</span>
          <span className="mt-2.5 flex items-center justify-between gap-4">
            <span className="label truncate text-mute">{project.tools.join(" · ")}</span>
            <span className="label shrink-0 text-cobalt">{external ? "Behance ↗" : "Open ↗"}</span>
          </span>
        </span>
      </div>
    </>
  );

  return (
    <div ref={rootRef} className="group/card">
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="group block" data-cursor-label="Open">
          {body}
        </a>
      ) : (
        <Link
          href={href}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            const frame = e.currentTarget.querySelector<HTMLElement>("[data-card-image]");
            if (frame) onOpen(href, frame);
            else window.location.assign(href);
          }}
          className="group block"
          data-no-curtain
          data-cursor-label="Open"
        >
          {body}
        </Link>
      )}
    </div>
  );
}

/** All the work as frames on the canvas, with page-tab style filters. The words in the intro can pick a filter too. */
export default function WorkGrid() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const { enter, overlay } = usePageEnter();
  const rows = projects.filter((p) => filter === "All" || p.type === filter);

  useEffect(() => {
    const onFilter = (e: Event) => setFilter((e as CustomEvent<ProjectType>).detail);
    window.addEventListener("pm:filter", onFilter);
    return () => window.removeEventListener("pm:filter", onFilter);
  }, []);

  return (
    <section id="work" className="scroll-mt-24 px-4 pb-20 md:px-6 md:pb-28" aria-label="Work">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 md:mb-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="Filter by type">
          {filters.map((f) => {
            const n = f === "All" ? projects.length : projects.filter((p) => p.type === f).length;
            const on = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={on}
                className={`relative pb-1 text-[0.9375rem] font-medium tracking-tight transition-colors ${on ? "text-ink" : "text-mute hover:text-ink"}`}
              >
                {f === "All" ? "All work" : f}
                <sup className="ml-0.5 text-[0.625rem] text-mute">{n}</sup>
                <span className={`absolute inset-x-0 -bottom-px h-[2px] bg-cobalt transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0"}`} />
              </button>
            );
          })}
        </div>
        <Link href="/work" className="text-[0.875rem] font-medium tracking-tight text-mute transition-colors hover:text-ink">
          View as a list ↗
        </Link>
      </div>

      <motion.ul layout className="grid items-start gap-x-6 gap-y-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16">
        <AnimatePresence mode="popLayout">
          {rows.map((p) => (
            <motion.li
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}
            >
              <Frame project={p} onOpen={enter} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {overlay}
    </section>
  );
}
