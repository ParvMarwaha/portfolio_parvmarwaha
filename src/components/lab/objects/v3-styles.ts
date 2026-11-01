/**
 * The look of the lid: aluminium, vinyl, light and shadow. Plain CSS because it leans on container units (cqw: 1% of the
 * lid's width, so the whole thing scales as one object), masks, and a few state selectors that are clumsy as utilities.
 * Only literal colours are used for materials (metal, white vinyl, shadows); the stickers' own art uses the site's palette tokens.
 */
export const LID_CSS = `
.lid3-lidbox { display: flex; width: 100%; justify-content: center; }
.lid3-drop { width: min(100%, max(15rem, calc((100svh - 17.5rem) / 1.3))); opacity: 0; }
@media (min-width: 1024px) {
  .lid3-lidbox { width: 70%; justify-content: flex-end; }
  .lid3-drop { width: min(100%, calc((100svh - 10.5rem) * 1.5625)); }
}

/* ---- the lid ---- */
.lid3-lid {
  position: relative;
  isolation: isolate;
  width: 100%;
  aspect-ratio: 100 / 64;
  container-type: inline-size;
  transform: rotate(-2.4deg);
}
@media (max-width: 1023.98px) { .lid3-lid { aspect-ratio: 100 / 130; } }

.lid3-metal {
  position: absolute; inset: 0; z-index: 0;
  border-radius: 2.4cqw;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0) 16%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.12)),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, rgba(0,0,0,0.025) 1px 2px),
    linear-gradient(142deg, #d6d9de 0%, #bec2c9 36%, #aaafb7 62%, #c4c8ce 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.5),
    inset 0 1.5px 0 rgba(255,255,255,0.9),
    inset 0 -0.5cqw 1cqw rgba(0,0,0,0.18),
    0 0 0 1px rgba(14,15,26,0.3),
    0 2.4cqw 3.8cqw -1.2cqw rgba(14,15,26,0.4),
    0 0.6cqw 1.2cqw rgba(14,15,26,0.2);
}
/* The strip along the bottom edge where the lid meets the hinge. */
.lid3-metal::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 3.6cqw;
  border-radius: 0 0 2.4cqw 2.4cqw;
  background: linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.15) 58%, rgba(255,255,255,0.28) 90%, rgba(0,0,0,0.22));
}
.lid3-hinge {
  position: absolute; z-index: -1; left: 11%; right: 11%; bottom: -1.7cqw; height: 3.4cqw;
  border-radius: 0 0 1.7cqw 1.7cqw;
  background: linear-gradient(180deg, #2b2e33 0%, #6c7179 40%, #2a2d32 100%);
  box-shadow: 0 1.2cqw 2cqw rgba(14,15,26,0.4);
}
.lid3-contact {
  position: absolute; z-index: -2; left: 5%; right: 5%; bottom: -4.6cqw; height: 5.5cqw;
  background: radial-gradient(ellipse at 50% 22%, rgba(14,15,26,0.5), rgba(14,15,26,0) 68%);
  filter: blur(0.8cqw);
}
.lid3-sheen {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  border-radius: 2.4cqw;
  background: radial-gradient(circle at var(--gx, 26%) var(--gy, 16%), rgba(255,255,255,0.36), rgba(255,255,255,0) 54%);
  mix-blend-mode: soft-light;
}
/* A small debossed disc in the middle, where a logo would be. Stickers hide it until they are peeled off. */
.lid3-mark {
  position: absolute; z-index: 0; left: 50%; top: 50%; width: 5cqw; height: 5cqw;
  transform: translate(-50%, -50%); border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, rgba(255,255,255,0.65), rgba(255,255,255,0) 62%),
    linear-gradient(145deg, rgba(255,255,255,0.3), rgba(0,0,0,0.13));
  box-shadow: inset 0 0 0 0.25cqw rgba(255,255,255,0.35), inset 0 -0.2cqw 0.4cqw rgba(0,0,0,0.25), 0 0.15cqw 0.3cqw rgba(255,255,255,0.5);
}

/* ---- a sticker ---- */
.lid3-st {
  position: absolute;
  left: var(--lx); top: var(--ly); width: var(--lw); font-size: var(--lf);
  transform: translate(-50%, -50%);
  touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  /* Printed vinyl: a tight contact shadow plus a soft one that deepens (and drifts down) as it lifts off. */
  filter:
    drop-shadow(0 calc(0.07em + var(--lift, 0) * 0.55em) calc(0.1em + var(--lift, 0) * 0.6em) rgb(14 15 26 / calc(0.28 + var(--lift, 0) * 0.14)))
    drop-shadow(0 0 0.03em rgb(14 15 26 / 0.5));
}
/* The focus ring follows the die-cut outline. */
.lid3-st:has(:focus-visible) {
  filter:
    drop-shadow(0.13em 0 0 #0e0f1a) drop-shadow(-0.13em 0 0 #0e0f1a) drop-shadow(0 0.13em 0 #0e0f1a) drop-shadow(0 -0.13em 0 #0e0f1a)
    drop-shadow(0 0.1em 0.2em rgb(14 15 26 / 0.35));
}
.lid3-rot { position: relative; rotate: var(--lr); opacity: 0; }
/* Only the die-cut itself (.lid3-white) takes the pointer, so the empty corners of a circle never grab a click meant for what is under it. */
.lid3-st, .lid3-rot { pointer-events: none; }
.lid3-rot > .lid3-mag { display: block !important; }

.lid3-face {
  display: block; position: relative; width: 100%;
  margin: 0; padding: 0; border: 0; background: none; appearance: none;
  font: inherit; color: inherit; text-align: inherit; text-decoration: none; outline: none;
  pointer-events: none; /* only the die-cut shape below catches the pointer, so a circle does not grab its square's corners */
  -webkit-tap-highlight-color: transparent; -webkit-user-drag: none;
}
.lid3-cut { position: relative; }
.lid3-white { position: relative; width: 100%; background: #fcfbf8; pointer-events: auto; }
.lid3-flow { padding: var(--b); }
.lid3-art { position: relative; overflow: hidden; }
.lid3-white:not(.lid3-flow) > .lid3-art { position: absolute; inset: var(--b); }
/* The glossy vinyl finish and a hairline where the print meets the rim. */
.lid3-art::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(115deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 34%, rgba(255,255,255,0) 66%, rgba(255,255,255,0.12) 100%);
  box-shadow: inset 0 0 0 0.04em rgba(0,0,0,0.08);
}

.lid3-img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0;
  transition: opacity 0.5s ease; -webkit-user-drag: none;
}
.lid3-ribbon {
  position: absolute; left: 50%; max-width: 90%;
  display: inline-flex; align-items: center; gap: 0.35em;
  padding: 0.2em 0.6em 0.2em 0.45em;
  border-radius: min(999px, 0.9em);
  background: #fff; color: #0e0f1a;
  font-weight: 600; letter-spacing: -0.01em; line-height: 1.1; white-space: pre; text-align: center;
  transform: translateX(-50%) rotate(-2deg);
  box-shadow: 0 0.08em 0.22em rgba(14,15,26,0.3);
}
.lid3-dot { display: inline-block; flex: none; width: 0.55em; height: 0.55em; border-radius: 50%; }

/* The peeling corner: the sticker's pale underside, folded back over itself. */
.lid3-flapwrap { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.lid3-flapbox {
  position: absolute; width: calc(var(--k, 0) * 1em); height: calc(var(--k, 0) * 1em);
  filter: drop-shadow(0 0.07em 0.12em rgba(14,15,26,0.45));
}
.lid3-st[data-c="tl"] .lid3-flapbox { left: 0; top: 0; }
.lid3-st[data-c="tr"] .lid3-flapbox { right: 0; top: 0; }
.lid3-st[data-c="bl"] .lid3-flapbox { left: 0; bottom: 0; }
.lid3-st[data-c="br"] .lid3-flapbox { right: 0; bottom: 0; }
.lid3-flapi {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0) 50%, #aeb0ba 50.4%, #e6e7ec 58%, #fbfbfd 82%, #eceef2 100%);
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
}
.lid3-st[data-c="tr"] .lid3-flapi { transform: scaleX(-1); }
.lid3-st[data-c="bl"] .lid3-flapi { transform: scaleY(-1); }
.lid3-st[data-c="br"] .lid3-flapi { transform: scale(-1, -1); }

/* ---- the reset sticker ---- */
.lid3-reset {
  position: absolute; z-index: 400; left: 91%; top: 7%;
  display: inline-flex; align-items: center; gap: 0.4em;
  font-size: max(0.75rem, 1.4cqw); font-weight: 600; letter-spacing: -0.01em; line-height: 1;
  padding: 0.55em 0.95em 0.55em 0.8em; border-radius: 999px;
  background: var(--ink); color: var(--paper); border: 0; cursor: pointer;
  box-shadow: 0 0 0 0.22em #fcfbf8, 0 0.25em 0.6em 0.1em rgba(14,15,26,0.35);
  transform: translate(-50%, -50%) rotate(2deg);
  transition: transform 0.25s cubic-bezier(0.3, 1.7, 0.5, 1);
  touch-action: manipulation; opacity: 0;
}
.lid3-reset:hover { transform: translate(-50%, -50%) rotate(-3deg) scale(1.07); }
.lid3-reset:active { transform: translate(-50%, -50%) rotate(-3deg) scale(0.93); }
.lid3-reset:focus-visible { outline: none; box-shadow: 0 0 0 0.22em #fcfbf8, 0 0 0 0.45em #0e0f1a; }
.lid3-reset svg { width: 1.05em; height: 1.05em; }

/* ---- phones and tablets: the taller arrangement ---- */
@media (max-width: 1023.98px) {
  .lid3-st { left: var(--px); top: var(--py); width: var(--pw); font-size: var(--pf); }
  .lid3-rot { rotate: var(--pr); }
  .lid3-hp { display: none; }
  .lid3-reset { left: 88%; top: 3.4%; font-size: 3.9cqw; }
}

/* ---- the entrance: the lid is set down, then the stickers are slapped on one by one ---- */
.lid3-stage[data-entered="true"] .lid3-drop { animation: lid3-drop 0.95s cubic-bezier(0.22, 0.9, 0.3, 1) both; }
.lid3-stage[data-entered="true"] .lid3-rot { animation: lid3-slap 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.3) both; animation-delay: calc(0.3s + var(--i, 0) * 0.05s); }
.lid3-stage[data-entered="true"] .lid3-reset { animation: lid3-slap 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.3) 1.05s both; }
@keyframes lid3-drop {
  0% { opacity: 0; transform: translateY(-5rem) rotate(-4deg) scale(1.04); }
  38% { opacity: 1; }
  62% { transform: translateY(0.4rem) rotate(0.5deg) scale(0.995); }
  82% { transform: translateY(-0.12rem); }
  100% { opacity: 1; transform: none; }
}
@keyframes lid3-slap {
  0% { opacity: 0; scale: 1.7; translate: 0 -1.2em; }
  55% { opacity: 1; }
  100% { opacity: 1; scale: 1; translate: 0 0; }
}

@media (prefers-reduced-motion: reduce) {
  .lid3-drop, .lid3-rot, .lid3-reset { opacity: 1 !important; animation: none !important; }
  .lid3-pulse { animation: none !important; }
  .lid3-img { transition: none; }
}
`;
