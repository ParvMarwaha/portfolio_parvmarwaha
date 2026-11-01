import { projects } from "@/content/projects";
import RemoteImage from "@/components/ui/RemoteImage";

// Three drawn pictures for the About page, made in code until real photos arrive: the desk seen from above, a
// sketchbook spread, and a moodboard pinned with real project covers. All colours come from the theme.

function Frame({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <figure className={`group relative overflow-hidden bg-paper-2 ${className}`} style={{ aspectRatio: "4 / 5" }}>
      {children}
      <figcaption className="label absolute left-4 top-4 rounded-full bg-paper/85 px-2.5 py-1 text-ink backdrop-blur-sm">{label}</figcaption>
    </figure>
  );
}

const ease = "transition-transform duration-700 ease-[cubic-bezier(0.2,0.9,0.2,1)]";

/** The desk from above: laptop with a design file open, notebook, pencil, coffee, sticky notes and a plant. */
function Workspace() {
  return (
    <Frame label="Workspace">
      <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" role="img" aria-label="Drawing of my desk from above: a laptop with a design file open, a notebook, a pencil, coffee and sticky notes">
        <defs>
          <filter id="ws-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#0E0F1A" floodOpacity="0.18" />
          </filter>
        </defs>
        {/* wood-ish desk grain */}
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d={`M0 ${40 + i * 34} C 120 ${30 + i * 34}, 260 ${52 + i * 34}, 400 ${38 + i * 34}`} stroke="var(--ink)" strokeOpacity="0.05" fill="none" />
        ))}

        {/* laptop */}
        <g filter="url(#ws-shadow)" className={`${ease} origin-center group-hover:-translate-y-1`}>
          <rect x="70" y="150" width="260" height="176" rx="10" fill="#C9CBD1" />
          <rect x="80" y="160" width="240" height="150" rx="4" fill="var(--paper)" />
          {/* design file: toolbar, layers, canvas with frames */}
          <rect x="80" y="160" width="240" height="12" fill="var(--ink)" fillOpacity="0.9" />
          <rect x="80" y="172" width="40" height="138" fill="var(--paper-2)" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x="86" y={180 + i * 11} width={22 + (i % 3) * 6} height="4" rx="2" fill="var(--ink)" fillOpacity="0.25" />
          ))}
          <rect x="132" y="184" width="82" height="56" fill="var(--cobalt)" />
          <rect x="140" y="214" width="46" height="7" rx="1" fill="var(--paper)" />
          <rect x="140" y="226" width="28" height="4" rx="1" fill="var(--butter)" />
          <rect x="222" y="184" width="88" height="56" fill="var(--paper-2)" stroke="var(--ink)" strokeOpacity="0.12" />
          <circle cx="245" cy="212" r="12" fill="var(--vermilion)" />
          <rect x="263" y="204" width="38" height="5" rx="2" fill="var(--ink)" fillOpacity="0.5" />
          <rect x="263" y="214" width="26" height="4" rx="2" fill="var(--ink)" fillOpacity="0.25" />
          <rect x="132" y="250" width="178" height="50" fill="var(--paper-2)" stroke="var(--ink)" strokeOpacity="0.12" />
          {/* selection box, like the site's nav */}
          <rect x="130" y="182" width="86" height="60" fill="none" stroke="var(--cobalt)" strokeWidth="1.2" />
          {[
            [130, 182],
            [216, 182],
            [130, 242],
            [216, 242],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x - 2.5} y={y - 2.5} width="5" height="5" fill="var(--paper)" stroke="var(--cobalt)" strokeWidth="1" />
          ))}
          {/* keyboard deck */}
          <path d="M58 326 H342 L330 350 H70 Z" fill="#B7BAC1" />
          <rect x="170" y="334" width="60" height="9" rx="3" fill="#A6A9B1" />
        </g>

        {/* notebook + pencil */}
        <g filter="url(#ws-shadow)" className={`${ease} group-hover:rotate-[-2deg]`} style={{ transformOrigin: "80px 410px" }}>
          <rect x="30" y="372" width="128" height="96" rx="4" fill="var(--paper)" transform="rotate(-8 94 420)" />
          <g transform="rotate(-8 94 420)">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1="44" x2="146" y1={392 + i * 12} y2={392 + i * 12} stroke="var(--cobalt)" strokeOpacity="0.25" />
            ))}
            <path d="M48 398 q 14 -10 26 0 t 26 0" stroke="var(--ink)" strokeOpacity="0.7" fill="none" strokeWidth="1.4" />
            <path d="M48 422 h 60" stroke="var(--ink)" strokeOpacity="0.5" strokeWidth="1.4" />
            <circle cx="128" cy="440" r="9" fill="none" stroke="var(--vermilion)" strokeWidth="1.6" />
          </g>
          <g transform="rotate(32 180 420)">
            <rect x="140" y="414" width="90" height="9" rx="2" fill="var(--butter)" />
            <path d="M230 414 l 14 4.5 -14 4.5 z" fill="#E7D3B0" />
            <path d="M240 416.8 l 4 1.7 -4 1.7 z" fill="var(--ink)" />
            <rect x="134" y="414" width="8" height="9" rx="1.5" fill="var(--vermilion)" />
          </g>
        </g>

        {/* coffee */}
        <g filter="url(#ws-shadow)" className={`${ease} group-hover:translate-x-1`}>
          <circle cx="322" cy="418" r="40" fill="var(--paper)" />
          <circle cx="322" cy="418" r="31" fill="#6B4A33" />
          <circle cx="322" cy="418" r="31" fill="none" stroke="#3F2B1E" strokeWidth="3" />
          <path d="M310 412 q 12 -10 24 0 q -12 14 -24 0" fill="#C9A27E" fillOpacity="0.85" />
          <path d="M362 408 q 22 10 0 22" stroke="var(--paper)" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>

        {/* sticky notes */}
        <g filter="url(#ws-shadow)" className={`${ease} group-hover:-rotate-3`} style={{ transformOrigin: "330px 90px" }}>
          <rect x="288" y="52" width="74" height="74" fill="var(--butter)" transform="rotate(6 325 89)" />
          <text x="300" y="86" fontSize="13" fill="var(--ink)" transform="rotate(6 325 89)" fontFamily="var(--font-instrument)" fontStyle="italic">
            ship it
          </text>
          <text x="300" y="104" fontSize="10" fill="var(--ink)" fillOpacity="0.6" transform="rotate(6 325 89)">
            fri ✓
          </text>
        </g>
        <g filter="url(#ws-shadow)">
          <rect x="228" y="70" width="58" height="58" fill="var(--vermilion)" transform="rotate(-7 257 99)" />
          <text x="238" y="102" fontSize="11" fill="#fff" transform="rotate(-7 257 99)">
            kern!
          </text>
        </g>

        {/* plant, from above */}
        <g filter="url(#ws-shadow)">
          <circle cx="70" cy="80" r="34" fill="#C9CBD1" />
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return (
              <ellipse
                key={i}
                cx={70 + Math.cos(a) * 22}
                cy={80 + Math.sin(a) * 22}
                rx="20"
                ry="8"
                fill={i % 2 ? "#3E7C4F" : "#4F9461"}
                transform={`rotate(${(a * 180) / Math.PI} ${70 + Math.cos(a) * 22} ${80 + Math.sin(a) * 22})`}
              />
            );
          })}
          <circle cx="70" cy="80" r="8" fill="#2F5E3C" />
        </g>
      </svg>
    </Frame>
  );
}

