"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RemoteImage from "@/components/ui/RemoteImage";
import Reveal from "@/components/ui/Reveal";
import { getLenis } from "@/utils/lenis";

/**
 * The project images as a two-column wall. Click one to open it full screen; arrow keys (or a swipe)
 * move through them, Esc closes.
 */
export default function Gallery({ images, label }: { images: string[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const total = images.length;

  const go = useCallback((delta: number) => setOpen((i) => (i === null ? i : (i + delta + total) % total)), [total]);

  useEffect(() => {
    if (open === null) return;
    document.body.dataset.lightbox = "1";
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      delete document.body.dataset.lightbox;
      getLenis()?.start();
    };
  }, [open, go]);

  // Warm up the neighbours so the arrows feel instant.
  useEffect(() => {
    if (open === null) return;
    for (const d of [-1, 1]) {
      const img = new Image();
      img.src = images[(open + d + total) % total];
    }
  }, [open, images, total]);

  return (
    <>
      <div className="columns-1 gap-4 md:columns-2 md:gap-6">
        {images.map((src, i) => (
          <Reveal key={src} className="mb-4 break-inside-avoid md:mb-6" delay={(i % 2) * 90}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block w-full overflow-hidden bg-paper-2 text-left"
              aria-label={`Open image ${i + 2} of ${total + 1}`}
              data-cursor-label="Zoom"
            >
              <RemoteImage
                src={src}
                alt={`${label}, image ${i + 2}`}
                loading="lazy"
                className="w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/10" />
            </button>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-[80] flex items-center justify-center bg-deep/95 p-4 md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${label} image viewer`}
            onPointerDown={(e) => (touch.current = { x: e.clientX, y: e.clientY })}
            onPointerUp={(e) => {
              const t = touch.current;
              touch.current = null;
              if (!t) return;
              const dx = e.clientX - t.x;
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - t.y) * 1.5) go(dx < 0 ? 1 : -1);
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={open}
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
                className="flex max-h-full max-w-full items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <RemoteImage
                  src={images[open]}
                  alt={`${label}, image ${open + 2}`}
                  className="max-h-[86svh] max-w-[92vw] select-none object-contain shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]"
                />
              </motion.div>
            </AnimatePresence>

            <p className="label pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-on-deep/70 md:top-7">
              {String(open + 2).padStart(2, "0")} / {String(total + 1).padStart(2, "0")}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(null);
              }}
              className="absolute right-4 top-4 rounded-full bg-on-deep/10 px-4 py-2 text-[0.75rem] font-medium tracking-normal text-on-deep ring-1 ring-on-deep/20 transition-colors hover:bg-paper hover:text-ink md:right-8 md:top-6"
            >
              Close · Esc
            </button>
            {[-1, 1].map((d) => (
              <button
                key={d}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(d);
                }}
                aria-label={d < 0 ? "Previous image" : "Next image"}
                className={`absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-on-deep/10 text-on-deep ring-1 ring-on-deep/20 transition-colors hover:bg-paper hover:text-ink md:flex ${d < 0 ? "left-6" : "right-6"}`}
              >
                {d < 0 ? "←" : "→"}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
