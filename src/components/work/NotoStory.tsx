import StoryIndex from "./StoryIndex";
import BackLink from "./BackLink";
import RevealImage from "./RevealImage";
import AppDemo from "./AppDemo";
import AccentPicker from "./AccentPicker";
import { Band, H, Sub, Text, Bullets } from "./story";
import { getProject } from "@/content/projects";

// Noto's own typeface, loaded only on this page for the type specimen. It comes straight from Google Fonts in the
// browser (as in the app itself), not through next/font: the host's build server could not fetch it at build time.
const OUTFIT_CSS = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;800&display=swap";
const outfit = { className: "font-outfit" };

const N = "/images/noto";
const LIME = "#D2F565";
const INK = "#0A0A0A";
// The palette, from the app's stylesheet (dark mode, its default look).
const PALETTE = [
  ["Lime", "#C8F542", "The one accent: today's card, the main buttons, progress", "#0B0B0C"],
  ["Ink", "#0A0A0B", "The background, so the lime glows", "#F4F4F1"],
  ["Surface", "#151517", "Cards and sheets, one step up", "#F4F4F1"],
  ["Paper", "#F4F4F1", "Text, and the light theme's base", "#0B0B0C"],
];
// Colour that carries meaning: how close today is to its limit.
const LEVELS = [
  ["On track", "#C8F542"],
  ["Careful", "#F5B83D"],
  ["Over", "#F87171"],
];

// Desk research: public numbers, each with its source.
const STATS = [
  ["74%", "of 235 people in an IIIT Delhi study said they spend more because of UPI; only 7% spend less.", "arXiv, 2024", "https://arxiv.org/abs/2401.09937"],
  ["25 bn+", "UPI payments in October 2026 alone, a new monthly record.", "NPCI data", "https://india.entrepreneur.com/business-news/upi-hits-record-25-47-bn-transactions-in-october-daily-value-crosses-inr-1-l-cr"],
  ["₹589", "the average UPI payment to a shop in the first half of 2025: small, frequent, easy to miss.", "Worldline", "https://worldline.com/content/dam/worldline/local/en-in/documents/main-page11111/Worldline-India-Digital-Payment-Report-1H-2025-1.pdf"],
];

// The kinds of tools people already use, what they do well, and what is missing.
const EXISTING = [
  ["Expense trackers", "Accurate, if you type in every spend.", "Typing every chai is where people give up."],
  ["Apps that read bank texts", "Spends arrive by themselves.", "They show charts of the past, not what you can spend today."],
  ["Bank and UPI apps", "The real balance, always.", "A balance is not a budget: it doesn't know the rent is due on the 5th."],
  ["To-do apps", "Good at the day's tasks.", "Money lives in another app, so the day is split in two."],
];

// Found by using it every day, and what each one changed.
const LEARNED = [
  ["Typing the salary and every bill felt like homework.", "Salary and bills are recognised from the bank alerts, with one tap to confirm."],
  ["The limit used the whole bank balance, so spending it would eat into older savings.", "The limit now comes from this salary only; older money is left alone."],
  ["Money not spent today thinned out over the whole month.", "What you don't spend moves to tomorrow in full."],
  ["Charts said I overspent, after it was too late.", "The warning moved to the moment of adding a spend, and to the lock screen."],
];


/** One screen of the app, in a dark phone-shaped frame. */
function Screen({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="mx-auto w-full max-w-[17rem]">
      <div className="overflow-hidden rounded-[2rem] ring-[5px] ring-[#2a2a2a]" style={{ background: INK }}>
        <RevealImage src={src} alt={alt} />
      </div>
      {caption && <figcaption className="mt-3 text-center text-[0.8125rem] leading-snug text-mute">{caption}</figcaption>}
    </figure>
  );
}

/** A section with its words on one side and a screen on the other. */
function Split({ children, screen, flip = false }: { children: React.ReactNode; screen: React.ReactNode; flip?: boolean }) {
  return (
    <div className={`grid items-center gap-12 md:gap-16 ${flip ? "md:grid-cols-[17rem_1fr]" : "md:grid-cols-[1fr_17rem]"}`}>
      <div className={flip ? "md:order-2" : ""}>{children}</div>
      {screen}
    </div>
  );
}

