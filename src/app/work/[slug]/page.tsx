import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects, getProject, nextOf, numberOf, displayTitle, projectHref, linkTarget, projectsOpenOnBehance } from "@/content/projects";
import SiteFooter from "@/components/SiteFooter";
import { ReadingProgress } from "@/components/ProjectChrome";
import RootsStory from "@/components/work/RootsStory";
import VarnmalaStory from "@/components/work/VarnmalaStory";
import NotoStory from "@/components/work/NotoStory";
import ProjectStory from "@/components/work/ProjectStory";
import StartAtTop from "@/components/work/StartAtTop";

// Projects that tell their own story; the rest use the standard case-study page (ProjectStory).
const STORIES: Record<string, () => React.ReactNode> = { "roots-foundation": RootsStory, varnmala: VarnmalaStory, noto: NotoStory };

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
  const Story = STORIES[project.slug];

  return (
    <>
      <StartAtTop />
      <ReadingProgress />
      <main>
        {Story ? <Story /> : <ProjectStory project={project} />}

        {/* The next project opens where it would from the home page: its own page, or Behance in a new tab */}
        <a
          href={projectHref(next)}
          {...linkTarget(next)}
          className="group relative block overflow-hidden border-t border-line py-20 md:py-32"
          data-cursor-label={projectsOpenOnBehance(next) ? "Behance" : "Next"}
        >
          {/* Just the arrow: it slides off to the right as if leading the way; no picture flooding the band */}
          <div className="relative mx-auto box-content max-w-[100vw] px-4 md:px-6">
            <p className="label mb-4 text-mute">Next · {numberOf(next)}</p>
            <p className="flex items-baseline gap-[0.2em] text-5xl font-medium tracking-tighter md:text-8xl lg:text-9xl">
              <span>{displayTitle(next)}</span>
              <span aria-hidden className="inline-block text-vermilion transition-transform duration-500 ease-[cubic-bezier(0.2,0.9,0.2,1)] group-hover:translate-x-[0.35em] group-focus-visible:translate-x-[0.35em]">
                {projectsOpenOnBehance(next) ? "↗" : "→"}
              </span>
            </p>
          </div>
        </a>
      </main>
      <SiteFooter />
    </>
  );
}
