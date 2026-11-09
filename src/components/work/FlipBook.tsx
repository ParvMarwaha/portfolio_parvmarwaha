"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A book you can leaf through. On wide screens it opens as spreads (the cover alone on the right, then pairs, the back
 * cover alone on the left) and a page turns over the spine; on phones it is one page at a time. Click the right or left
 * half, use the arrows or the keyboard, or jump to a chapter. Only the pages in view, and the next few, are loaded.
 */

type Chapter = { label: string; page: number };

export default function FlipBook({
  pages,
  ratio,
  chapters = [],
  title,
}: {
  /** Image URLs, page 1 first. */
  pages: string[];
  /** One page's width / height. */
  ratio: number;
  chapters?: Chapter[];
  title: string;
}) {
  const n = pages.length;
  const wrapRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<HTMLDivElement>(null);
  const [single, setSingle] = useState(false);
  const [full, setFull] = useState(false);
  // In spread mode `at` is the spread (0 = cover); in single mode it is the page index (0 = page 1).
  const [at, setAt] = useState(0);
  const [turn, setTurn] = useState<{ to: number; dir: 1 | -1 } | null>(null);

  const spreads = Math.floor(n / 2) + 1;
  const last = single ? n - 1 : spreads - 1;
  // Page numbers (1-based) shown on each side of a spread; 0 = no page there.
  const left = (s: number) => (s * 2 <= n && s > 0 ? s * 2 : 0);
  const right = (s: number) => (s * 2 + 1 <= n ? s * 2 + 1 : 0);
  const src = (p: number) => (p > 0 ? pages[p - 1] : "");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => {
      setSingle((was) => {
        if (was !== mq.matches) {
          // Keep the same page in view when the layout changes.
          setAt((a) => (mq.matches ? Math.max(0, (was ? a + 1 : left(a) || right(a)) - 1) : Math.floor((was ? a + 1 : a) / 2)));
        }
        return mq.matches;
      });
    };
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  // Warm the pages a turn or two ahead and behind.
  useEffect(() => {
    const near = single ? [at - 1, at + 1, at + 2].map((i) => i + 1) : [at - 1, at + 1, at + 2].flatMap((s) => [left(s), right(s)]);
    near.forEach((p) => {
      if (p > 0 && p <= n) new Image().src = src(p);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, single]);

  const go = useCallback(
    (to: number) => {
      to = Math.max(0, Math.min(last, to));
      if (turn || to === at) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setAt(to);
      setTurn({ to, dir: to > at ? 1 : -1 });
    },
    [at, last, turn],
  );

  // Run the page turn once the leaf is on screen, then settle on the new spread.
  useEffect(() => {
    const leaf = leafRef.current;
    if (!turn || !leaf) return;
    const frames = single
      ? turn.dir > 0
        ? [{ transform: "rotateY(0deg)", opacity: 1 }, { transform: "rotateY(-95deg)", opacity: 0.3 }]
        : [{ transform: "rotateY(-95deg)", opacity: 0.3 }, { transform: "rotateY(0deg)", opacity: 1 }]
      : [{ transform: "rotateY(0deg)" }, { transform: `rotateY(${turn.dir > 0 ? -180 : 180}deg)` }];
    const a = leaf.animate(frames, { duration: single ? 520 : 820, easing: "cubic-bezier(.45,.05,.3,1)", fill: "forwards" });
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setAt(turn.to);
      setTurn(null);
    };
    a.onfinish = finish;
    return () => {
      a.onfinish = null;
      a.cancel();
    };
  }, [turn, single]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    go(at + (e.key === "ArrowRight" ? 1 : -1));
  };

  // A swipe (or a drag with the mouse) across the book turns the page; the click that ends it is then ignored.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const onDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swiped.current = true;
      go(at + (dx < 0 ? 1 : -1));
    }
  };
  const tap = (step: 1 | -1) => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    go(at + step);
  };

  const toggleFull = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => {});
  };

  // What sits underneath while a page is turning, and on the leaf itself.
  let underL = 0,
    underR = 0,
    leafFront = 0,
    leafBack = 0;
  if (!single) {
    const t = turn?.to ?? at;
    if (!turn) {
      underL = left(at);
      underR = right(at);
    } else if (turn.dir > 0) {
      underL = left(at);
      underR = right(t);
      leafFront = right(at);
      leafBack = left(t);
    } else {
      underL = left(t);
      underR = right(at);
      leafFront = left(at);
      leafBack = right(t);
    }
  }

  const label = single
    ? `Page ${at + 1} of ${n}`
    : left(at) && right(at)
      ? `Pages ${left(at)}–${right(at)} of ${n}`
      : `Page ${left(at) || right(at)} of ${n}`;

  const chapterAt = (page: number) => (single ? page - 1 : Math.floor(page / 2));
  const currentPage = single ? at + 1 : right(at) || left(at);
  const currentChapter = [...chapters].reverse().find((c) => c.page <= currentPage);

  const pageImg = (p: number, cls = "") =>
    p ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src(p)} alt={`${title}, page ${p}`} draggable={false} decoding="async" className={`block h-full w-full select-none object-cover ${cls}`} />
    ) : null;

  return (
    <div
      ref={wrapRef}
      className={full ? "flex h-full w-full flex-col items-center justify-center gap-5 bg-[#1b1b1b] p-6 text-white" : ""}
      tabIndex={0}
      onKeyDown={onKey}
      aria-roledescription="flip book"
      aria-label={title}
    >
      <div
        className="relative mx-auto w-full touch-pan-y select-none"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => (swipe.current = null)}
        style={{
          aspectRatio: single ? `${ratio}` : `${ratio * 2}`,
          maxWidth: full ? `min(100%, calc((100svh - 8rem) * ${single ? ratio : ratio * 2}))` : undefined,
          perspective: single ? "1600px" : "3200px",
        }}
      >
        {single ? (
          <>
            <div className="absolute inset-0 overflow-hidden rounded-[0.5rem] shadow-[0_10px_30px_-12px_rgba(0,0,0,.35)] ring-1 ring-ink/10">
              {pageImg(turn ? (turn.dir > 0 ? turn.to + 1 : at + 1) : at + 1)}
            </div>
            {turn && (
              <div ref={leafRef} className="absolute inset-0 origin-left overflow-hidden rounded-[0.5rem]" style={{ backfaceVisibility: "hidden" }}>
                {pageImg(turn.dir > 0 ? at + 1 : turn.to + 1)}
              </div>
            )}
          </>
        ) : (
          <>
            {/* The open book: two pages and a soft fold at the spine */}
            <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[0.375rem]">
              {underL ? (
                <div className="h-full w-full shadow-[0_14px_40px_-16px_rgba(0,0,0,.4)]">{pageImg(underL)}</div>
              ) : null}
            </div>
            <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden rounded-r-[0.375rem]">
              {underR ? <div className="h-full w-full shadow-[0_14px_40px_-16px_rgba(0,0,0,.4)]">{pageImg(underR)}</div> : null}
            </div>
            {(underL || leafBack) && (underR || leafFront) ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-1/2 w-[8%] -translate-x-1/2"
                style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,.10) 45%, rgba(0,0,0,.16) 50%, rgba(0,0,0,.10) 55%, transparent)" }}
              />
            ) : null}

            {turn && (
              <div
                ref={leafRef}
                className={`absolute inset-y-0 w-1/2 ${turn.dir > 0 ? "left-1/2 origin-left" : "left-0 origin-right"}`}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
                  {pageImg(leafFront)}
                  <span aria-hidden className={`absolute inset-0 ${turn.dir > 0 ? "bg-gradient-to-r" : "bg-gradient-to-l"} from-black/10 to-transparent`} />
                </div>
                <div className="absolute inset-0 overflow-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  {pageImg(leafBack)}
                  <span aria-hidden className={`absolute inset-0 ${turn.dir > 0 ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-black/10 to-transparent`} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Click either half to turn */}
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => tap(-1)}
          disabled={at === 0}
          className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize disabled:cursor-default"
          data-cursor-label={at === 0 ? undefined : "Back"}
        />
        <button
          type="button"
          aria-label="Next page"
          onClick={() => tap(1)}
          disabled={at === last}
          className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize disabled:cursor-default"
          data-cursor-label={at === last ? undefined : "Turn"}
        />
      </div>

      {/* Controls */}
      <div className={`mx-auto mt-5 flex w-full flex-wrap items-center gap-x-4 gap-y-3 text-[0.8125rem] ${full ? "max-w-[60rem] text-white/70" : "text-mute"}`}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => go(at - 1)}
            disabled={at === 0}
            aria-label="Previous page"
            className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-current/20 transition-colors hover:bg-current/10 disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(at + 1)}
            disabled={at === last}
            aria-label="Next page"
            className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-current/20 transition-colors hover:bg-current/10 disabled:opacity-30"
          >
            →
          </button>
        </div>
        <span className="tabular-nums" aria-live="polite">
          {label}
        </span>

        <div className="ml-auto flex items-center gap-3">
          {chapters.length > 0 && (
            <label className="relative">
              <span className="sr-only">Jump to a chapter</span>
              <select
                value={currentChapter?.page ?? ""}
                onChange={(e) => go(chapterAt(Number(e.target.value)))}
                className={`max-w-[13rem] cursor-pointer appearance-none rounded-full py-2 pl-3.5 pr-8 ring-1 ring-current/20 ${full ? "bg-white/5 text-white" : "bg-transparent text-ink"}`}
              >
                <option value="" disabled>
                  Chapters
                </option>
                {chapters.map((c) => (
                  <option key={c.page} value={c.page} className="text-ink">
                    {c.label}
                  </option>
                ))}
              </select>
              <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                ↓
              </span>
            </label>
          )}
          <button type="button" onClick={toggleFull} className={`rounded-full px-3.5 py-2 ring-1 ring-current/20 transition-colors hover:bg-current/10 ${full ? "" : "text-ink"}`}>
            {full ? "Close" : "Full screen"}
          </button>
        </div>
      </div>
    </div>
  );
}
