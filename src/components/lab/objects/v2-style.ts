// V2 "Claw": the few bits of CSS the cabinet needs that Tailwind classes can't say (keyframes, the column's width, the
// bulbs' blink, the prize landing in the tray). Everything inside the cabinet is sized in cqw, so this is all unit-free
// or in cqw too.
export const CLAW_CSS = `
/* The machine's column: on wide screens it is as wide as a 3:4 cabinet is when it fills the hero's height. */
.v2-col{min-width:0}
@media (min-width:1024px){.v2-col{width:min(calc((100svh - 7.25rem) * .75), 46vw)}}

/* The back wall of the glass box: a pale lit wall, softer when the whole site goes dark (x-ray palettes). */
.v2-wall{--glow:.55;--grid:rgba(14,15,26,.045);background:radial-gradient(120% 70% at 50% 0%,rgba(255,255,255,var(--glow)),transparent 62%),repeating-linear-gradient(90deg,var(--grid) 0 1px,transparent 1px 7.5cqw),linear-gradient(180deg,color-mix(in oklab,var(--paper) 90%,var(--cobalt)) 0%,color-mix(in oklab,var(--paper-2) 74%,var(--cobalt)) 100%)}
:root[data-fx="xray"] .v2-wall{--glow:.14;--grid:rgba(255,255,255,.05)}

/* Marquee bulbs: two interleaved rows that take turns. */
.v2-bulbs-a{animation:v2-bulb 1.1s steps(1,end) infinite}
.v2-bulbs-b{animation:v2-bulb 1.1s steps(1,end) infinite;animation-delay:-.55s}
@keyframes v2-bulb{0%{opacity:1}50%{opacity:.28}100%{opacity:1}}

/* Marquee text when something is won or said. */
.v2-flash{animation:v2-flash .7s ease-out both}
@keyframes v2-flash{0%{transform:scale(.8);opacity:0}35%{transform:scale(1.14);opacity:1}60%{transform:scale(.97)}100%{transform:scale(1)}}

/* The "aim · click to drop" hint drifts left and right. */
.v2-sway{display:inline-block;animation:v2-sway 2.4s ease-in-out infinite}
@keyframes v2-sway{0%,100%{transform:translateX(-3cqw)}50%{transform:translateX(3cqw)}}

/* A won prize drops into the tray and settles. */
.v2-land{animation:v2-land .75s cubic-bezier(.3,1.4,.5,1) both}
@keyframes v2-land{0%{transform:translateY(-34cqw) rotate(-14deg);opacity:0}30%{opacity:1}100%{transform:none;opacity:1}}

/* Confetti around it. --dx / --dy are set per speck. */
.v2-spark{opacity:0;animation:v2-spark .8s ease-out both}
@keyframes v2-spark{0%{transform:translate(0,0) scale(.4);opacity:0}25%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}

/* The paper tag slides out from behind the prize with its link. */
.v2-tag{animation:v2-tag .5s cubic-bezier(.2,1.2,.4,1) .45s both}
@keyframes v2-tag{0%{transform:translateX(-6cqw) scale(.9);opacity:0}100%{transform:none;opacity:1}}

/* The big red DROP button breathes while the claw is parked and goes still while it works. */
.v2-drop{animation:v2-breathe 2.2s ease-in-out infinite}
[data-busy="true"] .v2-drop{animation:none;filter:saturate(.7) brightness(.92)}
@keyframes v2-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}

/* The coin on the hire slot. */
.v2-coin{transition:translate .35s cubic-bezier(.3,1.3,.5,1),scale .35s cubic-bezier(.3,1.3,.5,1)}

@media (prefers-reduced-motion:reduce){
  .v2-bulbs-a,.v2-bulbs-b,.v2-sway,.v2-drop,.v2-flash,.v2-land,.v2-tag{animation:none}
  .v2-spark{animation:none;opacity:0}
  .v2-coin{transition:none}
}
`;