/** A sketchbook spread: wireframes and notes in pencil, a little rough on purpose. */
function Sketchbook() {
  const pencil = { stroke: "var(--ink)", strokeOpacity: 0.72, fill: "none", strokeWidth: 1.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <Frame label="Sketchbook" className="md:mt-12">
      <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" role="img" aria-label="Drawing of a sketchbook page with app wireframes, a logo study and handwritten notes">
        <rect x="26" y="56" width="348" height="420" rx="6" fill="var(--paper)" transform="rotate(-2 200 266)" />
        <g transform="rotate(-2 200 266)">
          {/* dot grid paper */}
          {Array.from({ length: 13 }, (_, r) =>
            Array.from({ length: 11 }, (_, c) => <circle key={`${r}-${c}`} cx={46 + c * 31} cy={84 + r * 30} r="0.9" fill="var(--ink)" fillOpacity="0.18" />)
          )}
          {/* phone wireframes */}
          <path d="M58 112 q -2 0 -2 4 v 140 q 0 4 4 4 h 74 q 4 0 4 -4 v -142 q 0 -3 -4 -3 z" {...pencil} />
          <path d="M66 128 h 58 M66 140 h 40" {...pencil} />
          <path d="M66 156 h 58 v 46 h -58 z" {...pencil} />
          <path d="M66 156 l 58 46 M124 156 l -58 46" {...pencil} strokeOpacity={0.35} />
          <path d="M66 214 h 26 v 26 h -26 z M98 214 h 26 v 26 h -26 z" {...pencil} />
          <path d="M156 112 q -2 0 -2 4 v 140 q 0 4 4 4 h 74 q 4 0 4 -4 v -142 q 0 -3 -4 -3 z" {...pencil} />
          <circle cx="195" cy="158" r="22" {...pencil} />
          <path d="M168 196 h 54 M176 208 h 38" {...pencil} />
          <rect x="166" y="224" width="58" height="16" rx="8" fill="var(--vermilion)" fillOpacity="0.85" />
          {/* flow arrow between screens */}
          <path d="M136 186 C 146 176, 148 176, 152 184" {...pencil} stroke="var(--cobalt)" strokeOpacity={0.9} />
          <path d="M147 182 l 5 2 -1 -5" {...pencil} stroke="var(--cobalt)" strokeOpacity={0.9} />

          {/* logo study */}
          <circle cx="300" cy="150" r="34" {...pencil} />
          <path d="M282 168 L300 124 L318 168 M289 152 h 22" {...pencil} strokeWidth={2.2} />
          <circle cx="300" cy="150" r="40" {...pencil} strokeOpacity={0.25} strokeDasharray="3 4" />
          <text x="268" y="214" fontSize="13" fill="var(--ink)" fillOpacity="0.75" fontFamily="var(--font-instrument)" fontStyle="italic">
            v3? bolder
          </text>
          <path d="M268 220 q 30 6 64 -2" {...pencil} stroke="var(--vermilion)" strokeOpacity={0.9} />

          {/* type notes */}
          <text x="56" y="306" fontSize="34" fill="var(--ink)" fillOpacity="0.85" fontWeight="300" letterSpacing="-1">
            Aa
          </text>
          <text x="106" y="306" fontSize="34" fill="var(--ink)" fillOpacity="0.85" fontWeight="800" letterSpacing="-1">
            Aa
          </text>
          <path d="M60 316 C 90 322, 120 312, 150 318" {...pencil} strokeOpacity={0.4} />
          <text x="186" y="292" fontSize="12" fill="var(--ink)" fillOpacity="0.7">
            wght 100 → 900
          </text>
          <text x="186" y="310" fontSize="12" fill="var(--ink)" fillOpacity="0.7">
            tracking −4%
          </text>

          {/* palette */}
          {["var(--cobalt)", "var(--vermilion)", "var(--butter)", "var(--ink)"].map((c, i) => (
            <circle key={c} cx={70 + i * 34} cy={366} r="13" fill={c} fillOpacity="0.9" />
          ))}
          <path d="M210 352 q 40 -18 80 4 q 30 16 54 -6" {...pencil} strokeOpacity={0.5} />

          {/* handwritten to-do */}
          <text x="56" y="420" fontSize="17" fill="var(--ink)" fillOpacity="0.8" fontFamily="var(--font-instrument)" fontStyle="italic">
            1. make it clear
          </text>
          <text x="56" y="442" fontSize="17" fill="var(--ink)" fillOpacity="0.8" fontFamily="var(--font-instrument)" fontStyle="italic">
            2. make it fun
          </text>
          <text x="210" y="442" fontSize="17" fill="var(--cobalt)" fontFamily="var(--font-instrument)" fontStyle="italic">
            3. ship it
          </text>
          <path d="M60 426 l 86 -2" {...pencil} strokeOpacity={0.55} />
        </g>

        {/* pencil resting on the page */}
        <g transform="rotate(-28 300 420)" className={`${ease} group-hover:translate-x-2`}>
          <rect x="240" y="440" width="130" height="10" rx="2" fill="var(--butter)" />
          <path d="M370 440 l 16 5 -16 5 z" fill="#E7D3B0" />
          <path d="M382 443.6 l 4 1.4 -4 1.4 z" fill="var(--ink)" />
          <rect x="232" y="440" width="10" height="10" rx="2" fill="var(--vermilion)" />
        </g>
      </svg>
    </Frame>
  );
}

