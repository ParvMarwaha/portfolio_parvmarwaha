import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, getProject, nextOf, numberOf, displayTitle } from "@/content/projects";
import SiteFooter from "@/components/SiteFooter";
import VideoEmbed from "@/components/VideoEmbed";
import Gallery from "@/components/Gallery";
import Reveal from "@/components/ui/Reveal";
import { HeroImage, ProjectPager, ReadingProgress } from "@/components/ProjectChrome";
import RootsStory from "@/components/work/RootsStory";

// Projects that tell their own story instead of the standard summary, details and image wall.
const STORIES: Record<string, () => React.ReactNode> = { "roots-foundation": RootsStory };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  return project ? { title: displayTitle(project), description: project.summary } : {};
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const next = nextOf(slug);
  const index = projects.indexOf(project);
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const neighbour = (p: typeof project) => ({ href: `/work/${p.slug}`, no: numberOf(p), title: p.title });
  const Story = STORIES[project.slug];

  const meta: [string, React.ReactNode][] = [
    ["Type", project.type],
    ["Published", project.published],
    ["Tools", project.tools.join(", ")],
    ["Fields", project.fields.join(", ")],
  ];

  return (
    <>
      <ReadingProgress />
      <main>
        {Story ? (
          <Story />
        ) : (
          <>
            {/* Full-bleed cover, the same image the canvas frame opens into, so the transition lands seamlessly. */}
            {/* On a phone the cover is shown whole at its own shape with the title under it: cropped to a tall screen,
                a wide cover was cut down to a sliver. */}
            <section className="relative w-full overflow-hidden bg-deep pt-32 md:h-[100svh] md:pt-0">
              <HeroImage src={project.image} alt={`${displayTitle(project)} cover`} />
              <div className="absolute inset-0 hidden bg-gradient-to-t from-deep/75 via-deep/10 to-transparent md:block" />
              <ProjectPager prev={neighbour(prev)} next={neighbour(next)} />
              <div className="mx-auto box-content flex max-w-[100vw] flex-col gap-3 px-4 pb-10 pt-8 text-white md:absolute md:inset-x-0 md:bottom-0 md:px-6 md:pb-12 md:pt-0">
                <p className="label opacity-80">
                  {numberOf(project)} · {project.type} · {project.published}
                </p>
                <h1 className="text-[3.25rem] font-medium leading-[0.9] tracking-tighter sm:text-6xl md:text-8xl lg:text-[9rem]">
                  {project.title}
                  {project.kind && <span className="ml-3 font-display italic text-butter md:ml-5">{`// ${project.kind}`}</span>}
                </h1>
              </div>
            </section>

            <section className="mx-auto box-content max-w-[100vw] px-4 py-16 md:px-6 md:py-28">
              <Reveal>
                <p className="max-w-4xl text-3xl font-medium leading-[1.1] tracking-tighter md:text-6xl">{project.summary}</p>
              </Reveal>

              <dl className="mt-14 grid grid-cols-1 gap-x-6 gap-y-8 border-y border-line py-10 sm:grid-cols-2 md:mt-20 md:grid-cols-4">
                {meta.map(([k, v]) => (
                  <div key={k}>
                    <dt className="label mb-2 text-mute">{k}</dt>
                    <dd className="text-lg tracking-tight">{v}</dd>
                  </div>
                ))}
              </dl>

              {(project.vimeo || project.prototype) && (
                <div className="mt-14 grid gap-4 md:mt-20">
                  {project.vimeo && (
                    <VideoEmbed id={project.vimeo} poster={project.image} title={`${displayTitle(project)} video`} fallbackHref={`https://vimeo.com/${project.vimeo}`} />
                  )}
                  {project.prototype && (
                    <>
                      <div className="hidden h-[80svh] w-full overflow-hidden bg-paper-2 md:block">
                        <iframe src={project.prototype} title={`${displayTitle(project)} prototype`} allowFullScreen loading="lazy" className="h-full w-full border-0" />
                      </div>
                      {/* On a phone an embedded prototype catches every swipe and the page stops scrolling, so it opens on its own. */}
                      <a
                        href={project.prototype.replace("embed.figma.com", "www.figma.com")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-4 rounded-[1rem] bg-paper-2 p-5 ring-1 ring-ink/10 md:hidden"
                      >
                        <span>
                          <span className="label block text-mute">Figma prototype</span>
                          <span className="mt-1 block text-lg font-medium tracking-tight">Try the clickable prototype</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-ink px-4 py-2.5 text-[0.875rem] font-medium text-paper">Open ↗</span>
                      </a>
                    </>
                  )}
                </div>
              )}

              {project.gallery.length > 0 && (
                <div className="mt-14 md:mt-20">
                  <p className="label mb-5 text-mute">The work · <span className="pointer-coarse:hidden">click an image to zoom, arrows to browse</span><span className="hidden pointer-coarse:inline">tap an image to zoom, swipe to browse</span></p>
                  <Gallery images={project.gallery} label={displayTitle(project)} />
                </div>
              )}

              <div className="mt-14 flex flex-wrap items-center gap-3 md:mt-20">
                <Link
                  href="/contact"
                  className="rounded-full bg-vermilion px-6 py-3 text-[0.875rem] font-semibold tracking-normal text-white transition-transform hover:scale-[1.04]"
                >
                  Hire me ↗
                </Link>
              </div>
            </section>
          </>
        )}

        <Link
          href={`/work/${next.slug}`}
          className="group relative block overflow-hidden border-t border-line py-20 md:py-32"
          data-cursor-label="Next"
        >
          {/* Just the arrow: it slides off to the right as if leading the way; no picture flooding the band */}
          <div className="relative mx-auto box-content max-w-[100vw] px-4 md:px-6">
            <p className="label mb-4 text-mute">Next · {numberOf(next)}</p>
            <p className="flex items-baseline gap-[0.2em] text-5xl font-medium tracking-tighter md:text-8xl lg:text-9xl">
              <span>{displayTitle(next)}</span>
              <span aria-hidden className="inline-block text-vermilion transition-transform duration-500 ease-[cubic-bezier(0.2,0.9,0.2,1)] group-hover:translate-x-[0.35em] group-focus-visible:translate-x-[0.35em]">
                →
              </span>
            </p>
          </div>
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
