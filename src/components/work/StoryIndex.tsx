"use client";

import { useEffect, useRef, useState } from "react";
import { getLenis, rem } from "@/utils/lenis";

/**
 * The case study at a glance: every section on its own line, the one you are reading marked, and a thin bar that
 * fills as you go. A click jumps to that section. Beside the column on wide screens; above it on smaller ones.
 */
export default function StoryIndex({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const barRef = useRef<HTMLSpanElement>(null);

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
    <nav aria-label="On this page" className="relative pl-4">
      <span className="absolute inset-y-0 left-0 w-px bg-line" aria-hidden />
      <span ref={barRef} className="absolute inset-y-0 left-0 w-px origin-top bg-ink transition-transform duration-150" style={{ transform: "scaleY(0)" }} aria-hidden />
      <p className="mb-3 text-[0.8125rem] text-mute">At a glance</p>
      <ol className="grid gap-1.5">
        {sections.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => go(s.id)}
              aria-current={active === s.id ? "true" : undefined}
              className={`text-left text-[0.875rem] tracking-tight transition-colors ${active === s.id ? "font-medium text-ink" : "text-mute hover:text-ink"}`}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
