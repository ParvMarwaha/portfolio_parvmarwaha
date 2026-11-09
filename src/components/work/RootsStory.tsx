import { Zilla_Slab, Plus_Jakarta_Sans } from "next/font/google";
import RootsColours from "./RootsColours";
import BrowserFrame from "./BrowserFrame";
import StoryIndex from "./StoryIndex";
import BackLink from "./BackLink";
import WeightType from "./WeightType";
import PrototypeEmbed from "./PrototypeEmbed";
import ResearchSplit from "./ResearchSplit";
import NgoPicker from "./NgoPicker";
import FlipBook from "./FlipBook";
import RevealImage from "./RevealImage";
import LogoStage from "./LogoStage";
import { Band, H, Sub, Text, Bullets, Picture } from "./story";
import { getProject } from "@/content/projects";

// The two Roots typefaces, loaded only on this page. Zilla Slab comes in five fixed weights; Plus Jakarta Sans is
// variable, so its weight can move smoothly in the type specimen.
const slab = Zilla_Slab({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" });

const R = "/images/roots";

// The five NGOs from the market research, each read the same way.
const NGOS = [
  {
    name: "Smile Foundation",
    what: "Education, health, livelihood and women's empowerment across India.",
    structure: "A familiar menu (About, Our work, Resource centre, Media), but the homepage puts almost everything on it at once.",
    content: "Deep and well documented: no question left about what they do. It arrives in dense blocks you have to read.",
    voice: "Factual and calm, with real photographs from the field.",
    lesson: "Depth builds credibility, but only with layers: a quick read first, details on demand.",
  },
  {
    name: "Teach For India",
    what: "One mission, educational equity, through a teaching fellowship.",
    structure: "A short menu that tells a story in order: the crisis, who they are, the fellowship, impact, get involved.",
    content: "Idea first, then explanation, then detail. Big headlines often say enough on their own.",
    voice: "Assertive and direct, one blue accent, real classroom photos in a steady grid.",
    lesson: "Lead with the problem and end with one clear action.",
  },
  {
    name: "UNICEF",
    what: "Children's rights and emergencies, worldwide.",
    structure: "Broad and divided; the homepage works like a live dashboard of updates, stories and reports.",
    content: "Modular cards make a huge volume manageable, but there is no single place to start.",
    voice: "Urgent, specific headlines, a strong blue identity, emotion always grounded by facts.",
    lesson: "Cards and a consistent colour can carry a lot of content without chaos.",
  },
  {
    name: "charity: water",
    what: "Clean drinking water, one problem, told with focus.",
    structure: "Minimal and linear: the crisis, the solution and impact, then how to get involved.",
    content: "Short, selected blocks, revealed one step at a time; very little repetition.",
    voice: "Emotional but backed by real impact, expressive type and a strong hierarchy: a story more than a website.",
    lesson: "A guided path and a single message make a stranger understand, and trust, fast.",
  },
  {
    name: "Pratham",
    what: "Foundational learning in primary schools, with large research programmes such as ASER.",
    structure: "Broad and content heavy, a repository with separate routes for programmes, reports and data.",
    content: "A treasure of data and downloads, but verbose and full of specialist terms.",
    voice: "Matter-of-fact, credibility through numbers rather than stories.",
    lesson: "Evidence matters to serious partners, as long as it is easy to scan.",
  },
];

// What repeated across all five.
const PATTERNS = [
  ["Content depth", "The best ones give the key points first, details on demand."],
  ["Communication", "Informational, narrative or issue-led."],
  ["Visuals", "Pictures either support the text or lead the story."],
  ["Navigation", "Free, jumping between sections, or a guided path."],
  ["Impact", "Numbers, reports, photos, testimonials. Everyone."],
  ["Prioritisation", "Sorted into categories, rarely ranked by importance."],
];

// What broke on the old Roots site, from the heuristic review.
const HEURISTICS = [
  ["No feedback", "Cards and forms did not react to hover, click or submit."],
  ["Unclear icons", "A small test showed photos explained the work better."],
  ["Endless scroll", "Few ways to jump between sections."],
  ["Inconsistent", "Buttons, cards and numbers changed from page to page."],
  ["No hierarchy", "Long text blocks and loud coloured boxes."],
  ["No help", "No FAQs for partners or donors."],
];

// The brand book, page by page, and where its chapters start.
const BOOK = Array.from({ length: 104 }, (_, i) => `${R}/book/${String(i + 1).padStart(3, "0")}.webp`);
const BOOK_CHAPTERS = [
  { label: "Brand overview", page: 9 },
  { label: "Brand core", page: 17 },
  { label: "Logo system", page: 25 },
  { label: "Colour system", page: 33 },
  { label: "Typography", page: 41 },
  { label: "Visual language", page: 49 },
  { label: "Brand applications", page: 55 },
  { label: "Social media", page: 67 },
  { label: "Website guidelines", page: 73 },
  { label: "Copy guidelines", page: 83 },
  { label: "Co-branding", page: 89 },
  { label: "File management", page: 95 },
  { label: "Quick reference", page: 101 },
];

// Each section, with the picture that previews it when the index is hovered.
const SECTIONS = [
  { id: "overview", label: "Overview", preview: `${R}/cover.webp` },
  { id: "challenge", label: "Challenge and approach", preview: `${R}/laptop-programs.webp` },
  { id: "research", label: "Research", preview: `${R}/research-poster.webp`, fit: "top" as const },
  { id: "identity", label: "Brand identity", preview: `${R}/logo.webp`, fit: "contain" as const },
  { id: "website", label: "Website", preview: `${R}/home.webp`, fit: "top" as const },
  { id: "in-use", label: "Brand in use", preview: `${R}/stationery.webp` },
  { id: "outcome", label: "Outcome", preview: `${R}/laptop-agriculture.webp` },
];

/**
 * The Roots Foundation case study, kept quiet on purpose: a small title, the cover, then short sections in one narrow
 * column on alternating bands, each with a line or two of text and one or two pictures.
 */
export default function RootsStory() {
  // Set `prototype` on the Roots entry in src/content/projects.ts (a Figma prototype share link) and it appears here.
  const prototype = getProject("roots-foundation")?.prototype;
  const details: [string, string][] = [
    ["My role", "Research, brand identity, information architecture, UI design"],
    ["Timeline", "January to May 2026"],
    ["Context", "Graduation project, B.Des Interaction Design, GGSIPU, made during my internship at Roots Foundation"],
    ["Guide", "Dr. Nanki Nath"],
  ];

  return (
    <>
      <header className="mx-auto w-full max-w-[62rem] px-4 pt-28 md:px-6 md:pt-36">
        <BackLink />
        <h1 className="text-[1.25rem] font-medium tracking-tight">Roots Foundation</h1>
        <p className="mt-1 text-[0.9375rem] text-mute">Brand identity and website · 2026</p>
        <div className="mt-8 overflow-hidden rounded-[1rem] bg-paper-2 ring-1 ring-ink/10">
          <RevealImage src={`${R}/cover.webp`} alt="The Roots Foundation website on a laptop" eager />
        </div>
        <div className="mt-12 xl:hidden">
          <StoryIndex sections={SECTIONS} />
        </div>
      </header>

      <div className="relative">
        {/* On wide screens the index stays beside the column while you read */}
        <aside className="pointer-events-none absolute inset-y-0 left-0 hidden w-[calc((100%-62rem)/2)] xl:block">
          <div className="pointer-events-auto sticky top-32 ml-auto mr-10 mt-28 w-44">
            <StoryIndex sections={SECTIONS} peek="below" />
          </div>
        </aside>

        <Band id="overview">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <H>Overview</H>
              <Text>
                Roots Foundation is a non-profit working in agriculture, sports, healthcare, education and skill development. Its work on the ground is
                structured and measurable, yet its identity and website made it look like any other NGO.
              </Text>
              <Text>I redesigned both: a brand system that matches how Roots works, and a website built around what its visitors come to do.</Text>
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

        <Band id="challenge" grey>
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <H>Challenge</H>
              <Bullets
                items={[
                  "All the information was there, but nothing told a visitor what mattered first.",
                  "The menu followed how Roots is organised inside, not what visitors need.",
                  "Companies looking for CSR partners, the main audience, found little proof of impact.",
                ]}
              />
            </div>
            <div>
              <H>Approach</H>
              <Bullets
                items={[
                  "Research: stakeholder interviews, a site audit, a heuristic review and a study of five NGOs.",
                  "A positioning, “Rooted in Impact”, and a brand system built on it.",
                  "A new structure with separate paths for visitors, partners and volunteers.",
                ]}
              />
            </div>
          </div>
        </Band>

        <Band id="research">
          <H>Research</H>
          <Text>
            The old site and the people behind it first, then five other NGOs. It all pointed one way: the site needed order, not more content, and it
            had to show companies evidence.
          </Text>

          <ResearchSplit>
            <div data-focus="process" className="pt-8">
              <Sub>Process</Sub>
              <dl className="mt-4 grid gap-x-8 gap-y-3 text-[0.9375rem] leading-snug sm:grid-cols-2">
                {[
                  ["Discover", "Interviews, a site audit, a heuristic review, five NGOs."],
                  ["Define", "Pain points, user needs, one problem statement."],
                  ["Develop", "Information architecture, wireframes, brand concepts."],
                  ["Deliver", "Hi-fi screens, a prototype, testing, a design system."],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-medium">{k}</dt>
                    <dd className="text-ink/75">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div data-focus="market" className="mt-20">
              <Sub>Market research: five NGOs</Sub>
              <Text>Each site read the same way, for what makes an NGO feel clear and credible online. Pick one.</Text>
              <NgoPicker ngos={NGOS} />
            </div>

            <div data-focus="patterns" className="mt-20">
              <Sub>What repeated across all five</Sub>
              <dl className="mt-4 grid gap-3 text-[0.9375rem] leading-snug">
                {PATTERNS.map(([k, v]) => (
                  <div key={k} className="grid gap-x-4 sm:grid-cols-[8rem_1fr]">
                    <dt className="font-medium">{k}</dt>
                    <dd className="text-ink/75">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div data-focus="insights" className="mt-20">
              <Sub>The old site</Sub>
              <Text>
                Reviewed page by page against Nielsen&apos;s heuristics, and talked through with the founders and corporate partners. The partners kept
                asking for the same things: partnerships, reports, proof.
              </Text>
              <dl className="mt-5 grid gap-3 text-[0.9375rem] leading-snug">
                {HEURISTICS.map(([k, v]) => (
                  <div key={k} className="grid gap-x-4 sm:grid-cols-[8rem_1fr]">
                    <dt className="font-medium">{k}</dt>
                    <dd className="text-ink/75">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div data-focus="synthesis" className="mt-20 grid gap-10 sm:grid-cols-2 sm:gap-8">
              <div>
                <Sub>Pain points</Sub>
                <Bullets
                  items={[
                    "What Roots does is unclear at first sight.",
                    "Navigation ignores what visitors came for.",
                    "Long pages bury the one thing you need.",
                    "Impact is mentioned, never shown.",
                  ]}
                />
              </div>
              <div>
                <Sub>Opportunities</Sub>
                <Bullets
                  items={[
                    "Organise by visitor intent, not departments.",
                    "Put impact and partners first.",
                    "Section navigation instead of scrolling.",
                    "A confident tone, aimed at companies.",
                  ]}
                />
              </div>
            </div>
          </ResearchSplit>
        </Band>

        <Band id="identity" grey>
          <H>Brand identity</H>
          <Text>
            A single source with roots spreading from it, held inside a circle: grounded, and still growing. It came out of three directions, chosen
            because it stays clear at any size.
          </Text>
          <div className="mt-10">
            <LogoStage src={`${R}/logo.webp`} alt="The Roots Foundation logo" />
          </div>
          <div className="mt-16">
            <H>Colour</H>
            <Text>One blue holds the brand together. Each area of work has its own colour, so people know where they are at a glance. Pick one.</Text>
            <div className="mt-8">
              <RootsColours slab={slab.className} jakarta={jakarta.className} />
            </div>
          </div>
          <div className="mt-16">
            <H>Type</H>
            <Text>Two typefaces with two jobs. Move over a name to play with its weight.</Text>
            <div className="mt-8 grid gap-10">
              <div>
                <WeightType text="Zilla Slab" className={`${slab.className} text-[3.25rem] leading-none md:text-[5.5rem]`} min={300} max={700} step={100} />
                <p className="mt-3 text-[0.875rem] text-mute">Headlines. A sturdy slab that gives them weight and credibility, with some warmth so it never feels mechanical.</p>
              </div>
              <div>
                <WeightType text="Plus Jakarta Sans" className={`${jakarta.className} text-[3.25rem] leading-none tracking-[-0.02em] md:text-[5.5rem]`} min={200} max={800} />
                <p className="mt-3 text-[0.875rem] text-mute">Everything people read. Most of the site is reports, news and stories, and a clean, open sans keeps them easy.</p>
              </div>
            </div>
          </div>
          <div className="mt-20">
            <H>The brand book</H>
            <Text>All of it written down, 104 pages, so the brand holds up when I am not in the room. Click or swipe a page to turn it.</Text>
            <div className="mt-8">
              <FlipBook pages={BOOK} ratio={1600 / 1131} chapters={BOOK_CHAPTERS} title="Roots Foundation brand book" />
            </div>
          </div>
        </Band>

        <Band id="website">
          <H>Website</H>
          <Text>
            The same content, reorganised around the three people who visit, instead of around the organisation&apos;s departments. Section tabs cut the
            endless scroll, and every area of work keeps its colour from the menu to the button.
          </Text>

          <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <Sub>Before: by department</Sub>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink/75">
                Home → Who we are · What we do · Resources · Get involved. Everyone takes the same long scroll, whatever they came for.
              </p>
            </div>
            <div>
              <Sub>After: by intent</Sub>
              <dl className="mt-4 grid gap-3 text-[0.9375rem] leading-relaxed">
                {[
                  ["A curious visitor", "Home → Stories → Areas of work"],
                  ["A corporate partner", "Home → Impact → Reports → Partners"],
                  ["A volunteer or donor", "Home → Volunteer → Collaborate"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[0.8125rem] text-mute">{k}</dt>
                    <dd className="text-ink/75">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mt-16">
            <Sub>Home</Sub>
            <p className="mt-2 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink/75">
              The promise first, then the areas of work, the numbers, partners and stories, each a step deeper.
            </p>
            <div className="mt-6">
              <BrowserFrame src={`${R}/home.webp`} alt="The full Roots Foundation homepage design" url="rootsfoundation.in" height="38rem" />
            </div>
          </div>

          <div className="mt-16">
            <Sub>An area of work</Sub>
            <p className="mt-2 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink/75">
              One template for all five areas; only the colour changes, so each feels its own and all feel like Roots.
            </p>
            <div className="mt-6">
              <BrowserFrame src={`${R}/vertical.webp`} alt="The Agriculture and Environment page design" url="rootsfoundation.in/agriculture" height="30rem" />
            </div>
          </div>

          {prototype && (
            <div className="mt-16">
              <Sub>Try it</Sub>
              <p className="mt-2 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink/75">The clickable prototype, straight from Figma.</p>
              <div className="mt-6">
                <PrototypeEmbed src={prototype} title="Roots Foundation website prototype" poster={`${R}/home.webp`} />
              </div>
            </div>
          )}

          <div className="mt-16 grid gap-4 md:grid-cols-2">
            <Picture src={`${R}/laptop-programs.webp`} alt="The programmes section on a laptop" />
            <Picture src={`${R}/laptop-agriculture.webp`} alt="The Agriculture and Environment page on a laptop" />
          </div>
        </Band>

        <Band id="in-use" grey>
          <H>Brand in use</H>
          <Text>On social media, colour blocks name the area of work and black-and-white photos keep it real.</Text>
          <Picture src={`${R}/social.webp`} alt="Roots Foundation social media posts" className="mt-10" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Picture src={`${R}/stationery.webp`} alt="Roots Foundation stationery" />
            <Picture src={`${R}/merch.webp`} alt="Roots Foundation T-shirts and mug" />
          </div>
        </Band>

        <Band id="outcome">
          <H>Outcome</H>
          <Text>
            A brand guideline book, a complete website design with a clickable prototype, and templates for social media and print. The biggest
            lesson: good content goes unseen if the structure does not lead people to it.
          </Text>
        </Band>
      </div>
    </>
  );
}
