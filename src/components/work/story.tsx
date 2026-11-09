import RevealImage from "./RevealImage";

/*
 * The parts every case-study page is built from, so they all read the same: a small title and the cover, then short
 * sections on alternating white and grey bands, each in one narrow column with a line or two of text and a picture.
 */

/** A full-width band (white or grey, alternating) holding the page's one narrow column. */
export function Band({ id, grey = false, children }: { id: string; grey?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={grey ? "bg-paper-2" : ""}>
      <div className="mx-auto w-full max-w-[62rem] px-4 py-20 md:px-6 md:py-28">{children}</div>
    </section>
  );
}

export function H({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[1.125rem] font-medium tracking-tight md:text-[1.25rem]">{children}</h2>;
}

export function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[0.9375rem] font-medium tracking-tight">{children}</h3>;
}

export function Text({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink/75">{children}</p>;
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-2.5 text-[0.9375rem] leading-relaxed text-ink/75">
      {items.map((t) => (
        <li key={t} className="grid grid-cols-[1rem_1fr]">
          <span aria-hidden>•</span>
          {t}
        </li>
      ))}
    </ul>
  );
}

export function Picture({ src, alt, className = "", tone = "bg-paper-2" }: { src: string; alt: string; className?: string; tone?: string }) {
  return (
    <div className={`overflow-hidden rounded-[0.875rem] ring-1 ring-ink/10 ${tone} ${className}`}>
      <RevealImage src={src} alt={alt} />
    </div>
  );
}

