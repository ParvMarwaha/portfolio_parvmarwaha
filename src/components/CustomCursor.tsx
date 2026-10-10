"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "@/utils/gsap";
import CursorGlyph from "@/components/ui/CursorGlyph";

/**
 * Design-tool cursor. The arrow tracks the pointer exactly; its tag trails a little and names what is
 * under it: set `data-cursor-label="Open"` on any element. While the canvas is being panned it reads "Panning".
 */
export default function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (!mounted || window.matchMedia("(pointer: coarse)").matches) return;
    const root = rootRef.current;
    const tag = tagRef.current;
    if (!root || !tag) return;

    const setX = gsap.quickSetter(root, "x", "px");
    const setY = gsap.quickSetter(root, "y", "px");
    gsap.set(root, { opacity: 0 });
    let shown = false;
    let label = "You";

    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      setX(e.clientX);
      setY(e.clientY);
      if (!shown) {
        shown = true;
        gsap.to(root, { opacity: 1, duration: 0.25 });
      }
    };

    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor-label]");
      const next = el?.dataset.cursorLabel ?? "You";
      if (next !== label) {
        label = next;
        tag.textContent = next;
      }
    };

    const panning = () => {
      const mode = document.body.dataset.panning;
      tag.textContent = mode === "1" ? "Panning" : mode === "move" ? "Moving" : label;
    };

    const leave = () => gsap.to(root, { opacity: 0, duration: 0.2 });
    const enter = () => shown && gsap.to(root, { opacity: 1, duration: 0.2 });

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    window.addEventListener("pointerdown", panning);
    window.addEventListener("pointerup", panning);
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", panning);
      window.removeEventListener("pointerup", panning);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
    };
  }, [mounted]);

  if (!mounted) return null;
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <div ref={rootRef} className="pointer-events-none fixed left-0 top-0 z-[9999]" style={{ viewTransitionName: "pm-cursor" }}>
      <CursorGlyph color="var(--cobalt)" label="You" tagRef={tagRef} />
    </div>
  );
}
