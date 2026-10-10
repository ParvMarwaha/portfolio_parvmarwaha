import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, getProject, nextOf, numberOf, displayTitle } from "@/content/projects";
import RemoteImage from "@/components/ui/RemoteImage";
import SiteFooter from "@/components/SiteFooter";
import VideoEmbed from "@/components/VideoEmbed";
import Gallery from "@/components/Gallery";
import Reveal from "@/components/ui/Reveal";
import { HeroImage, ProjectPager, ReadingProgress } from "@/components/ProjectChrome";

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
        {/* Full-bleed cover, the same image the canvas frame opens into, so the transition lands seamlessly. */}
        <section className="relative h-[100svh] w-full overflow-hidden bg-deep">
          <HeroImage src={project.image} alt={`${displayTitle(project)} cover`} />
          <div className="absolute inset-0 bg-gradient-to-t from-deep/75 via-deep/10 to-transparent" />
          <ProjectPager prev={neighbour(prev)} next={neighbour(next)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto box-content flex max-w-[85rem] flex-col gap-3 px-4 pb-8 text-white md:px-6 md:pb-12">
            <p className="label opacity-80">
              {numberOf(project)} · {project.type} · {project.published}
            </p>
            <h1 className="text-6xl font-medium leading-[0.9] tracking-tighter md:text-[9rem]">
              {project.title}
              {project.kind && <span className="ml-3 font-display italic text-butter md:ml-5">{`// ${project.kind}`}</span>}
            </h1>
          </div>
        </section>

        <section className="mx-auto box-content max-w-[85rem] px-4 py-16 md:px-6 md:py-28">
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
                <div className="h-[80svh] w-full overflow-hidden bg-paper-2">
                  <iframe src={project.prototype} title={`${displayTitle(project)} prototype`} allowFullScreen loading="lazy" className="h-full w-full border-0" />
                </div>
              )}
            </div>
          )}

          {project.gallery.length > 0 && (
            <div className="mt-14 md:mt-20">
              <p className="label mb-5 text-mute">The work · click an image to zoom, arrows to browse</p>
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

        <Link
          href={`/work/${next.slug}`}
          className="group relative block overflow-hidden border-t border-line py-20 md:py-32"
          data-cursor-label="Next"
        >
          <RemoteImage
            src={next.image}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-0 transition-all duration-[900ms] ease-out group-hover:scale-100 group-hover:opacity-100"
          />
          <span className="absolute inset-0 bg-deep/60 opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden />
          <div className="relative mx-auto box-content max-w-[85rem] px-4 transition-colors duration-500 group-hover:text-white md:px-6">
            <p className="label mb-4 text-mute transition-colors duration-500 group-hover:text-white/80">Next · {numberOf(next)}</p>
            <p className="text-5xl font-medium tracking-tighter transition-transform duration-500 group-hover:translate-x-3 md:text-9xl">
              {displayTitle(next)} <span aria-hidden className="text-vermilion">→</span>
            </p>
          </div>
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
