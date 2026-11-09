import type { Project } from "@/content/projects";
import { displayTitle } from "@/content/projects";
import Gallery from "@/components/Gallery";
import VideoEmbed from "@/components/VideoEmbed";
import RevealImage from "./RevealImage";
import StoryIndex from "./StoryIndex";
import BackLink from "./BackLink";
import PrototypeEmbed from "./PrototypeEmbed";
import { Band, H, Text } from "./story";

/**
 * The standard case-study page, for every project without a story of its own: the same grammar as Roots Foundation
 * (small title, the cover, short sections on alternating bands) filled from the project's entry in the content file.
 * Sections appear only when the project has something for them.
 */
export default function ProjectStory({ project }: { project: Project }) {
  const title = displayTitle(project);
  const sections = [
    { id: "overview", label: "Overview", preview: project.image },
    project.vimeo ? { id: "film", label: "Film", preview: project.image } : null,
    project.prototype ? { id: "prototype", label: "Prototype", preview: project.image } : null,
    project.gallery.length ? { id: "work", label: "The work", preview: project.gallery[0] } : null,
  ].filter((s): s is { id: string; label: string; preview: string } => !!s);
  const details: [string, string][] = [
    ["Type", project.also?.length ? [project.type, ...project.also].join(", ") : project.type],
    ["Published", project.published],
    ["Tools", project.tools.join(", ")],
    ["Fields", project.fields.join(", ")],
  ];
  // Bands alternate white and grey, whichever sections a project has.
  const grey = (id: string) => sections.findIndex((s) => s.id === id) % 2 === 1;
  const withIndex = sections.length >= 3;

  return (
    <>
      <header className="mx-auto w-full max-w-[62rem] px-4 pt-28 md:px-6 md:pt-36">
        <BackLink />
        <h1 className="text-[1.25rem] font-medium tracking-tight">{project.title}</h1>
        <p className="mt-1 text-[0.9375rem] text-mute">
          {project.kind ? `${project.kind[0].toUpperCase()}${project.kind.slice(1)}` : project.type} · {project.year}
        </p>
        <div className="mt-8 overflow-hidden rounded-[1rem] bg-paper-2 ring-1 ring-ink/10">
          <RevealImage src={project.image} alt={`${title} cover`} eager />
        </div>
        {withIndex && (
          <div className="mt-12 xl:hidden">
            <StoryIndex sections={sections} />
          </div>
        )}
      </header>

      <div className="relative">
        {withIndex && (
          <aside className="pointer-events-none absolute inset-y-0 left-0 hidden w-[calc((100%-62rem)/2)] xl:block">
            <div className="pointer-events-auto sticky top-32 ml-auto mr-10 mt-28 w-44">
              <StoryIndex sections={sections} peek="below" />
            </div>
          </aside>
        )}

        <Band id="overview">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <H>Overview</H>
              <Text>{project.summary}</Text>
              {project.behance && (
                <a
                  href={project.behance}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block text-[0.9375rem] font-medium underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
                >
                  The full project on Behance ↗
                </a>
              )}
            </div>
            <dl className="grid content-start gap-5">
              {details.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[0.8125rem] text-mute">{k}</dt>
                  <dd className="mt-0.5 text-[0.9375rem] leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Band>

        {project.vimeo && (
          <Band id="film" grey={grey("film")}>
            <H>Film</H>
            <div className="mt-8 overflow-hidden rounded-[0.875rem] ring-1 ring-ink/10">
              <VideoEmbed id={project.vimeo} poster={project.image} title={`${title} video`} fallbackHref={`https://vimeo.com/${project.vimeo}`} />
            </div>
          </Band>
        )}

        {project.prototype && (
          <Band id="prototype" grey={grey("prototype")}>
            <H>Prototype</H>
            <Text>The clickable prototype, straight from Figma.</Text>
            <div className="mt-8">
              <PrototypeEmbed src={project.prototype} title={`${title} prototype`} poster={project.image} />
            </div>
          </Band>
        )}

        {project.gallery.length > 0 && (
          <Band id="work" grey={grey("work")}>
            <H>The work</H>
            <p className="mt-2 text-[0.875rem] text-mute">
              <span className="pointer-coarse:hidden">Click an image to see it full screen.</span>
              <span className="hidden pointer-coarse:inline">Tap an image to see it full screen.</span>
            </p>
            <div className="mt-8">
              <Gallery images={project.gallery} label={title} columns={1} framed />
            </div>
          </Band>
        )}
      </div>
    </>
  );
}
