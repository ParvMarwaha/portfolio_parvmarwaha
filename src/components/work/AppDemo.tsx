"use client";

import { useEffect, useState } from "react";
import { getLenis } from "@/utils/lenis";

/**
 * The real app, running in the page inside a phone. It is a web build of the same code (public/varnmala-app,
 * public/noto-app) in a demo mode: no account, made-up or fresh data kept only in this browser. It loads when asked, so
 * it never slows the page or pulls the scroll. On a phone it opens on its own, full screen, where it feels like the app.
 * `reset`: the beginnings of the browser-storage keys the app writes, cleared by "Start over".
 */
export default function AppDemo({
  src,
  poster,
  name,
  tips,
  note,
  reset,
  accent = "#FF5C00",
  onAccent = "#ffffff",
}: {
  src: string;
  poster: string;
  name: string;
  tips: string[];
  note: string;
  reset: string[];
  accent?: string;
  onAccent?: string;
}) {
  const [on, setOn] = useState(false);
  const [run, setRun] = useState(0);

  // The app takes focus as it starts and the browser scrolls to it: hold the page where it was until the reader
  // scrolls themselves.
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
    window.addEventListener("scroll", hold, { passive: true });
    window.addEventListener("wheel", release, { passive: true });
    const end = window.setTimeout(release, 4000);
    return () => {
      clearTimeout(end);
      window.removeEventListener("scroll", hold);
      window.removeEventListener("wheel", release);
    };
  }, [on, run]);

  const restart = () => {
    try {
      for (const k of Object.keys(localStorage)) if (reset.some((r) => k.startsWith(r))) localStorage.removeItem(k);
    } catch {}
    setRun((r) => r + 1);
  };

  return (
    <>
      <div className="hidden items-center gap-16 md:grid md:grid-cols-[352px_1fr]">
        <div className="relative aspect-[430/932] w-[352px] overflow-hidden rounded-[2.75rem] bg-paper shadow-[0_40px_80px_-40px_rgba(14,15,26,.55)] ring-[7px] ring-ink">
          {on ? (
            // The app lays itself out for a 430 × 932 phone, then the phone is scaled to fit the frame.
            <iframe
              key={run}
              src={src}
              title={`${name}, the app`}
              className="absolute left-0 top-0 origin-top-left border-0"
              style={{ width: 430, height: 932, transform: `scale(${352 / 430})` }}
            />
          ) : (
            <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 block w-full" data-cursor-label="Play">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-ink/30 transition-colors duration-300 group-hover:bg-ink/40" aria-hidden />
              <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-paper py-3 pl-3 pr-5 text-[0.9375rem] font-medium tracking-tight text-ink shadow-lg transition-transform duration-300 group-hover:scale-105">
                <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: accent, color: onAccent }} aria-hidden>
                  <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3 fill-current">
                    <path d="M2 1.2v9.6L10.4 6z" />
                  </svg>
                </span>
                Open the app
              </span>
            </button>
          )}
        </div>
        <div>
          <p className="text-[0.8125rem] text-mute">Try it</p>
          <ul className="mt-3 grid gap-3 text-[0.9375rem] leading-relaxed text-ink/75">
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-6 max-w-[24rem] text-[0.8125rem] leading-relaxed text-mute">
            {note}
          </p>
          {on && (
            <button
              type="button"
              onClick={restart}
              className="mt-6 text-[0.875rem] font-medium underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
            >
              Start over
            </button>
          )}
        </div>
      </div>

      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-4 rounded-[0.875rem] bg-paper p-5 ring-1 ring-ink/10 md:hidden"
      >
        <span>
          <span className="block text-[0.8125rem] text-mute">The app, in your browser</span>
          <span className="mt-0.5 block text-[1rem] font-medium tracking-tight">Try {name}</span>
        </span>
        <span className="shrink-0 rounded-full px-4 py-2.5 text-[0.875rem] font-medium" style={{ background: accent, color: onAccent }}>
          Open ↗
        </span>
      </a>
    </>
  );
}
