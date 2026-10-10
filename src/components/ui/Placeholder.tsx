// Drawing-style stand-ins for content that isn't written yet: an image frame with crossed
// diagonals and a text block made of skeleton lines.
export function Ph({
  label,
  ratio = "16 / 10",
  className = "",
}: {
  label: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-paper-2 text-ink ${className}`}
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={`Placeholder: ${label}`}
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.14]" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" vectorEffect="non-scaling-stroke" />
        <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="label absolute left-4 top-4 opacity-60">{label}</span>
    </div>
  );
}

export function PhLines({ lines = 4, className = "" }: { lines?: number; className?: string }) {
  const widths = ["100%", "94%", "98%", "62%", "88%", "70%"];
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="block h-[0.625rem] rounded-full bg-ink/10" style={{ width: widths[i % widths.length] }} />
      ))}
    </div>
  );
}