/** A moodboard: four real project covers, colour chips, a type specimen and tape. */
function Moodboard() {
  const picks = [projects[0], projects[1], projects[3], projects[7]].filter(Boolean);
  const spots = [
    { left: "8%", top: "13%", w: "46%", rot: -4 },
    { left: "50%", top: "10%", w: "42%", rot: 3 },
    { left: "10%", top: "50%", w: "40%", rot: 2.5 },
    { left: "48%", top: "45%", w: "44%", rot: -3 },
  ];
  return (
    <Frame label="Moodboard">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--ink) 14%, transparent) 1px, transparent 1.5px)", backgroundSize: "18px 18px" }} />
      {picks.map((p, i) => (
        <div
          key={p.slug}
          className={`absolute bg-paper p-[3%] shadow-[0_10px_24px_-12px_rgba(14,15,26,0.45)] ${ease} group-hover:scale-[1.02]`}
          style={{ left: spots[i].left, top: spots[i].top, width: spots[i].w, rotate: `${spots[i].rot}deg` }}
        >
          <div className="relative aspect-[4/3] overflow-hidden" style={{ background: p.accent }}>
            <RemoteImage src={p.image} alt={p.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <p className="mt-1.5 truncate text-[0.625rem] font-medium tracking-tight text-ink">{p.title}</p>
          {/* tape */}
          <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-[-3deg] bg-butter/70" aria-hidden />
        </div>
      ))}
      {/* colour chips */}
      <div className="absolute bottom-[7%] left-[8%] flex gap-1.5" aria-hidden>
        {["bg-cobalt", "bg-vermilion", "bg-butter", "bg-ink"].map((c) => (
          <span key={c} className="h-8 w-6 rounded-[3px] shadow-[0_4px_10px_-6px_rgba(14,15,26,0.5)]">
            <span className={`block h-6 w-6 rounded-t-[3px] ${c}`} />
          </span>
        ))}
      </div>
      {/* type specimen */}
      <div className={`absolute bottom-[6%] right-[8%] rotate-[3deg] bg-paper px-3 py-2 text-ink shadow-[0_10px_24px_-12px_rgba(14,15,26,0.45)] ${ease} group-hover:rotate-0`}>
        <p className="text-3xl font-medium leading-none tracking-tighter">
          Aa <em className="font-display font-normal italic text-cobalt">Aa</em>
        </p>
        <p className="mt-1 text-[0.5625rem] text-mute">Grotesk · Instrument Serif</p>
      </div>
    </Frame>
  );
}

export default function Pictures() {
  return (
    <div className="grid gap-4 md:grid-cols-3 md:gap-6">
      <Workspace />
      <Sketchbook />
      <Moodboard />
    </div>
  );
}
