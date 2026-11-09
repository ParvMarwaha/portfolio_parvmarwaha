"use client";

import { useEffect, useRef, useState } from "react";
import { getLenis, rem } from "@/utils/lenis";

/**
 * The case study at a glance: every section on its own line, the one you are reading marked, and a thin bar that
 * fills as you go. A click jumps to that section. Beside the column on wide screens; above it on smaller ones.
 * With a mouse, hovering a line peeks at that section's picture: beside the list (`peek="side"`) or under it.
 */
export default function StoryIndex({
  sections,
  peek = "side",
}: {
  /** `fit`: how the preview fills the card; a long page or poster shows its top, a logo sits whole on cream. */
  sections: { id: string; label: string; preview?: string; fit?: "top" | "contain" }[];
  peek?: "side" | "below";
}) {
  const [active, setActive] = useState(sections[0]?.id);
  const [hover, setHover] = useState<{ i: number; y: number } | null>(null);
  const [warm, setWarm] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const shown = hover ? sections[hover.i]?.preview : undefined;

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
      if (!els.length) return;
      const line = window.innerHeight * 0.35;
      let current = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(current);
      const first = els[0].getBoundingClientRect().top + window.scrollY;
      const last = els[els.length - 1];
      const end = last.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
      const p = Math.min(1, Math.max(0, (window.scrollY - first + line) / Math.max(1, end - first + line)));
      if (barRef.current) barRef.current.style.transform = `scaleY(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [sections]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -rem(16), duration: 1.2 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      aria-label="On this page"
      className={`relative pl-4 ${peek === "side" ? "w-fit" : ""}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setWarm(true)}
      onPointerLeave={() => setHover(null)}
    >
      <span className="absolute inset-y-0 left-0 w-px bg-line" aria-hidden />
      <span ref={barRef} className="absolute inset-y-0 left-0 w-px origin-top bg-ink transition-transform duration-150" style={{ transform: "scaleY(0)" }} aria-hidden />
      <p className="mb-3 text-[0.8125rem] text-mute">At a glance</p>
      <ol ref={listRef} className="grid gap-1.5">
        {sections.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => go(s.id)}
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                const list = listRef.current?.parentElement?.getBoundingClientRect();
                const r = e.currentTarget.getBoundingClientRect();
                setHover({ i, y: list ? r.top - list.top + r.height / 2 : 0 });
              }}
              aria-current={active === s.id ? "true" : undefined}
              className={`text-left text-[0.875rem] tracking-tight transition-colors ${active === s.id ? "font-medium text-ink" : "text-mute hover:text-ink"}`}
            >
              <span className={`inline-block transition-transform duration-300 ${hover?.i === i ? "translate-x-1" : ""}`}>{s.label}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* The peek: every picture is in place (hidden) once a mouse arrives, so switching between them is instant */}
      {warm && sections.some((s) => s.preview) && (
        <div
          aria-hidden
          className={`pointer-events-none z-20 overflow-hidden rounded-[0.625rem] bg-paper-2 shadow-[0_20px_40px_-18px_rgba(14,15,26,.45)] ring-1 ring-ink/10 transition-[opacity,transform,scale] duration-300 ease-out ${
            peek === "side" ? "absolute left-full top-0 ml-10 w-56" : "absolute left-0 top-full mt-5 w-full"
          } ${shown ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
          style={peek === "side" ? { transform: `translateY(calc(${hover?.y ?? 0}px - 50%))` } : undefined}
        >
          <div className="relative aspect-[4/3]">
            {sections.map((s, i) =>
              s.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={s.id}
                  src={s.preview}
                  alt=""
                  decoding="async"
                  className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${
                    s.fit === "contain" ? "bg-[#FEFBF0] object-contain p-4" : s.fit === "top" ? "object-cover object-top" : "object-cover object-center"
                  } ${hover?.i === i ? "opacity-100" : "opacity-0"}`}
                />
              ) : null,
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
