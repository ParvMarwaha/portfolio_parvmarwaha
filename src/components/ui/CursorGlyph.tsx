// A design-tool cursor: arrow plus a name tag. Used for the visitor's own cursor and for "Parv"'s ghost cursor.
export default function CursorGlyph({
  color,
  label,
  tagRef,
  className = "",
}: {
  color: string;
  label: string;
  tagRef?: React.Ref<HTMLSpanElement>;
  className?: string;
}) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <svg width="18" height="22" viewBox="0 0 18 22" fill="none" aria-hidden className="block drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
        <path d="M1.5 1.5v16.2l4.3-4.2 3 6.6 2.9-1.3-3-6.5h6.1L1.5 1.5Z" fill={color} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span
        ref={tagRef}
        className="absolute left-[0.875rem] top-[1.125rem] whitespace-nowrap rounded-[0.3125rem] rounded-tl-none px-2 py-[0.1875rem] text-[0.6875rem] font-semibold leading-none tracking-normal text-white"
        style={{ background: color }}
      >
        {label}
      </span>
    </div>
  );
}
