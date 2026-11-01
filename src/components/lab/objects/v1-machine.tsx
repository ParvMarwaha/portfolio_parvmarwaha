"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { projects, projectHref, projectsOpenOnBehance } from "@/content/projects";
import { Coil, H, PackArt, REST_TOP, SHELF_H, TRAY_MAX, W, CELL_W, codeOf, packLeft, packTop, restRot } from "./v1-parts";
import { vendSound } from "./v1-sound";

const SHOWN = Math.min(projects.length, 8);
const SLOTS = 9; // a 3 x 3 grid; the ninth slot (C3) has never been stocked
const G = 2600; // gravity, in drawing units per second squared
const IDLE = "SELECT A PROJECT · POKE A PACK OR TYPE ITS CODE · NO CHANGE GIVEN";
/** Rough width of a display message in drawing units, and how long it takes to scroll past (and be read to its end). */
const textW = (n: number) => n * 6.6;
const scrollSec = (n: number) => (textW(n) + 37) / 36;
const readMs = (n: number) => (textW(n) > 80 ? 900 + ((textW(n) - 80) / 36) * 1000 + 1000 : 0);

type Status = { code: string; text: string; blink?: boolean };
type TrayItem = { id: number; i: number; slot: number; leaving?: "out" | "taken" };
type Falling = { id: number; i: number; slot: number };

/** Timers that are all cleared when the component goes away. */
function useLater() {
  const ids = useRef(new Set<number>());
  useEffect(() => {
    const set = ids.current;
    return () => {
      set.forEach((t) => window.clearTimeout(t));
      set.clear();
    };
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
    return id;
  }, []);
  const cancel = useCallback((id: number) => {
    window.clearTimeout(id);
    ids.current.delete(id);
  }, []);
  return [later, cancel] as const;
}

/**
 * The cover as a vending machine: my work is the stock. Pick a pack (click it, or key in its code) and the coil turns,
 * the pack drops into the tray and the tray's "Take it" link opens the project. The coin slot is the way to contact me.
 */