/**
 * The Noto case study, in the same quiet grammar as the others: a small title, the cover, then short sections on
 * alternating bands. Every screen is from the app's demo build, filled with made-up data; the last section is that
 * build, running in the page.
 */
export default function NotoStory() {
  const p = getProject("noto")!;
  const sections = [
    { id: "overview", label: "Overview", preview: p.image },
    { id: "research", label: "Research", preview: `${N}/chart.webp`, fit: "top" as const },
    { id: "idea", label: "One number a day", preview: `${N}/money.webp`, fit: "top" as const },
    { id: "typing", label: "Less typing", preview: `${N}/money.webp`, fit: "top" as const },
    { id: "nudge", label: "A nudge, not a report", preview: `${N}/spend.webp`, fit: "top" as const },
    { id: "ask", label: "Ask Noto", preview: `${N}/ask.webp`, fit: "top" as const },
    { id: "tasks", label: "Tasks", preview: `${N}/tasks.webp`, fit: "top" as const },
    { id: "look", label: "Colour and type", preview: p.image },
    { id: "try", label: "Try the app", preview: `${N}/tasks.webp`, fit: "top" as const },
  ];
  const details: [string, string][] = [
    ["My role", "Product, UX, UI, motion"],
    ["Timeline", "May to November 2026"],
    ["Tools", "Built with Claude and Antigravity"],
    ["Platforms", "iPhone, Android and the web"],
  ];

  return (
    <>
      <link rel="stylesheet" href={OUTFIT_CSS} precedence="default" />
      <header className="mx-auto w-full max-w-[62rem] px-4 pt-28 md:px-6 md:pt-36">
        <BackLink />
        <h1 className="text-[1.25rem] font-medium tracking-tight">Noto</h1>
        <p className="mt-1 text-[0.9375rem] text-mute">Tasks and money app · 2026</p>
        <div className="mt-8 overflow-hidden rounded-[1rem] ring-1 ring-ink/10" style={{ background: INK }}>
          <RevealImage src={p.image} alt="Noto on three phones: tasks, money and Ask Noto" eager />
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
                Noto is my own app for the two things I check every day: what I have to do, and how much I can spend. Two tabs, Tasks and Money, in
                one calm place.
              </Text>
              <Text>I designed it and built it with Claude, and I use it every day.</Text>
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
            UPI made paying instant and almost invisible. Small payments add up without being felt, and most tools only show the damage at the
            end of the month.
          </Text>

          <dl className="mt-10 grid gap-6 border-t border-ink/10 pt-8 sm:grid-cols-3">
            {STATS.map(([n, t, src, href]) => (
              <div key={n}>
                <dt className="text-[2rem] font-medium leading-none tracking-tighter md:text-[2.5rem]">{n}</dt>
                <dd className="mt-2 text-[0.875rem] leading-snug text-ink/70">
                  {t}{" "}
                  <a href={href} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-mute underline decoration-line underline-offset-2 hover:text-ink">
                    {src} ↗
                  </a>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-14">
            <Sub>What already exists, and the gap</Sub>
            <ul className="mt-5 grid gap-px overflow-hidden rounded-[0.875rem] bg-ink/10 sm:grid-cols-2">
              {EXISTING.map(([kind, good, gap]) => (
                <li key={kind} className="bg-paper p-5">
                  <p className="text-[0.9375rem] font-medium tracking-tight">{kind}</p>
                  <p className="mt-2 text-[0.875rem] leading-snug text-ink/70">{good}</p>
                  <p className="mt-2 text-[0.875rem] leading-snug">
                    <span className="text-mute">Gap: </span>
                    {gap}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <div>
              <Sub>What I learned using it myself</Sub>
              <Text>Noto was built for me first, so my own use was the longest test. Each problem changed the design:</Text>
            </div>
            <ul className="grid content-start gap-4">
              {LEARNED.map(([found, changed]) => (
                <li key={found} className="border-l-2 pl-4" style={{ borderColor: LIME }}>
                  <p className="text-[0.9375rem] leading-snug">{found}</p>
                  <p className="mt-1 text-[0.875rem] leading-snug text-ink/65">→ {changed}</p>
                </li>
              ))}
            </ul>
          </div>
        </Band>

        <Band id="idea">
          <Split screen={<Screen src={`${N}/money.webp`} alt="The Money tab: spent today, today's limit and the days to payday" />}>
            <H>One number a day</H>
            <Text>
              Budgeting apps show charts of money already gone. Noto answers one question for today: how much can I spend and still be fine until
              payday?
            </Text>
            <div className="mt-8 rounded-[0.875rem] p-5 md:p-6" style={{ background: INK, color: "#fff" }}>
              <p className="text-[0.8125rem] text-white/55">Free until payday</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[0.9375rem] leading-relaxed">
                <span>this salary</span>
                <span className="text-white/40">−</span>
                <span>bills</span>
                <span className="text-white/40">−</span>
                <span>savings</span>
                <span className="text-white/40">−</span>
                <span>spent</span>
              </p>
              <p className="mt-4 text-[0.8125rem] text-white/55">Today&apos;s limit</p>
              <p className="mt-1 text-[0.9375rem]" style={{ color: LIME }}>
                that, spread over the days left
              </p>
            </div>
            <Bullets
              items={[
                "Money already in the bank before this salary is left alone.",
                "What you don't spend today moves to tomorrow in full.",
                "Dots on the payday line are the bills still to come.",
              ]}
            />
          </Split>
        </Band>

        <Band id="typing" grey>
          <H>Less typing</H>
          <Text>Typing every spend, the salary and every bill is where money apps lose people. So Noto learns them.</Text>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["Payments arrive by themselves", "UPI payments land from bank alerts: a shortcut on the iPhone, the texts on Android."],
              ["Salary and bills, recognised", "A credit that says salary is recorded for its pay cycle; payments that repeat are offered as bills."],
              ["Quick-adds it learns", "The spends you repeat (chai ₹20, auto ₹60) become one-tap buttons."],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-ink/10 pt-5">
                <Sub>{t}</Sub>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink/70">{d}</p>
              </div>
            ))}
          </div>
        </Band>

        <Band id="nudge">
          <Split flip screen={<Screen src={`${N}/spend.webp`} alt="Adding a spend past today's limit: Noto shows what it does to tomorrow" />}>
            <H>A nudge, not a report</H>
            <Text>
              A chart at the end of the month can&apos;t undo anything. Noto speaks up at the moment of spending, while there is still a choice.
            </Text>
            <Bullets
              items={[
                "A spend past today's limit asks twice, and shows how much tomorrow drops.",
                "It also says what the spend costs in hours of your work.",
                "The card turns amber near the limit and red past it.",
                "A spend card on the lock screen, with quick-add buttons that work while Noto is closed.",
              ]}
            />
          </Split>
        </Band>

        <Band id="ask" grey>
          <Split screen={<Screen src={`${N}/ask.webp`} alt="Ask Noto answering: do I spend more at weekends?" />}>
            <H>Ask Noto</H>
            <Text>
              Questions in plain words, in English or Hinglish: “Swiggy pe weekend ko kitna gaya?”, “Do I spend more at weekends?”, a monthly
              report.
            </Text>
            <Text>
              The answers are worked out on the phone from your own records, so nothing is sent anywhere. When a question isn&apos;t understood, it
              says so instead of guessing.
            </Text>
          </Split>
        </Band>

        <Band id="tasks">
          <Split flip screen={<Screen src={`${N}/tasks.webp`} alt="The Tasks tab: done today, a streak, and what is overdue" />}>
            <H>Tasks</H>
            <Text>The other half of the day, kept just as light.</Text>
            <Bullets
              items={[
                "Ticking a task draws the tick and the strike, then the row folds away.",
                "Swipe right to finish, left to delete.",
                "A streak of days with something done.",
                "Timers and today's tasks on the lock screen.",
                "A morning summary and an evening check-in, which go quiet if you stop opening the app.",
              ]}
            />
          </Split>
          <div className="mt-16 grid gap-10 sm:grid-cols-2">
            <Screen src={`${N}/chart.webp`} alt="Last 7 days against the daily plan, and spending month by month" caption="Each day against the plan, and month by month" />
            <div className="self-center">
              <Sub>Patterns, without homework</Sub>
              <Text>
                The last seven days against the plan, months side by side, and short notes such as “Treats are 37% higher than last cycle”, each
                with the one thing to do about it.
              </Text>
            </div>
          </div>
        </Band>

        <Band id="look" grey>
          <H>Colour and type</H>
          <Text>
            Dark and quiet, with one loud colour. Lime is saved for what matters right now, so the eye goes straight to today&apos;s number.
          </Text>

          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {PALETTE.map(([name, hex, use, fg]) => (
              <li key={hex} className="flex aspect-[4/5] flex-col justify-between rounded-[0.875rem] p-4 ring-1 ring-ink/10" style={{ background: hex, color: fg }}>
                <span className="text-[0.9375rem] font-medium">{name}</span>
                <span>
                  <span className="block text-[0.8125rem] leading-snug opacity-70">{use}</span>
                  <span className="mt-2 block text-[0.8125rem] font-medium tabular-nums">{hex}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-[0.875rem] p-5" style={{ background: INK, color: "#F4F4F1" }}>
              <p className="text-[0.8125rem] text-white/55">Colour that means something</p>
              <ul className="mt-4 grid gap-3">
                {LEVELS.map(([label, hex], n) => (
                  <li key={label} className="flex items-center gap-3 text-[0.9375rem]">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full" style={{ width: `${[45, 80, 100][n]}%`, background: hex }} />
                    </span>
                    <span className="w-20 text-right" style={{ color: hex }}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.8125rem] leading-snug text-white/55">Today&apos;s card turns amber near the limit and red past it.</p>
            </div>
            <div className="rounded-[0.875rem] p-5" style={{ background: INK, color: "#F4F4F1" }}>
              <AccentPicker font={outfit.className} />
            </div>
          </div>

          <div className={`mt-6 grid gap-6 overflow-hidden rounded-[0.875rem] p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8 ${outfit.className}`} style={{ background: INK, color: "#F4F4F1" }}>
            <div>
              <p className="text-[0.8125rem] text-white/55">Outfit</p>
              <p className="mt-3 text-[3.5rem] font-extrabold leading-none tracking-tight md:text-[5.5rem]" style={{ color: LIME }}>
                ₹858
              </p>
              <p className="mt-3 text-[1.125rem] font-medium">left for today</p>
              <p className="mt-1 text-[0.9375rem] font-light text-white/60">Aa Bb Cc 0123456789</p>
            </div>
            <p className="max-w-[18rem] text-[0.875rem] leading-relaxed text-white/60">
              One geometric family, from light to extra bold. Its round numerals make money feel calm rather than alarming, and the big number is
              always the first thing read.
            </p>
          </div>
        </Band>

        <Band id="try">
          <H>Try the app</H>
          <Text>The app itself, filled with made-up data: add a spend past the limit, ask Noto a question, tick off a task.</Text>
          <div className="mt-10">
            <AppDemo
              src="/noto-app/index.html"
              poster={`${N}/tasks.webp`}
              name="Noto"
              accent={LIME}
              onAccent={INK}
              tips={["Open Money and add a spend bigger than today's limit.", "Ask Noto: “Do I spend more at weekends?”", "Swipe or tick a task on the Tasks tab."]}
              note="A web build of the app with made-up data, not anyone's real money. Nothing leaves this browser."
              reset={["noto_", "tictick_"]}
            />
          </div>
        </Band>
      </div>
    </>
  );
}
