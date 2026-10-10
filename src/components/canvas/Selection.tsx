// Design-tool selection chrome. Everything is sized through --inv (1 / zoom), set by the canvas on the
// world element, so outlines, handles and labels stay the same size on screen at any zoom level.
export const inv = (px: number) => `calc(${px}px * var(--inv, 1))`;

export function FrameName({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="absolute left-0 whitespace-nowrap text-[0.75rem] font-medium leading-none tracking-normal text-mute transition-colors group-hover:text-cobalt group-focus-visible:text-cobalt"
      style={{ bottom: "100%", marginBottom: inv(7), transform: "scale(var(--inv, 1))", transformOrigin: "0 100%" }}
    >
      {children}
    </span>
  );
}

/** Outline, corner handles and size pill. Shows on hover, and always in dev mode. */
export function Selection({ w, h, dev, show = false }: { w: number; h: number; dev: boolean; show?: boolean }) {
  const on = dev || show ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100";
  const corners: React.CSSProperties[] = [
    { left: 0, top: 0 },
    { right: 0, top: 0 },
    { left: 0, bottom: 0 },
    { right: 0, bottom: 0 },
  ];
  return (
    <>
      <span
        className={`pointer-events-none absolute border-cobalt transition-opacity duration-200 ${on}`}
        style={{ inset: inv(-1.5), borderWidth: inv(1.5), borderStyle: dev ? "dashed" : "solid" }}
      />
      {corners.map((c, i) => (
        <span
          key={i}
          className={`pointer-events-none absolute bg-white transition-opacity duration-200 ${on}`}
          style={{
            ...c,
            width: inv(8),
            height: inv(8),
            border: `${inv(1.5)} solid var(--cobalt)`,
            transform: `translate(${c.left !== undefined ? "-50%" : "50%"}, ${c.top !== undefined ? "-50%" : "50%"})`,
          }}
        />
      ))}
      <span
        className={`pointer-events-none absolute left-1/2 whitespace-nowrap rounded-[0.25rem] bg-cobalt px-1.5 py-[0.1875rem] text-[0.6875rem] font-medium leading-none tracking-normal text-white transition-opacity duration-200 ${on}`}
        style={{ top: "100%", marginTop: inv(10), transform: "translateX(-50%) scale(var(--inv, 1))", transformOrigin: "50% 0" }}
      >
        {Math.round(w)} × {Math.round(h)}
      </span>
    </>
  );
}
