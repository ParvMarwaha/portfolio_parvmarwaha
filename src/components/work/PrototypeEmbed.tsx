"use client";

import { useEffect, useState } from "react";
import RemoteImage from "@/components/ui/RemoteImage";
import { getLenis } from "@/utils/lenis";

/**
 * A Figma prototype, playable in the page. It loads only when asked to (a click on its poster), so the heavy Figma
 * viewer never slows the page or pulls the scroll towards itself while loading. On a phone an embedded prototype
 * catches every swipe and the page stops scrolling, so there it is a button that opens the prototype on its own.
 * `src` is a Figma share link (www.figma.com/proto/...) or an embed link (embed.figma.com/proto/...).
 */
export default function PrototypeEmbed({ src, title, poster, height = "80svh" }: { src: string; title: string; poster?: string; height?: string }) {
  const [on, setOn] = useState(false);
  let embed = src.replace("://www.figma.com/", "://embed.figma.com/");
  // Figma's embed wants to know where it is shown.
  if (!embed.includes("embed-host=")) embed += `${embed.includes("?") ? "&" : "?"}embed-host=share`;
  const open = src.replace("://embed.figma.com/", "://www.figma.com/");

  // Figma's viewer grabs focus as it loads, and the browser scrolls the page to it. Hold the page where the reader
  // was until they scroll themselves (or the viewer has settled).
  useEffect(() => {
    if (!on) return;
    const y = window.scrollY;
    let held = true;
    const hold = () => {
      if (held && Math.abs(window.scrollY - y) > 1) {
        getLenis()?.scrollTo(y, { immediate: true, force: true } as never);
        window.scrollTo(0, y);
      }
    };
    const release = () => (held = false);
    const opts = { passive: true } as const;
    window.addEventListener("scroll", hold, opts);
    window.addEventListener("wheel", release, opts);
    window.addEventListener("touchstart", release, opts);
    const end = window.setTimeout(release, 6000);
    return () => {
      clearTimeout(end);
      window.removeEventListener("scroll", hold);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
    };
  }, [on]);

  return (
    <>
      <div className="relative hidden overflow-hidden rounded-[0.875rem] bg-paper-2 ring-1 ring-ink/10 md:block" style={{ height }}>
        {on ? (
          <iframe src={embed} title={title} allowFullScreen className="h-full w-full border-0" />
        ) : (
          <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 block w-full" data-cursor-label="Play">
            {poster && (
              <RemoteImage
                src={poster}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.02]"
              />
            )}
            <span className="absolute inset-0 bg-ink/25 transition-colors duration-300 group-hover:bg-ink/35" aria-hidden />
            <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full bg-paper py-3 pl-3 pr-5 text-[0.9375rem] font-medium tracking-tight text-ink shadow-lg transition-transform duration-300 group-hover:scale-105">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-paper" aria-hidden>
                <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3 fill-current">
                  <path d="M2 1.2v9.6L10.4 6z" />
                </svg>
              </span>
              Play the prototype
            </span>
          </button>
        )}
      </div>
      <a
        href={open}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-4 rounded-[0.875rem] bg-paper-2 p-5 ring-1 ring-ink/10 md:hidden"
      >
        <span>
          <span className="block text-[0.8125rem] text-mute">Figma prototype</span>
          <span className="mt-0.5 block text-[1rem] font-medium tracking-tight">Try the clickable prototype</span>
        </span>
        <span className="shrink-0 rounded-full bg-ink px-4 py-2.5 text-[0.875rem] font-medium text-paper">Open ↗</span>
      </a>
    </>
  );
}
