// Kern, Parv's design buddy: a little creature made of a design tool's selection box. The corner handles are its hands
// (data-hand) and feet (data-foot); thin guide lines (data-arm) join the frame to the hands so they can wave and point.
// Pupils carry data-pupil so a caller can move them. Butter body and paper frame, drawn for a cobalt background.

export type KernFace = "open" | "happy" | "dizzy" | "wow" | "sleepy";

export default function KernArt({ face = "open", lookRef }: { face?: KernFace; lookRef?: React.RefObject<SVGGElement | null> }) {
  const eye = (cx: number) => {
    if (face === "happy") return <path key={cx} d={`M${cx - 6} 47 q 6 -7 12 0`} stroke="var(--ink)" strokeWidth="3.4" fill="none" strokeLinecap="round" />;
    if (face === "sleepy") return <path key={cx} d={`M${cx - 6} 46 h 12`} stroke="var(--ink)" strokeWidth="3.4" strokeLinecap="round" />;
    if (face === "dizzy")
      return <path key={cx} d={`M${cx} 45 m -6 0 a 6 6 0 1 0 6 -6 a 3.5 3.5 0 1 0 3.5 3.5`} stroke="var(--ink)" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    return (
      <g key={cx}>
        <ellipse cx={cx} cy="45" rx="8.5" ry={face === "wow" ? 10.5 : 9.5} fill="#fff" stroke="var(--ink)" strokeOpacity="0.2" strokeWidth="1.2" />
        <circle data-pupil cx={cx} cy="46" r="4.6" fill="var(--ink)" />
        <circle data-pupil cx={cx + 1.6} cy="44.2" r="1.4" fill="#fff" />
      </g>
    );
  };
  const handle = { fill: "var(--cobalt)", stroke: "var(--paper)", strokeWidth: 1.8 };
  return (
    <svg viewBox="-24 -24 148 136" className="block h-full w-full overflow-visible" aria-hidden>
      {/* the selection frame */}
      <rect x="-4" y="-4" width="108" height="108" fill="none" stroke="var(--paper)" strokeOpacity="0.85" strokeWidth="1.6" />
      {/* arms: thin guide lines from the frame corners to the hands, which move */}
      <line data-arm="l" x1="-4" y1="-4" x2="-4" y2="-4" stroke="var(--paper)" strokeWidth="1.6" />
      <line data-arm="r" x1="104" y1="-4" x2="104" y2="-4" stroke="var(--paper)" strokeWidth="1.6" />
      <rect data-hand="l" x="-9" y="-9" width="10" height="10" {...handle} />
      <rect data-hand="r" x="99" y="-9" width="10" height="10" {...handle} />
      <rect data-foot="l" x="-9" y="99" width="10" height="10" {...handle} />
      <rect data-foot="r" x="99" y="99" width="10" height="10" {...handle} />
      {/* the body: a soft squircle with a glossy highlight */}
      <path d="M50 4 C 86 4 96 14 96 50 C 96 86 86 96 50 96 C 14 96 4 86 4 50 C 4 14 14 4 50 4 Z" fill="var(--butter)" />
      <path d="M22 18 C 34 10 52 9 64 12" stroke="#fff" strokeOpacity="0.3" strokeWidth="5" fill="none" strokeLinecap="round" />
      <g ref={lookRef} style={{ transformBox: "fill-box", transformOrigin: "50% 40%" }}>
        {eye(36)}
        {eye(64)}
        <circle cx="24" cy="60" r="5.5" fill="var(--vermilion)" opacity="0.45" />
        <circle cx="76" cy="60" r="5.5" fill="var(--vermilion)" opacity="0.45" />
        {face === "wow" ? (
          <ellipse cx="50" cy="66" rx="5" ry="6.5" fill="var(--ink)" />
        ) : face === "dizzy" ? (
          <path d="M40 67 q 5 -4 10 0 t 10 0" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : face === "sleepy" ? (
          <path d="M44 66 h 12" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <path
            d={face === "happy" ? "M39 62 q 11 13 22 0 z" : "M41 63 q 9 8 18 0"}
            stroke="var(--ink)"
            strokeWidth="3"
            fill={face === "happy" ? "var(--vermilion)" : "none"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>
    </svg>
  );
}
