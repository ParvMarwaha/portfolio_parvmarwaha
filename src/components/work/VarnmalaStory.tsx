import StoryIndex from "./StoryIndex";
import BackLink from "./BackLink";
import RevealImage from "./RevealImage";
import ThenNow, { type ThenNowPair } from "./ThenNow";
import AppDemo from "./AppDemo";
import VideoEmbed from "@/components/VideoEmbed";
import { Band, H, Sub, Text, Bullets, Picture } from "./story";
import { getProject } from "@/content/projects";

const V = "/images/varnmala";
const ORANGE = "#FF5C00";
const INK = "#131212";

// From the survey of 17 people.
const STATS = [
  ["17", "people surveyed from the target audience"],
  ["94%", "of them between 18 and 25"],
  ["~65%", "had used a language app, mostly Duolingo and Memrise"],
];

// The empathy map, from the research.
const EMPATHY = [
  ["Says", ["“I want to learn Kumaoni more deeply, but it is difficult to find good resources.”", "“I want something quick and fun to learn.”"]],
  ["Thinks", ["Disconnected from his culture when family speak a language he can't.", "Doesn't want it to feel like another course to finish."]],
  ["Does", ["Searches for resources, but rarely finds good ones.", "Picks up words in family conversations, without the context to understand them."]],
  ["Feels", ["Alone, the only one trying to learn.", "Left out of family conversations.", "Motivated: the language will bring him closer to them."]],
] as const;

// The user flow: one path in, then everything home opens into.
const FLOW_IN = ["Onboarding", "Choose a language", "Home"];
const FLOW_OUT = [
  ["Lessons", "All lessons"],
  ["Alphabets", "Pick a letter, hear it, trace it"],
  ["Modules", "All modules"],
  ["Resources", "The resource library"],
  ["Community", "Classes and people to practise with"],
  ["Jump back in", "The current lesson"],
  ["Origin of the language", "Facts, folklore and history"],
];

// The same screen as designed (Figma, 2025) and as built (2026), with what changed.
const PAIRS: ThenNowPair[] = [
  {
    id: "home",
    label: "Home",
    then: `${V}/then/home.webp`,
    now: `${V}/now/home.webp`,
    changes: [
      "A streak and the week at the top, so coming back every day is the first thing you see.",
      "The journey card names the exact lesson you are on.",
      "Practice and a word list joined the shortcuts.",
      "The origins card grew into a Bharat yatra: each module is a stop in a different city.",
    ],
  },
  {
    id: "language",
    label: "Language",
    then: `${V}/then/language.webp`,
    now: `${V}/now/language.webp`,
    changes: [
      "Each language shows its first letter in its own script, so you see the language before you read its name.",
      "Honest about what is ready: Hindi and Bengali work, the rest say “coming soon”.",
      "Start is a slide-to-confirm button, so it is never pressed by accident.",
    ],
  },
  {
    id: "alphabets",
    label: "Alphabet",
    then: `${V}/then/alphabets.webp`,
    now: `${V}/now/alphabets.webp`,
    changes: ["A quiz at the top: hear a sound, find the letter.", "Everything else held up exactly as designed."],
  },
  {
    id: "letter",
    label: "One letter",
    then: `${V}/then/letter.webp`,
    now: `${V}/now/letter.webp`,
    changes: [
      "A dot traces the letter's strokes, so you know how to write it before you try.",
      "Every letter comes with a word that starts with it, here अनार, pomegranate, read aloud.",
      "Arrows step through the alphabet without going back to the grid.",
    ],
  },
  {
    id: "modules",
    label: "Modules",
    then: `${V}/then/modules.webp`,
    now: `${V}/now/modules.webp`,
    changes: [
      "Only the module you are on is orange; the rest stay locked until you finish it.",
      "Each module has a Hindi name and one line on what you will be able to say.",
      "The course was rebuilt for complete beginners: ten modules from first words up.",
    ],
  },
  {
    id: "origin",
    label: "Origin",
    then: `${V}/then/origin.webp`,
    now: `${V}/now/origin.webp`,
    changes: [
      "The placeholder timeline became a narrated story you scroll through, from the first hymns 3,500 years ago to today.",
      "Every era has its own scene and a line in the language of its time.",
    ],
  },
];

