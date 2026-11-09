/**
 * A Figma prototype, playable in the page. On a phone an embedded prototype catches every swipe and the page stops
 * scrolling, so there it is a button that opens the prototype on its own. `src` is Figma's embed link
 * (embed.figma.com/proto/...); the share link (www.figma.com/proto/...) works too.
 */
export default function PrototypeEmbed({ src, title, height = "80svh" }: { src: string; title: string; height?: string }) {
  let embed = src.replace("://www.figma.com/", "://embed.figma.com/");
  // Figma's embed wants to know where it is shown.
  if (!embed.includes("embed-host=")) embed += `${embed.includes("?") ? "&" : "?"}embed-host=share`;
  const open = src.replace("://embed.figma.com/", "://www.figma.com/");
  return (
    <>
      <div className="hidden overflow-hidden rounded-[0.875rem] bg-paper-2 ring-1 ring-ink/10 md:block" style={{ height }}>
        <iframe src={embed} title={title} allowFullScreen loading="lazy" className="h-full w-full border-0" />
      </div>
      <a
        href={open}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-4 rounded-[0.875rem] bg-paper-2 p-5 ring-1 ring-ink/10 md:hidden"
      >
        <span>
          <span className="block text-[0.8125rem] text-mute">Figma prototype</span>
          <span className="mt-0.5 block text-[1rem] font-medium tracking-tight">Try the clickable prototype</span>
        </span>
        <span className="shrink-0 rounded-full bg-ink px-4 py-2.5 text-[0.875rem] font-medium text-paper">Open ↗</span>
      </a>
    </>
  );
}