export default function VendingMachine() {
  const router = useRouter();
  const [later, cancel] = useLater();
  const rootRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const fallRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(false);
  const busyRef = useRef(false);
  const idRef = useRef(0);
  const stockRef = useRef<boolean[]>(Array.from({ length: SHOWN }, () => true));
  const trayRef = useRef<TrayItem[]>([]);
  const statusTimer = useRef(0);
  const entryTimer = useRef(0);
  const coinBusy = useRef(false);
  const sayTick = useRef(false);
  const landedRef = useRef<(f: Falling) => void>(() => {});

  const [stock, setStock] = useState<boolean[]>(() => Array.from({ length: SHOWN }, () => true));
  const [tray, setTray] = useState<TrayItem[]>([]);
  const [falling, setFalling] = useState<Falling | null>(null);
  const [spin, setSpin] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<{ i: number; tray: boolean } | null>(null);
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [say, setSay] = useState("");
  const [fresh, setFresh] = useState<number[]>([]);
  const [flapKey, setFlapKey] = useState(0);
  const [coin, setCoin] = useState(0);

  // Fit the drawing to the room it is given, off-screen pause, reduced motion. All DOM work, no React state.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fit = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      if (w <= 0 || h <= 0) return;
      const scale = Math.min(w / W, h / H, 1.3);
      root.style.setProperty("--s", scale.toFixed(4));
      // Small screens: the print on the packs and the display would be a few pixels high, so the CSS swaps in a bolder, simpler face.
      root.toggleAttribute("data-small", scale < 0.72);
      root.setAttribute("data-ready", "1");
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);

    let inView = true;
    const apply = () => root.setAttribute("data-off", String(!inView || document.hidden));
    const io = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      apply();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", apply);

    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = m.matches;
    const onMotion = () => {
      reducedRef.current = m.matches;
    };
    m.addEventListener("change", onMotion);
    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
      m.removeEventListener("change", onMotion);
    };
  }, []);

  // ---- the display ---------------------------------------------------------------------------------------------
  const flash = (s: Status, announce?: string, ms = 2600) => {
    ms = Math.max(ms, readMs(s.text.length));
    setStatus(s);
    if (announce) {
      // An invisible character flips each time, so the same message said twice is still announced twice.
      sayTick.current = !sayTick.current;
      setSay(announce + (sayTick.current ? "\u200b" : ""));
    }
    if (statusTimer.current) cancel(statusTimer.current);
    statusTimer.current = later(() => {
      statusTimer.current = 0;
      setStatus(null);
    }, ms);
  };

  /** Pointing at a pack reads it out, and that wins over a leftover message (but never over a vend in progress). */
  const aim = (h: { i: number; tray: boolean }) => {
    if (!busyRef.current && statusTimer.current) {
      cancel(statusTimer.current);
      statusTimer.current = 0;
      setStatus(null);
    }
    setHover(h);
  };

  // ---- the tray ------------------------------------------------------------------------------------------------
  const updateTray = (fn: (t: TrayItem[]) => TrayItem[]) => {
    const next = fn(trayRef.current);
    trayRef.current = next;
    setTray(next);
  };
  const markLeaving = (id: number, how: "out" | "taken", instant = false) => {
    if (instant) {
      updateTray((t) => t.filter((x) => x.id !== id));
      return;
    }
    setHover((h) => (h && h.tray ? null : h));
    updateTray((t) => t.map((x) => (x.id === id ? { ...x, leaving: how } : x)));
    later(() => updateTray((t) => t.filter((x) => x.id !== id)), 620);
  };
  /** The tray holds three: when it is full the oldest pack is pushed out to make room. */
  const evictIfFull = (instant: boolean) => {
    const live = trayRef.current.filter((t) => !t.leaving);
    if (live.length < TRAY_MAX) return;
    const oldest = live.reduce((a, b) => (a.id < b.id ? a : b));
    markLeaving(oldest.id, "out", instant);
  };
  /** The free place in the tray nearest to the pack's own column. */
  const claimSlot = (col: number) => {
    const used = new Set(trayRef.current.filter((t) => !t.leaving).map((t) => t.slot));
    let best = col;
    let bestDist = 99;
    for (let s = 0; s < TRAY_MAX; s++) {
      if (used.has(s)) continue;
      const d = Math.abs(s - col);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return best;
  };
  const setInStock = (idx: number, value: boolean) => {
    const s = stockRef.current.slice();
    s[idx] = value;
    stockRef.current = s;
    setStock(s);
  };

  // ---- vending -------------------------------------------------------------------------------------------------
  const onLanded = (f: Falling) => {
    updateTray((t) => [...t, { id: f.id, i: f.i, slot: f.slot }]);
    setFalling(null);
    setSel(null);
    busyRef.current = false;
    vendSound.ding();
    flash({ code: codeOf(f.i), text: "TAKE IT BELOW" }, `${projects[f.i].title} dropped into the tray. Use its Take it link to open the project.`, 4200);
  };
  useEffect(() => {
    landedRef.current = onLanded;
  });

  const drop = (idx: number) => {
    const next: Falling = { id: ++idRef.current, i: idx, slot: claimSlot(idx % 3) };
    setInStock(idx, false);
    setSpin(null);
    setFalling(next);
  };

  const vendSlot = (idx: number, viaPack = false) => {
    const code = codeOf(idx);
    const p = idx < SHOWN ? projects[idx] : null;
    if (!p) {
      vendSound.buzz();
      flash({ code, text: "NOTHING HERE YET ;)", blink: true }, `Slot ${code} is empty. More work soon.`);
      return;
    }
    if (busyRef.current) {
      vendSound.buzz();
      flash({ code: "..", text: "ONE AT A TIME!", blink: true });
      return;
    }
    if (!stockRef.current[idx]) {
      vendSound.buzz();
      flash({ code, text: "SOLD OUT ;) TRY RESTOCK", blink: true }, `${code}, ${p.title}, is sold out. Press restock to refill the shelves.`);
      return;
    }
    busyRef.current = true;
    setSel(idx);
    if (viaPack) {
      // Poking a pack presses its two keys for you: letter, then number, then the machine says yes.
      vendSound.key(Math.floor(idx / 3) + 2);
      later(() => vendSound.key((idx % 3) + 6), 100);
    }
    later(() => vendSound.ok(), viaPack ? 250 : 110);
    flash({ code, text: `VENDING ${p.title.toUpperCase()}` }, `Vending ${p.title}.`, 9000);

    if (reducedRef.current) {
      later(() => {
        evictIfFull(true);
        const slot = claimSlot(idx % 3);
        setInStock(idx, false);
        updateTray((t) => [...t, { id: ++idRef.current, i: idx, slot }]);
        setSel(null);
        busyRef.current = false;
        flash({ code, text: "TAKE IT BELOW" }, `${p.title} is in the tray. Use its Take it link to open the project.`, 4200);
      }, 300);
      return;
    }
    later(() => {
      setSpin(idx);
      vendSound.motor();
      evictIfFull(false);
    }, 320);
    later(() => drop(idx), 320 + 1250);
  };

  // The pack falls under gravity, bounces on the tray floor, wobbles and settles. One rAF loop writes straight to the element.
  useEffect(() => {
    if (!falling) return;
    const el = fallRef.current;
    if (!el) return;
    const f = falling;
    const x0 = packLeft(f.i % 3);
    const y0 = packTop(Math.floor(f.i / 3));
    const tx = packLeft(f.slot);
    const rest = restRot(f.id);
    const span = Math.max(1, REST_TOP - y0);
    let x = x0;
    let y = y0;
    let vy = 0;
    let rot = -1.5;
    let vr = 24;
    let reach = 0;
    let landed = 0;
    let elapsed = 0;
    let done = false;
    let raf = 0;
    let last = performance.now();
    const paint = () => {
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
    };
    const finish = () => {
      if (done) return;
      done = true;
      x = tx;
      y = REST_TOP;
      rot = rest;
      paint();
      landedRef.current(f);
    };
    const step = (now: number) => {
      const dt = Math.min(1 / 30, Math.max(0.001, (now - last) / 1000));
      last = now;
      elapsed += dt;
      vy += G * dt;
      y += vy * dt;
      if (y >= REST_TOP) {
        y = REST_TOP;
        if (vy > 150) {
          vendSound.thunk(vy / 1500);
          if (landed === 0) setFlapKey((k) => k + 1);
          vy = -vy * 0.3;
          landed++;
        } else vy = 0;
      }
      // Drift sideways down the chute toward its place in the tray (never back up on a bounce).
      reach = Math.max(reach, Math.min(1, Math.max(0, (y - y0) / span)));
      x = x0 + (tx - x0) * reach * reach * (3 - 2 * reach);
      if (landed) vr += (-260 * (rot - rest) - 18 * vr) * dt;
      rot += vr * dt;
      paint();
      if (elapsed > 4 || (landed > 0 && vy === 0 && Math.abs(rot - rest) < 0.25 && Math.abs(vr) < 4)) {
        finish();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    paint();
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [falling]);

  const onTake = (t: TrayItem) => {
    vendSound.take();
    flash({ code: codeOf(t.i), text: "ENJOY!" }, `Opening ${projects[t.i].title}.`, 1800);
    later(() => markLeaving(t.id, "taken"), 180);
  };

  const restock = () => {
    if (busyRef.current) {
      vendSound.buzz();
      flash({ code: "..", text: "ONE AT A TIME!", blink: true });
      return;
    }
    const empties = stockRef.current.map((s, i) => (s ? -1 : i)).filter((i) => i >= 0);
    if (!empties.length) {
      vendSound.key(1);
      flash({ code: "OK", text: "STILL FULL. GREEDY?" }, "Every shelf is already full.");
      return;
    }
    vendSound.restock();
    stockRef.current = stockRef.current.map(() => true);
    setStock(stockRef.current);
    setFresh(empties);
    later(() => setFresh([]), 1200);
    flash({ code: "OK", text: "FRESH STOCK!" }, "The shelves are restocked.");
  };

  // ---- the keypad ------------------------------------------------------------------------------------------------
  const press = (k: string) => {
    if (k === "CLR") {
      vendSound.key(0);
      setEntry("");
      return;
    }
    const isLetter = k === "A" || k === "B" || k === "C";
    vendSound.key(isLetter ? "ABC".indexOf(k) + 2 : "123".indexOf(k) + (entry ? 6 : 4));
    if (isLetter) {
      setEntry(k);
      if (entryTimer.current) cancel(entryTimer.current);
      entryTimer.current = later(() => {
        entryTimer.current = 0;
        setEntry("");
      }, 6000);
      return;
    }
    if (!entry) {
      flash({ code: "--", text: "PICK A LETTER FIRST" });
      return;
    }
    const idx = "ABC".indexOf(entry) * 3 + "123".indexOf(k);
    if (entryTimer.current) cancel(entryTimer.current);
    entryTimer.current = 0;
    setEntry("");
    vendSlot(idx);
  };
  const onRootKey = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (/^[ABC123]$/.test(k)) {
      e.preventDefault();
      press(k);
    } else if (k === "Backspace" || k === "Escape") setEntry("");
  };
  const moveFocus = (e: React.KeyboardEvent, i: number) => {
    const dx = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const dy = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    const r = Math.min(2, Math.max(0, Math.floor(i / 3) + dy));
    const c = Math.min(2, Math.max(0, (i % 3) + dx));
    cellRefs.current[r * 3 + c]?.focus();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const root = rootRef.current;
    if (!root) return;
    const r = root.getBoundingClientRect();
    if (r.width <= 0) return;
    root.style.setProperty("--gx", Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)).toFixed(3));
  };

  // ---- the coin slot ---------------------------------------------------------------------------------------------
  const onCoin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0) return;
    vendSound.clink();
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reducedRef.current) return; // let the link go straight away
    e.preventDefault();
    if (coinBusy.current) return;
    coinBusy.current = true;
    setCoin((c) => c + 1);
    flash({ code: "THX", text: "LET'S TALK!" }, "Coin inserted. Opening the contact page.", 2000);
    later(() => router.push("/contact"), 760);
    later(() => {
      coinBusy.current = false;
    }, 1600);
  };

  // ---- what the display shows --------------------------------------------------------------------------------------
  let shown: Status & { idle?: boolean };
  if (status) shown = status;
  else if (entry) shown = { code: `${entry}_`, text: "NOW A NUMBER 1-3" };
  else if (hover) {
    if (hover.i >= SHOWN) shown = { code: codeOf(hover.i), text: "EMPTY SLOT · SOON", blink: true };
    else {
      const p = projects[hover.i];
      const out = !hover.tray && !stock[hover.i];
      shown = {
        code: codeOf(hover.i),
        text: out ? "SOLD OUT ;)" : hover.tray ? `${p.title.toUpperCase()} · TAKE IT!` : `${p.title}${p.kind ? " " + p.kind : ""} · ${p.year}`.toUpperCase(),
        blink: out,
      };
    }
  } else shown = { code: "--", text: IDLE, idle: true };
  const marquee = shown.text.length > 10;
  const needRestock = stock.some((s) => !s);
  const litRow = entry ? "ABC".indexOf(entry) : -1;
  const ext = projectsOpenOnBehance() ? ({ target: "_blank", rel: "noopener noreferrer" } as const) : {};

  return (
    <div
      ref={rootRef}
      className="vend-root"
      role="group"
      aria-label="Vending machine stocked with my projects"
      onKeyDown={onRootKey}
      onPointerMove={onPointerMove}
    >
      <p className="sr-only">
        Pick a pack to vend it, or key in its code on the keypad. Take it from the tray to open the project. The coin slot opens the contact page.
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {say}
      </p>

      <div className="vend-stage">
        <div className="vend-enter">
          <div className="vend-floor" aria-hidden />
          <div className="vend-tilt">
            <div className="vend-foot" style={{ left: 44 }} aria-hidden />
            <div className="vend-foot" style={{ left: 360 }} aria-hidden />
            <div className="vend-body" aria-hidden />

            {/* the lit sign */}
            <div className="vend-sign" aria-hidden>
              <b>PARV MARWAHA</b>
              <i />
              <span>DESIGNER</span>
              <div className="vend-signdim" />
            </div>

            {/* the glass front: shelves, coils and packs */}
            <div className="vend-bezel" aria-hidden />
            <div className="vend-inner">
              {[0, 1, 2].map((r) => (
                <div key={r} aria-hidden>
                  <div className="vend-strip" style={{ top: SHELF_H * r }} />
                  <div className="vend-board" style={{ top: SHELF_H * r + 128 }} />
                </div>
              ))}
              {Array.from({ length: SLOTS }, (_, i) => {
                const r = Math.floor(i / 3);
                const c = i % 3;
                const p = i < SHOWN ? projects[i] : null;
                const has = !!p && stock[i];
                const code = codeOf(i);
                const freshAt = fresh.indexOf(i);
                const label = !p
                  ? `${code}, empty slot, coming soon`
                  : has
                    ? `${code}: ${p.title}${p.kind ? " " + p.kind : ""}, ${p.year}. Press to vend.`
                    : `${code}: ${p.title}, sold out. Press restock to refill.`;
                return (
                  <button
                    key={i}
                    ref={(el) => {
                      cellRefs.current[i] = el;
                    }}
                    type="button"
                    className="vend-cell"
                    style={{ left: CELL_W * c, top: SHELF_H * r }}
                    data-lit={sel === i ? "1" : undefined}
                    data-spin={spin === i ? "1" : undefined}
                    data-cursor-label={has ? `Vend ${code}` : undefined}
                    aria-label={label}
                    onClick={() => vendSlot(i, true)}
                    onPointerEnter={() => aim({ i, tray: false })}
                    onPointerLeave={() => setHover(null)}
                    onFocus={(e) => {
                      if (e.currentTarget.matches(":focus-visible")) aim({ i, tray: false });
                    }}
                    onBlur={() => setHover(null)}
                    onKeyDown={(e) => moveFocus(e, i)}
                  >
                    <Coil spinning={spin === i} />
                    {has && p && (
                      <span
                        className="vend-packwrap"
                        data-fresh={freshAt >= 0 ? "1" : undefined}
                        style={freshAt >= 0 ? { animationDelay: `${freshAt * 70}ms` } : undefined}
                      >
                        <span className="vend-shake">
                          <PackArt p={p} code={code} />
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
              {Array.from({ length: SLOTS }, (_, i) => {
                const r = Math.floor(i / 3);
                const c = i % 3;
                const gone = i >= SHOWN || !stock[i];
                return (
                  <div
                    key={i}
                    className="vend-chip"
                    style={{ left: CELL_W * c + 8, top: SHELF_H * r + 142 }}
                    data-lit={sel === i || litRow === r ? "1" : undefined}
                    aria-hidden
                  >
                    {codeOf(i)}
                    {gone && <em>{i >= SHOWN ? "SOON" : "SOLD OUT"}</em>}
                  </div>
                );
              })}
              <div className="vend-dim" />
            </div>

            {/* the pack in flight */}
            {falling && (
              <div
                ref={fallRef}
                className="vend-fall"
                aria-hidden
                style={{ transform: `translate3d(${packLeft(falling.i % 3)}px, ${packTop(Math.floor(falling.i / 3))}px, 0) rotate(-1.5deg)` }}
              >
                <PackArt p={projects[falling.i]} code={codeOf(falling.i)} />
              </div>
            )}

            {/* glass tint and reflections sit over the shelves */}
            <div className="vend-glassfx" aria-hidden>
              <div className="vend-refl" />
            </div>

            {/* the control panel */}
            <div className="vend-panel">
              <div className="vend-display" aria-hidden>
                <div className="vend-d1">{shown.code}</div>
                <div className={`vend-d2${shown.blink ? " b" : ""}`}>
                  {marquee ? (
                    <span key={shown.text} className="m" style={{ animationDuration: `${scrollSec(shown.text.length).toFixed(2)}s` }}>
                      <span>{shown.text}</span>
                      <span>{shown.text}</span>
                    </span>
                  ) : (
                    <span key={shown.text}>{shown.text}</span>
                  )}
                </div>
              </div>

              {["A", "B", "C"].map((k, n) => (
                <button key={k} type="button" className="vend-key" style={{ left: 7 + 34 * n, top: 82 }} onClick={() => press(k)} aria-label={`Key ${k}`}>
                  {k}
                </button>
              ))}
              {["1", "2", "3"].map((k, n) => (
                <button key={k} type="button" className="vend-key" style={{ left: 7 + 34 * n, top: 116 }} onClick={() => press(k)} aria-label={`Key ${k}`}>
                  {k}
                </button>
              ))}
              <button type="button" className="vend-key vend-clr" style={{ left: 7, top: 150 }} onClick={() => press("CLR")} aria-label="Clear the keypad">
                CLR
              </button>

              <Link href="/contact" className="vend-plate" onClick={onCoin} data-cursor-label="Let's talk" aria-label="Hire me: insert a coin to get in touch">
                <b>HIRE ME</b>
                <small style={{ top: 31 }}>1 COIN = 1 CHAT</small>
                <span className="vend-slot" />
                <small style={{ bottom: 12 }}>LET&apos;S TALK</small>
                <span className="vend-coinclip" aria-hidden>
                  <span key={coin} className="vend-coin" data-drop={coin > 0 ? "1" : undefined}>
                    <i />
                  </span>
                </span>
              </Link>

              <button type="button" className="vend-restock" data-need={needRestock ? "1" : undefined} onClick={restock} aria-label="Restock empty shelves">
                RESTOCK
              </button>

              <div className="vend-sticker" aria-hidden>
                No refunds.
                <br />
                Only revisions.
              </div>
              <div className="vend-grille" aria-hidden />
            </div>

            {/* the delivery tray */}
            <div className="vend-tray" aria-hidden />
            <div className="vend-hint" aria-hidden>
              ORDERS
              <br />
              LAND HERE
            </div>
            {tray.map((t) => {
              const p = projects[t.i];
              return (
                <div
                  key={t.id}
                  className="vend-tray-item"
                  style={{ transform: `translate3d(${packLeft(t.slot)}px, ${REST_TOP}px, 0) rotate(${restRot(t.id)}deg)` }}
                >
                  <div className={t.leaving ? `vend-${t.leaving}` : undefined}>
                    <a
                      href={projectHref(p)}
                      {...ext}
                      className="vend-take"
                      data-cursor-label="Take it"
                      aria-label={`Take it: open ${p.title}, ${p.year}`}
                      tabIndex={t.leaving ? -1 : undefined}
                      onClick={() => onTake(t)}
                      onPointerEnter={() => aim({ i: t.i, tray: true })}
                      onPointerLeave={() => setHover(null)}
                      onFocus={(e) => {
                        if (e.currentTarget.matches(":focus-visible")) aim({ i: t.i, tray: true });
                      }}
                      onBlur={() => setHover(null)}
                    >
                      <PackArt p={p} code={codeOf(t.i)} />
                      <span className="vend-tag">TAKE IT ↗</span>
                    </a>
                  </div>
                </div>
              );
            })}
            <div key={flapKey} className="vend-flap" data-swing={flapKey > 0 ? "1" : undefined} aria-hidden />
            <div className="vend-lip" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