/**
 * The Varnmala case study, in the same quiet grammar as Roots Foundation: a small title, the cover, then short
 * sections on alternating bands. The research and design come from the 2025 project; the last two sections show how
 * it changed when it was built in 2026, and the app itself.
 */
export default function VarnmalaStory() {
  const p = getProject("varnmala")!;
  // The Behance images, in their order there.
  const [, , , , , , , , , wireframes, , screens] = p.gallery;
  const sections = [
    { id: "overview", label: "Overview", preview: p.image },
    { id: "research", label: "Research", preview: `${V}/empathy.webp` },
    { id: "structure", label: "Structure", preview: `${V}/then/home.webp`, fit: "top" as const },
    { id: "design", label: "Visual design", preview: screens },
    { id: "film", label: "Film", preview: p.image },
    { id: "built", label: "Design to app", preview: `${V}/now/home.webp`, fit: "top" as const },
    { id: "try", label: "Try the app", preview: `${V}/now/language.webp`, fit: "top" as const },
  ];
  const details: [string, string][] = [
    ["My role", "Research, UX, UI design, motion"],
    ["Timeline", "Designed in 2025, built as an app in 2026"],
    ["Tools", "Designed in Figma, built with Claude"],
    ["Platform", "Mobile app"],
  ];

  return (
    <>
      <header className="mx-auto w-full max-w-[62rem] px-4 pt-28 md:px-6 md:pt-36">
        <BackLink />
        <h1 className="text-[1.25rem] font-medium tracking-tight">Varnmala</h1>
        <p className="mt-1 text-[0.9375rem] text-mute">Language learning app · 2025–26</p>
        <div className="mt-8 overflow-hidden rounded-[1rem] bg-paper-2 ring-1 ring-ink/10">
          <RevealImage src={p.image} alt="The Varnmala home screen on a phone" eager />
        </div>
        <div className="mt-12 xl:hidden">
          <StoryIndex sections={sections} />
        </div>
      </header>

      <div className="relative">
        <aside className="pointer-events-none absolute inset-y-0 left-0 hidden w-[calc((100%-62rem)/2)] xl:block">
          <div className="pointer-events-auto sticky top-32 ml-auto mr-10 mt-28 w-44">
            <StoryIndex sections={sections} peek="below" />
          </div>
        </aside>

        <Band id="overview">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <H>Overview</H>
              <Text>
                Varnmala (वर्णमाला, “the alphabet”) is an app for learning Indian languages, starting with Hindi. It breaks scripts and grammar into
                short, bite-sized modules, alongside stories and everyday conversation.
              </Text>
              <Text>It is for anyone picking up a new language, or reconnecting with the one their family speaks.</Text>
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

        <Band id="research" grey>
          <H>Research</H>
          <Text>
            Many Indians, especially in cities, live between English and Hindi. The languages of home slowly slip away, and there is no good place
            to learn them. A survey and two personas showed what stands in the way.
          </Text>

          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-ink/10 pt-8 md:gap-6">
            {STATS.map(([n, t]) => (
              <div key={n}>
                <dt className="text-[1.75rem] font-medium leading-none tracking-tighter md:text-[2.5rem]" style={{ color: ORANGE }}>
                  {n}
                </dt>
                <dd className="mt-2 max-w-[14rem] text-[0.8125rem] leading-snug text-ink/70 md:text-[0.875rem]">{t}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <div>
              <Sub>What got in the way</Sub>
              <Bullets items={["Too few resources", "No proper guidance", "Losing motivation"]} />
            </div>
            <div>
              <Sub>What people expected</Sub>
              <Bullets items={["Video lessons and exercises", "Game-like progress", "Practice over theory", "The culture behind the words"]} />
            </div>
            <div>
              <Sub>Who it is for</Sub>
              <Text>University students around twenty: short on time, learning alone, and wanting someone to practise with.</Text>
            </div>
          </div>

          {/* The empathy map, set as text so nothing is cropped */}
          <div className="mt-14">
            <Sub>Empathy map</Sub>
            <div className="mt-5 grid overflow-hidden rounded-[0.875rem] sm:grid-cols-2" style={{ background: ORANGE }}>
              {EMPATHY.map(([k, items], n) => (
                <div
                  key={k}
                  className={`border-white/25 p-5 text-white md:p-7 ${n % 2 === 0 ? "sm:border-r" : ""} ${n < 2 ? "border-b" : n === 2 ? "border-b sm:border-b-0" : ""}`}
                >
                  <p className="text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-white/75">{k}</p>
                  <ul className="mt-3 grid gap-2 text-[0.9375rem] leading-snug">
                    {items.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Band>

        <Band id="structure">
          <H>Structure</H>
          <Text>
            One path in, then home opens into everything else, with a shortcut back into the current lesson and the story of where the language
            comes from.
          </Text>
          <div className="mt-10 rounded-[0.875rem] p-5 text-white md:p-8" style={{ background: INK }}>
            <ol className="flex flex-wrap items-center gap-2 text-[0.875rem]">
              {FLOW_IN.map((s, n) => {
                const last = n === FLOW_IN.length - 1;
                return (
                  <li key={s} className="flex items-center gap-2">
                    <span className={`rounded-full px-3.5 py-1.5 ${last ? "font-medium" : "bg-white/10"}`} style={last ? { background: ORANGE } : undefined}>
                      {s}
                    </span>
                    {!last && (
                      <span aria-hidden className="text-white/40">
                        →
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            <ul className="mt-6 grid gap-x-8 border-l pl-5 sm:grid-cols-2" style={{ borderColor: `${ORANGE}99` }}>
              {FLOW_OUT.map(([a, b]) => (
                <li key={a} className="border-b border-white/10 py-3 text-[0.875rem]">
                  <span className="font-medium">{a}</span>
                  <span className="text-white/55"> → {b}</span>
                </li>
              ))}
            </ul>
          </div>
        </Band>

        <Band id="design" grey>
          <H>Visual design</H>
          <Text>
            One loud orange and a near-black, set in Overused Grotesk. Devanagari letters work as the graphic layer, so the script itself becomes
            the decoration.
          </Text>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:max-w-[30rem]">
            {[
              [ORANGE, INK],
              [INK, ORANGE],
            ].map(([c, t]) => (
              <div key={c} className="flex aspect-[3/2] items-end justify-between rounded-[0.875rem] p-4" style={{ background: c, color: t }}>
                <span className="text-[0.875rem] font-medium">{c}</span>
                <span className="text-[2rem] leading-none">अ</span>
              </div>
            ))}
          </div>
          <div className="mt-14">
            <Sub>Wireframes to final screens</Sub>
          </div>
          <Picture src={wireframes} alt="Hi-fi wireframes of every screen" className="mt-6" />
          <Picture src={screens} alt="Final screens: home, alphabet, community and a lesson" className="mt-6" />
        </Band>

        {p.vimeo && (
          <Band id="film">
            <H>Film</H>
            <Text>A short motion piece walking through the design: the transitions carry you from one part to the next.</Text>
            <div className="mt-8 overflow-hidden rounded-[0.875rem] ring-1 ring-ink/10">
              <VideoEmbed id={p.vimeo} poster={p.image} title="Varnmala film" fallbackHref={`https://vimeo.com/${p.vimeo}`} />
            </div>
          </Band>
        )}

        <Band id="built" grey>
          <H>From design to app</H>
          <Text>
            In 2026 I took the Figma file and built Varnmala as a working app. Building it with real lessons and real sound changed it: some screens
            held up, others grew.
          </Text>
          <div className="mt-10">
            <ThenNow pairs={PAIRS} thenLabel="Design · 2025" nowLabel="App · 2026" />
          </div>
        </Band>

        <Band id="try">
          <H>Try the app</H>
          <Text>
            The app itself, not a prototype: a full Hindi course and a Bengali course, every letter with its sound, and the story of each language.
          </Text>
          <div className="mt-10">
            <AppDemo
              src="/varnmala-app/onboarding"
              poster={`${V}/now/language.webp`}
              name="Varnmala"
              tips={["Pick a language and set a daily goal.", "Tap a letter to hear it, then trace it.", "Open the story of Hindi and scroll back 3,500 years."]}
              note="A web build of the app in a demo mode: no account needed, and your progress stays in this browser."
              reset={["varnmala:"]}
            />
          </div>
        </Band>
      </div>
    </>
  );
}
