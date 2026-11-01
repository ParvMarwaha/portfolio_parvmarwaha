import Link from "next/link";
import type { Experiment } from "@/content/lab";

/**
 * A Lab toy on a page of its own: a line with the way back, its name and what to do, then the toy filling the rest
 * of the screen.
 */
export default function LabObjectPage({ item, children }: { item: Experiment; children: React.ReactNode }) {
  return (
    <main className="overflow-x-clip px-4 pt-[5.25rem] md:px-6 md:pt-[5.75rem]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="text-[1.375rem] font-medium tracking-tighter text-ink md:text-[1.75rem]">
          <Link href="/lab" className="mr-3 text-mute transition-colors hover:text-ink" data-cursor-label="Lab">
            ← Lab
          </Link>
          {item.title}
          <span className="label ml-3 align-middle text-mute">{item.kind}</span>
        </h1>
        <p className="max-w-[34rem] text-[0.9375rem] leading-snug tracking-tight text-mute">{item.note}</p>
      </div>
      <div className="relative mt-4 h-[calc(100svh-10.5rem)] min-h-[26rem] pb-4 md:mt-6 md:h-[calc(100svh-12rem)] md:pb-6">{children}</div>
    </main>
  );
}
