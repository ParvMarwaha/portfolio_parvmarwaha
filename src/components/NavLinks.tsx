"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { getLenis, rem } from "@/utils/lenis";

export const LINKS = [
  { label: "Home", href: "/", active: (p: string) => p === "/" },
  { label: "Work", href: "/#work", active: (p: string) => p.startsWith("/work") },
  { label: "Lab", href: "/lab", active: (p: string) => p === "/lab" },
  { label: "About", href: "/about", active: (p: string) => p === "/about" },
  { label: "Contact", href: "/contact", active: (p: string) => p === "/contact" },
];

/** The label rolls up and is replaced by a copy of itself on hover. */
function Roll({ children }: { children: string }) {
  return (
    <span className="relative block overflow-hidden" style={{ height: "1.25em" }}>
      <span className="block transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover/link:-translate-y-full group-focus-visible/link:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-x-0 top-full block transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover/link:-translate-y-full group-focus-visible/link:-translate-y-full"
      >
        {children}
      </span>
    </span>
  );
}

/**
 * The main navigation, set up like a design file: whichever link you point at gets a selection box with
 * corner handles and a size tag, and the box slides between links. At rest it stays on the current page.
 */
export default function NavLinks({ pathname }: { pathname: string }) {
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const boxRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  const active = LINKS.findIndex((l) => l.active(pathname));

  // Imperative on purpose: the box follows the pointer, so it should not go through React state.
  const moveTo = (i: number) => {
    const box = boxRef.current;
    const el = i >= 0 ? itemRefs.current[i] : null;
    if (!box) return;
    if (!el) {
      box.style.opacity = "0";
      return;
    }
    box.style.transition = placed.current ? "" : "none";
    box.style.opacity = "1";
    box.style.width = `${el.offsetWidth}px`;
    box.style.height = `${el.offsetHeight}px`;
    box.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
    if (tagRef.current) tagRef.current.textContent = `${el.offsetWidth} × ${el.offsetHeight}`;
    placed.current = true;
  };

  useEffect(() => {
    moveTo(active);
    const again = () => moveTo(active);
    window.addEventListener("resize", again);
    void document.fonts?.ready.then(again);
    return () => window.removeEventListener("resize", again);
  }, [active]);

  return (
    <nav
      className="relative flex gap-0.5 rounded-full bg-paper/85 p-1.5 ring-1 ring-ink/10 backdrop-blur-md"
      aria-label="Primary"
      onPointerLeave={() => moveTo(active)}
    >
      {/* The selection box: two-tone outline, four square handles, and a size tag like a design tool's */}
      <span
        ref={boxRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 opacity-0 transition-[transform,width,height,opacity] duration-500 ease-[cubic-bezier(0.7,0,0.2,1)]"
      >
        <span className="absolute inset-0 rounded-[0.1875rem] border-[1.5px] border-cobalt" />
        {["-left-[0.1875rem] -top-[0.1875rem]", "-right-[0.1875rem] -top-[0.1875rem]", "-left-[0.1875rem] -bottom-[0.1875rem]", "-right-[0.1875rem] -bottom-[0.1875rem]"].map((pos) => (
          <span key={pos} className={`absolute h-[0.375rem] w-[0.375rem] border border-cobalt bg-paper ${pos}`} />
        ))}
        <span
          ref={tagRef}
          className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-[0.1875rem] bg-cobalt px-1.5 py-0.5 text-[0.625rem] font-medium leading-none tracking-normal text-paper"
        />
      </span>

      {LINKS.map((l, i) => (
        <Link
          key={l.href}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          href={l.href}
          onPointerEnter={() => moveTo(i)}
          onFocus={() => moveTo(i)}
          onBlur={() => moveTo(active)}
          onClick={(e) => {
            // Already on the home page: glide to the work section instead of jumping.
            if (l.href === "/#work" && pathname === "/") {
              e.preventDefault();
              const el = document.getElementById("work");
              if (el) getLenis()?.scrollTo(el, { offset: -rem(84), duration: 1.4 });
            }
          }}
          className={`group/link relative z-10 flex items-start gap-1 px-4 py-2 text-[0.8125rem] font-medium tracking-normal outline-none transition-colors ${
            i === active ? "text-ink" : "text-ink/60 hover:text-ink"
          }`}
          aria-current={i === active ? "page" : undefined}
        >
          <Roll>{l.label}</Roll>
          <span aria-hidden className="mt-[0.0625rem] text-[0.5rem] leading-none opacity-40">
            {String(i + 1).padStart(2, "0")}
          </span>
        </Link>
      ))}
    </nav>
  );
}
