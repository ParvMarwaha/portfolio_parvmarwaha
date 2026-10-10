"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { projects, numberOf, displayTitle, projectHref, projectsOpenOnBehance, TYPES, type Project, type ProjectType } from "@/content/projects";
import RemoteImage from "@/components/ui/RemoteImage";
import { usePageEnter } from "./usePageEnter";

const filters: ("All" | ProjectType)[] = ["All", ...TYPES];

function Card({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (href: string, el: HTMLElement) => void;
}) {
  const href = projectHref(project);
  const external = projectsOpenOnBehance();
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Wipe the picture in the first time the card scrolls into view.
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
        <div
          data-card-image
          onPointerMove={parallax}
          onPointerLeave={settle}
          className="relative aspect-video overflow-hidden bg-paper-2 shadow-[0_0_0_1px_rgba(14,15,26,0.1),0_24px_48px_-28px_rgba(14,15,26,0.5)] transition-shadow duration-500 [clip-path:inset(0_0_100%_0)] [transition:clip-path_1100ms_cubic-bezier(0.2,0.9,0.2,1),box-shadow_500ms] group-hover:shadow-[0_0_0_1px_rgba(14,15,26,0.1),0_44px_70px_-30px_rgba(14,15,26,0.6)] group-data-[shown=1]/card:[clip-path:inset(0)]"
        >
          <RemoteImage
            ref={imgRef}
            src={project.image}
            alt={`${displayTitle(project)} cover`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out"
            style={{ transform: "translate3d(calc(var(--px, 0) * -8px), calc(var(--py, 0) * -6px), 0) scale(1.04)" }}
          />
          <span
            className="absolute bottom-3 left-3 translate-y-2 rounded-full px-4 py-2 text-[0.75rem] font-medium tracking-normal text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            style={{ background: project.accent }}
          >
            {external ? "View on Behance ↗" : "View project ↗"}
          </span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="label flex items-center gap-2 text-mute">
              <span className="h-2 w-2 rounded-full" style={{ background: project.accent }} />
              {numberOf(project)}
              <span aria-hidden>·</span>
              {project.type}
            </p>
            <h3 className="mt-1.5 text-2xl font-medium leading-[1.05] tracking-tighter md:text-3xl">
              {displayTitle(project)}
              {external && <span className="sr-only"> (opens Behance in a new tab)</span>}
            </h3>
            <p className="mt-2 max-w-md text-[0.9375rem] leading-snug text-mute">{project.summary}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="label text-mute">{project.year}</p>
            <p className="label mt-1.5 hidden whitespace-nowrap text-mute lg:block">{project.tools.join(" · ")}</p>
          </div>
        </div>
    </>
  );

  return (
    <div ref={rootRef} className="group/card">
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="group block" data-cursor-label="Behance ↗">
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

/** All the work, in plain sight: big covers, what each one is, and one click to the page. */
export default function WorkGrid() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [hovered, setHovered] = useState<string | null>(null);
  const { enter, overlay } = usePageEnter();
  const rows = projects.filter((p) => filter === "All" || p.type === filter);

  // The "What I do" columns above can send us here with a type already picked.
  useEffect(() => {
    const onFilter = (e: Event) => setFilter((e as CustomEvent<ProjectType>).detail);
    window.addEventListener("pm:filter", onFilter);
    return () => window.removeEventListener("pm:filter", onFilter);
  }, []);

  return (
    <section id="work" className="scroll-mt-20 px-4 pb-20 pt-20 md:px-6 md:pb-28 md:pt-32" aria-label="Selected work">
      <div className="mx-auto max-w-[85rem]">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label mb-4 text-mute">{String(projects.length).padStart(2, "0")} projects</p>
            <h2 className="text-5xl font-medium leading-[0.92] tracking-tighter md:text-[5.5rem]">
              Selected <em className="font-display italic text-cobalt">work</em>
            </h2>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
              {filters.map((f) => {
                const n = f === "All" ? projects.length : projects.filter((p) => p.type === f).length;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`rounded-full px-4 py-1.5 text-[0.8125rem] font-medium tracking-normal ring-1 transition-colors ${
                      filter === f ? "bg-ink text-paper ring-ink" : "text-ink/70 ring-ink/20 hover:text-ink hover:ring-ink/50"
                    }`}
                  >
                    {f} <span className="opacity-50">{n}</span>
                  </button>
                );
              })}
            </div>
            <p className="label text-mute">
              <Link href="/work" className="border-b border-ink/40 pb-0.5 text-ink transition-colors hover:border-vermilion hover:text-vermilion">
                View as a list
              </Link>
            </p>
          </div>
        </div>

        <motion.ul
          layout
          onPointerLeave={() => setHovered(null)}
          className="grid items-start gap-x-6 gap-y-12 md:grid-cols-2 md:gap-y-16"
        >
          <AnimatePresence mode="popLayout">
            {rows.map((p) => (
              <motion.li
                key={p.slug}
                layout
                onPointerEnter={() => setHovered(p.slug)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: hovered && hovered !== p.slug ? 0.5 : 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}
              >
                <Card project={p} onOpen={enter} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
      {overlay}
    </section>
  );
}
