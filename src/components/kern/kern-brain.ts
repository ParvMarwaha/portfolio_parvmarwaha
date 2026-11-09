import { site } from "@/content/site";
import { projects, displayTitle, isOfType, type Project, type ProjectType } from "@/content/projects";

/**
 * Kern's brain, free and offline: no AI service, nothing leaves the browser. A question is matched against topics
 * (by keywords, including a little Hinglish) and against the real projects, tools and kinds of work from the site's
 * content, and Kern answers from a few hand-written variations per topic, in its own voice. Unknown things get an
 * honest "I don't know" that points to Parv's email, never a made-up fact.
 *
 * To feel less like a menu it also: forgives typos, answers a lot of small talk and silly questions, does a few things
 * on screen when asked (dance, spin, party, change the site's colours, show the work), handles quick sums, the time in
 * India, coin flips and dice, and turns "can you...", "do you like...", "are you..." questions into replies that reuse
 * the visitor's own words.
 */

/** Something Kern can do on screen as part of an answer. */
export type KernAction = "dance" | "spin" | "hop" | "party" | "sleep" | "theme" | "work" | "hire";
export type KernReply = { text: string; action?: KernAction };
type Topic = { id: string; words: string[]; replies: (q: Ctx) => string[]; action?: KernAction };
type Ctx = { project?: Project; kind?: string; tool?: string };

const email = site.email;
const years = projects.map((p) => p.year);
const span = `${Math.min(...years)} to ${Math.max(...years)}`;

const KINDS: Record<string, { label: string; type: Project["type"] | "Research"; words: string[] }> = {
  ui: { label: "UI/UX", type: "UI/UX", words: ["ui", "ux", "app", "apps", "interface", "interfaces", "product", "website", "web", "mobile", "prototype"] },
  brand: { label: "branding", type: "Branding", words: ["brand", "branding", "logo", "logos", "identity", "identities", "visual identity", "guidelines"] },
  motion: { label: "motion", type: "Motion", words: ["motion", "animation", "animate", "animated", "video", "after effects", "ae"] },
  illus: { label: "illustration", type: "Illustration", words: ["illustration", "illustrations", "illustrate", "drawing", "art", "vector"] },
  research: { label: "research", type: "Others", words: ["research", "case study", "usability", "accessibility", "ux research"] },
};
// The words in the intro sentence that filter the work (see Intro.tsx); other kinds are in the filter tabs.
const INTRO_WORD: Record<string, string> = { ui: "interfaces", brand: "brands", motion: "motion" };
const TOOLS = ["figma", "after effects", "illustrator", "photoshop", "claude", "antigravity"];

const pick = <T,>(list: T[], avoid?: T) => {
  const options = list.length > 1 && avoid !== undefined ? list.filter((x) => x !== avoid) : list;
  return options[Math.floor(Math.random() * options.length)];
};

const ofKind = (type: string) => projects.filter((p) => isOfType(p, type as ProjectType));
const names = (list: Project[]) => {
  const t = list.map((p) => p.title);
  return t.length <= 1 ? t.join("") : `${t.slice(0, -1).join(", ")} and ${t[t.length - 1]}`;
};

const TOPICS: Topic[] = [
  {
    id: "project",
    words: [],
    replies: ({ project: p }) =>
      p
        ? [
            `${displayTitle(p)}: ${p.summary} Made with ${p.tools.join(", ")} in ${p.year}. It's in the frames below, click it for the full thing.`,
            `Ah, ${p.title}. ${p.summary} ${p.tools.join(" + ")}, ${p.year}. Ten out of ten kerning, I checked.`,
          ]
        : [],
  },
  {
    id: "kind",
    words: [],
    replies: ({ kind }) => {
      const k = kind ? KINDS[kind] : undefined;
      if (!k) return [];
      const list = ofKind(k.type);
      if (!list.length) return [`He does ${k.label} too, but there's nothing of it on the site yet. Ask him at ${email}.`];
      return [
        `Yes! ${k.label[0].toUpperCase() + k.label.slice(1)} is one of his things: ${names(list)}. ${INTRO_WORD[kind!] ? `Click "${INTRO_WORD[kind!]}" in the intro` : `Pick "${k.type}" in the filters below`} to see just those.`,
        `For ${k.label}, look at ${names(list)}. ${list.length === 1 ? "It's" : "They're"} right below, I keep them tidy.`,
      ];
    },
  },
  {
    id: "tool",
    words: [],
    replies: ({ tool }) => {
      if (!tool) return [];
      const name = site.tools.find((t) => t.toLowerCase() === tool) ?? tool;
      return [
        `${name}? Yep, it's in his kit: ${site.tools.join(", ")}.`,
        `He uses ${name}, along with ${site.tools.filter((t) => t !== name).join(", ")}. I mostly use my handles.`,
      ];
    },
  },
  {
    id: "tools",
    words: ["tools", "software", "stack", "apps does he use"],
    replies: () => [`His kit: ${site.tools.join(", ")}. Plus a mascot, obviously.`, `${site.tools.join(", ")}. Design tools for the look, AI tools to make it more interactive, and code to ship it.`],
  },
  {
    id: "kern",
    words: ["who are you", "your name", "what are you", "kern", "mascot", "are you a bot", "are you ai", "are you real", "tum kaun", "kaun ho"],
    replies: () => [
      "I'm Kern, Parv's design buddy. Technically a selection box with feelings. I fix the kerning on his name when nobody's looking.",
      "Kern. Small, yellow, made of a selection box. Not an AI, just very well rehearsed. Ask me about Parv!",
    ],
  },
  {
    id: "rates",
    words: ["how much", "kitne ka", "rate", "rates", "price", "pricing", "cost", "charge", "charges", "fee", "fees", "budget", "salary", "paid", "pay", "kitna", "paisa", "paise"],
    replies: () => [
      `Money talk is above my pay grade (I'm paid in pixels). Email him at ${email} with what you need and he'll send numbers.`,
      `Depends on the project, and he'd rather hear about yours first. Drop a line at ${email}.`,
    ],
  },
  {
    id: "resume",
    words: ["resume", "cv", "résumé", "portfolio pdf"],
    replies: () => ["His resume is on the Contact page: view it in the browser or download it. Go on, it's short and well kerned.", "Contact page, top left: View resume. I'd print it, but I don't have hands. Well, handles."],
  },
  {
    id: "hire",
    words: ["hire", "hiring", "available", "availability", "freelance", "full time", "full-time", "fulltime", "job", "jobs", "role", "work with", "collab", "collaborate", "open to", "project for", "can he do", "naukri", "kaam"],
    replies: () => [
      `Yes, he's ${site.availability.toLowerCase()}. Hit "Hire me" or email ${email}. I'll pretend I didn't see you get excited.`,
      `He's open to freelance projects and full-time roles. Fastest route: ${email}, or the Contact page.`,
      `Available and very much hireable. ${email}. Tell him Kern sent you, I get nothing but I like the credit.`,
    ],
  },
  {
    id: "contact",
    words: ["email", "mail", "contact", "reach", "phone", "number", "call", "whatsapp", "linkedin", "instagram", "insta", "social", "socials", "dm", "message him", "talk to him", "baat"],
    replies: () => [
      `Email: ${email}. Phone: ${site.phone}. He's also on LinkedIn and Instagram, links on the Contact page.`,
      `${email} is the best way. There's a "Copy email" button down there if you're as lazy as I am.`,
    ],
  },
  {
    id: "location",
    words: ["where", "based", "location", "india", "city", "country", "timezone", "time zone", "live", "lives", "kahan", "kaha"],
    replies: () => ["He's based in India (the clock in the corner is his time). Happy to work remotely with anyone, anywhere.", "India! IST, which you can see ticking on the cover. Time zones are just a grid problem anyway."],
  },
  {
    id: "code",
    words: ["code", "coding", "develop", "developer", "dev", "build", "builds", "ship", "ships", "react", "next", "nextjs", "frontend", "front-end", "website built", "made this site", "this website"],
    replies: () => [
      "Yes, he designs AND builds. This whole site, me included, is his design, shipped. I'm the proof that walks.",
      "He can take a design all the way to working code. That's how I went from a Figma frame to a creature who answers questions.",
    ],
  },
  {
    id: "ai",
    words: ["ai", "artificial intelligence", "claude", "chatgpt", "gpt", "antigravity", "llm", "prompt"],
    replies: () => [`${site.aiNote.short} He works with Claude and Antigravity next to Figma and After Effects.`, "AI is part of how he works: Claude and Antigravity sit next to Figma in his kit, to make products more engaging and interactive."],
  },
  {
    id: "experience",
    words: ["experience", "years", "how long", "senior", "junior", "fresher", "education", "college", "degree", "study", "studied", "university", "agency", "company", "work at", "works at", "current job"],
    replies: () => [
      `The work on this site runs from ${span}. For the full story (studies, roles, years) his resume on the Contact page has it, or ask him at ${email}.`,
      `I only know what's on this site: projects from ${span}. His resume on the Contact page covers the rest.`,
    ],
  },
  {
    id: "best",
    words: ["best", "favourite", "favorite", "proud", "top project", "strongest", "start with", "recommend"],
    replies: () => {
      const p = pick(projects.slice(0, 4));
      return [`If you see one, see ${p.title}: ${p.summary} Then the rest, obviously.`, `I'm biased, but start with ${p.title}. ${p.summary}`];
    },
  },
  {
    id: "skills",
    words: ["skill", "skills", "what does he do", "what he does", "services", "good at", "expertise", "speciality", "specialty", "strengths", "designer", "kya karta"],
    replies: () => [
      "Interfaces, brand identity, motion and illustration, and he builds what he designs. Basically a one-person studio with good kerning.",
      "UI/UX, branding, motion graphics, illustration, and the code to ship it. Click interfaces, brands or motion in the intro to filter his work.",
    ],
  },
  {
    id: "projects",
    words: ["project", "projects", "work", "portfolio", "show me", "examples", "case studies", "case study"],
    replies: () => [
      `${projects.length} projects so far: ${names(projects.slice(0, 5))} and more. They're the frames right below me.`,
      `Scroll down: ${projects.length} frames, from ${names(projects.slice(0, 3))} to motion pieces and illustration. Or try "Show me the work".`,
    ],
  },
  {
    id: "game",
    words: ["game", "play", "break the grid", "breakout", "bored"],
    replies: () => ['There\'s a little game called Break the Grid under "Off hours" in the top bar. Some of his projects hide in the bricks.', "Bored? Off hours, top right. Break the Grid. Try not to break me."],
  },
  {
    id: "lab",
    words: ["lab", "experiment", "experiments", "generative", "playground"],
    replies: () => ["The Lab (top bar) is where his experiments live: generative visuals, type and colour toys. I'm not allowed in, I touch everything."],
  },
  {
    id: "joke",
    words: ["joke", "funny", "laugh", "make me laugh", "entertain", "mazak"],
    replies: () => [
      "Why did the designer break up with the grid? It kept trying to put them in a box. (Parv didn't approve this joke.)",
      "I asked for 2px more padding. The client said make the logo bigger. We're still not speaking.",
      "There are two kinds of designers: those who kern, and those who should.",
    ],
  },
  {
    id: "greet",
    words: ["hi", "hello", "hey", "yo", "hola", "namaste", "sup", "hii", "hiii", "good morning", "good evening"],
    replies: () => ["Hey! I'm Kern. Ask me about Parv: his work, how to hire him, his tools, anything.", "Hello hello. Want the short version? Designer, builds his designs, available now. Ask away."],
  },
  {
    id: "thanks",
    words: ["thanks", "thank you", "thx", "ty", "cool", "nice", "awesome", "great", "love it", "amazing", "shukriya", "badhiya", "mast"],
    replies: () => ["Aww. I'll tell him you said that (I tell him everything).", "Thank you! I'd blush but I'm already yellow."],
  },
  {
    id: "rude",
    words: ["ugly", "stupid", "dumb", "sucks", "bad", "hate", "boring", "useless", "bekar"],
    replies: () => ["Ouch. Noted, filed under feedback, slightly cried. Anything I can actually help with?", "Harsh. But revisions are my love language. What would you change?"],
  },
  {
    id: "bye",
    words: ["bye", "goodbye", "see you", "later", "cya", "chalo"],
    replies: () => [`Bye! If you remember one thing: ${email}.`, "See you. I'll be here, fixing kerning."],
  },
];

// Small talk, silly questions and things Kern can do. Kept separate so the facts above stay easy to find.
const FUN: Topic[] = [
  { id: "dance", words: ["dance", "dancing", "boogie", "groove", "naach", "nacho"], action: "dance", replies: () => ["Okay okay, don't look at my feet. *aligns to the beat*", "Music on? I dance best on an 8px grid."] },
  { id: "spin", words: ["spin", "rotate", "twirl", "backflip", "flip", "do a trick", "trick"], action: "spin", replies: () => ["Pixel-perfect 360. Rotation: 0° → 360° → slightly dizzy.", "Wheee. Transform: rotate(1turn)."] },
  { id: "hop", words: ["jump", "hop", "bounce"], action: "hop", replies: () => ["Boing! Gravity is just a suggestion here.", "Up, down, squash, stretch. Twelve principles of animation, baby."] },
  { id: "party", words: ["party", "celebrate", "confetti", "yay", "woohoo", "birthday"], action: "party", replies: () => ["PARTY. In brand colours only, I'm not an animal.", "Confetti deployed. Kerning remains tight."] },
  { id: "sleep", words: ["sleep", "nap", "tired", "good night", "goodnight", "rest"], action: "sleep", replies: () => ["Zzz… wake me if anyone says the word hire.", "Power-saving mode. Poke to wake."] },
  { id: "theme", words: ["change", "change the colour", "change the color", "change the colours", "change the colors", "change colour", "change color", "change colours", "change colors", "new colours", "new colors", "colour", "color", "colours", "colors", "theme", "dark mode", "light mode", "rang"], action: "theme", replies: () => ["New palette, coming right up. Don't worry, his projects keep their own colours.", "Let's repaint the place. You can also press the little colour button up top whenever."] },
  { id: "showwork", words: ["show work", "show me work", "see work", "see projects", "show projects", "show me the work"], action: "work", replies: () => ["Here you go. Arrows to flip, Open to step in."] },
  { id: "gohire", words: ["take me to hire", "where do i hire", "hire button", "i want to hire", "lets hire", "let s hire"], action: "hire", replies: () => ["Follow me, it's the orange button. Best button on the site."] },
  { id: "food", words: ["food", "eat", "hungry", "pizza", "pineapple", "biryani", "chai", "coffee", "tea", "khana"], replies: () => ["Chai over coffee, always. Pineapple on pizza is fine, Comic Sans on a menu is not.", "I run on chai and good contrast ratios.", "I don't eat, but if I did: a perfectly square samosa. Wait."] },
  { id: "pets", words: ["cat", "cats", "dog", "dogs", "pet", "pets"], replies: () => ["Cats. They also sit on things that are clearly being worked on.", "Dogs are loyal, cats are judgmental. I'm a selection box, I'm both."] },
  { id: "font", words: ["font", "fonts", "typeface", "comic sans", "helvetica", "papyrus", "typography", "kerning"], replies: () => ["Comic Sans is not a crime, it's just a cry for help. This site uses a tight grotesk and one serif italic, for drama.", "Kerning is my day job. Tracking is my side hustle.", "Favourite font: anything with a good lowercase g."] },
  { id: "music", words: ["music", "song", "sing", "playlist", "gaana", "sound"], replies: () => ["The music on this site is made live in your browser. I hum along in A minor.", "La la la… I sing in hex codes. #FFD84D."] },
  { id: "life", words: ["meaning of life", "life", "universe", "42", "god", "philosophy", "purpose"], replies: () => ["42. Or good alignment. Probably both.", "The meaning of life is to find the right line-height and stick to it."] },
  { id: "love", words: ["single", "date", "girlfriend", "boyfriend", "married", "crush", "love you", "i love you", "marry"], replies: () => ["I'm in a committed relationship with the grid.", "Flattered! But I only have eyes for well-spaced type."] },
  { id: "age", words: ["age", "old are you", "how old", "born", "birthday kab"], replies: () => ["I was born the day Parv drew a selection box and it blinked back. So: young, but well kerned.", "Version 7. That's old in mascot years."] },
  { id: "roast", words: ["roast", "roast me", "insult me", "be mean"], replies: () => ["You're the kind of person who uses Arial and calls it a brand. Kidding. Mostly.", "Your desktop has 400 files named final_final_v3. I can tell.", "You probably centre-align paragraphs. I forgive you."] },
  { id: "compliment", words: ["compliment", "compliment me", "say something nice", "am i cute", "praise"], replies: () => ["Your taste is excellent. You're on this site, aren't you?", "You have the energy of a perfectly balanced layout.", "If you were a colour, you'd pass every contrast check."] },
  { id: "motivate", words: ["motivate", "motivation", "sad", "stressed", "depressed", "inspire", "bad day", "upset"], replies: () => ["Bad days are just rough drafts. You get to revise tomorrow.", "Even the best designs start as an ugly frame. Keep going."] },
  { id: "secret", words: ["secret", "tell me something", "fun fact", "fact", "did you know", "trivia"], replies: () => ["Secret: there's a little game hidden behind \"Off hours\" up top, with his projects in the bricks.", "Fun fact: the favicon is me. I blink in your tab.", "Fun fact: press the colour button up top and the whole site repaints, x-ray mode included."] },
  { id: "superpower", words: ["superpower", "super power", "magic", "powers"], replies: () => ["My superpower: snapping to the grid. Parv's: designing it and building it.", "I can resize myself. Hold shift and I keep my proportions."] },
  { id: "mac", words: ["mac", "windows", "linux", "iphone", "android", "pc"], replies: () => ["Whatever opens Figma fastest.", "I live in a browser, I'm platform agnostic. And slightly smug about it."] },
  { id: "tabs", words: ["tabs or spaces", "tabs", "spaces", "dark or light"], replies: () => ["Spaces. Always spaces. Mostly between letters."] },
  { id: "alive", words: ["alive", "real", "human", "robot", "sentient", "feelings", "conscious"], replies: () => ["I'm a selection box with feelings and no AI. Hand-written, like a love letter.", "Real enough to be poked. Try it."] },
  { id: "weather", words: ["weather", "rain", "hot", "cold", "mausam"], replies: () => ["Can't see outside, I live in a browser. Forecast in here: 100% cobalt.", "Weather unknown, vibes sunny."] },
  { id: "sport", words: ["cricket", "football", "sports", "ipl", "kohli", "messi"], replies: () => ["I don't follow sports, but I do follow the cursor. Very closely."] },
  { id: "parvlike", words: ["what is he like", "what s he like", "is he nice", "personality", "hobbies", "hobby", "free time", "fun"], replies: () => ["Curious, picky about details, and fun to work with. When the files close he makes games and generative experiments (see the Lab).", "He sweats the small stuff so you don't have to. And he made me, so: a good sense of humour."] },
];

const FALLBACK = [
  `Hmm, that one's outside my selection box. I know about Parv's work, hiring him, his tools and this site. Or ask him directly: ${email}.`,
  "I didn't quite catch that. Try something like \"Is he available?\", \"Show me branding\" or \"What tools does he use?\"",
  `No idea, honestly, and I don't make things up. ${email} knows everything I don't.`,
];

const norm = (s: string) => ` ${s.toLowerCase().replace(/[’']/g, " ").replace(/[^a-z0-9À-ɏ\s/+-]/g, " ").replace(/\s+/g, " ").trim()} `;

// Typos: a word of five or more letters may be one edit away ("avialable", "brandng").
function close(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else if (a[i + 1] === b[j] && a[i] === b[j + 1]) {
      i += 2;
      j += 2;
    } else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}
let KNOWN: Set<string> | null = null;
const has = (q: string, w: string) => {
  if (q.includes(` ${w} `) || (w.includes(" ") && q.includes(w))) return true;
  if (w.includes(" ") || w.length < 5) return false;
  // Every keyword on the list, so a real word ("change") is never "corrected" into a different one ("charge").
  KNOWN ??= new Set([...TOPICS, ...FUN].flatMap((t) => t.words).concat(Object.values(KINDS).flatMap((k) => k.words), TOOLS));
  return q.split(" ").some((t) => t.length >= 4 && !KNOWN!.has(t) && close(t, w));
};

let last = "";

const istTime = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());

/** Quick sums ("what is 12*7"), the time, coin flips and dice: answered directly. */
function quick(raw: string, q: string): KernReply | null {
  const sum = raw.toLowerCase().replace(/what('s| is)|calculate|=|\?/g, "").replace(/x|×/g, "*").replace(/÷/g, "/").trim();
  if (/^[\d\s+\-*/().]+$/.test(sum) && /\d\s*[+\-*/]\s*[\d(]/.test(sum)) {
    try {
      const v = Function(`"use strict"; return (${sum})`)() as number;
      if (Number.isFinite(v)) return { text: `${+v.toFixed(6)}. Designers can do maths, we just prefer not to.` };
    } catch {}
  }
  if (has(q, "time") && (has(q, "what") || has(q, "kya") || has(q, "kitne") || has(q, "now"))) return { text: `It's ${istTime()} in India right now. Parv's probably ${Number(istTime().slice(0, 2)) < 9 ? "asleep, or pretending to be" : Number(istTime().slice(0, 2)) < 20 ? "pushing pixels" : "shipping something late at night"}.` };
  if (has(q, "date") && has(q, "today")) return { text: `Today is ${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" }).format(new Date())}. A great day to hire a designer.` };
  if (has(q, "coin") || has(q, "toss")) return { text: Math.random() < 0.5 ? "Heads. The universe says: hire him." : "Tails. The universe says: hire him anyway.", action: "hop" };
  if (has(q, "dice") || has(q, "die") || has(q, "roll")) return { text: `You rolled a ${1 + Math.floor(Math.random() * 6)}. Nice. (I'd have rolled an 8, like his project count.)`, action: "hop" };
  if (has(q, "random number")) return { text: `${Math.floor(Math.random() * 100)}. Don't ask how I chose it.` };
  return null;
}

/** When no topic fits, reuse the visitor's own words so the reply still feels like an answer. */
function echo(raw: string): string | null {
  const t = raw.trim().replace(/[?!.]+$/, "");
  const fav = t.match(/fav(?:ou?rite)?\s+([a-z ]{2,24})/i);
  if (fav) {
    const thing = fav[1].trim().toLowerCase();
    const known: Record<string, string> = {
      colour: "Cobalt blue. Look around, I'm not subtle.",
      color: "Cobalt blue. Look around, I'm not subtle.",
      number: "8. Same as his project count. Coincidence? Yes.",
      animal: "The cursor. It follows me everywhere.",
      shape: "A square with four handles. Biased, I know.",
      movie: "Anything with good title design. Saul Bass, if you're asking.",
      song: "Whatever the site plays in A minor.",
      project: `Today? ${pick(projects.slice(0, 4)).title}. Ask me tomorrow, it changes.`,
      food: "A perfectly square samosa. With chai, obviously.",
      drink: "Chai. Cutting chai, extra kerning.",
      font: "Anything tightly tracked with a good lowercase g.",
      tool: "The selection tool. Look at me.",
      app: "Figma. It's where I was born.",
      emoji: "I don't do emoji. I do facial expressions. Watch my face.",
    };
    return known[thing] ?? `My favourite ${thing}? Whatever Parv designs next, probably. I'm loyal like that.`;
  }
  let m = t.match(/^(?:do|does) you (?:like|love|enjoy|prefer) (.{2,40})$/i);
  if (m) return pick([`${m[1]}? Love it, as long as it's on a grid.`, `${m[1]}... I'd say yes, with 8px of padding.`, `I'm a fan of ${m[1]}. Parv would want me to mention he's available, though.`]);
  m = t.match(/^(?:can|could|will|would) you (.{2,60})$/i);
  if (m) return `I can't ${m[1]} (no hands, just handles), but I can tell you about Parv's work, or walk you to the Hire button.`;
  m = t.match(/^are you (.{2,40})$/i);
  if (m) return pick([`Am I ${m[1]}? I'm a selection box with feelings, so… partly.`, `${m[1][0].toUpperCase() + m[1].slice(1)}? Only on Fridays.`]);
  m = t.match(/^(?:is|does) (?:he|parv) (.{2,50})$/i);
  if (m) return `Does he ${m[1]}? Not something I know for sure, and I don't make things up. Ask him at ${email}, he replies fast.`;
  m = t.match(/^(?:why|how come) (.{2,60})$/i);
  if (m) return pick(["Honest answer: because it looked better that way. Design reasons.", "Why? Same reason the logo got bigger: someone asked nicely."]);
  m = t.match(/^(?:what|who) (?:is|are|was) (.{2,40})$/i);
  if (m) return `${m[1][0].toUpperCase() + m[1].slice(1)}? Out of my selection box, I only know Parv things. For design questions, he's your guy: ${email}.`;
  m = t.match(/^(?:how) (?:do|can|to) (.{2,60})$/i);
  if (m) return `How to ${m[1].replace(/^(i|we|you|one)\s+/i, "")}? Step one: hire someone who's done it. Step two: ${email}.`;
  return null;
}

/** Kern's answer to a free-text question, plus anything it should do on screen. */
export function answer(question: string): KernReply {
  const q = norm(question);
  const fast = quick(question, q);
  if (fast) return fast;

  const ctx: Ctx = {};
  // A project named in the question wins: it is the most specific thing it can be about.
  ctx.project = projects.find((p) => {
    const t = norm(p.title).trim();
    return t.length > 2 && (has(q, t) || has(q, p.slug.replace(/-/g, " ")));
  });
  for (const [k, v] of Object.entries(KINDS)) if (v.words.some((w) => has(q, w))) ctx.kind = k;
  ctx.tool = TOOLS.find((t) => has(q, t));

  // Score every topic by its keywords. Intent words (hire, price, contact...) weigh 2, phrases 3; a few very general
  // words weigh less. Specific things named in the question (a project, a kind of work, a tool) add a head start, so
  // "show me branding" is about branding, but "how much for a logo" is still about price.
  const LIGHT = new Set(["work", "project", "projects", "show me", "portfolio", "fun", "life", "real", "color", "colour", "colors", "colours", "date", "change", "designer", "play", "sound"]);
  const asksTools = /\b(use|uses|using|tool|tools|software|stack|know|knows)\b/.test(q);
  let best: { topic: Topic; score: number } | null = null;
  for (const topic of [...TOPICS, ...FUN]) {
    // Money and the resume are what people most need answered exactly, so their words count double.
    const weight = topic.id === "rates" || topic.id === "resume" ? 2 : 1;
    let score = topic.words.reduce((n, w) => n + (has(q, w) ? (LIGHT.has(w) ? 0.5 : w.includes(" ") ? 3 : 2) * weight : 0), 0);
    if (topic.id === "project" && ctx.project) score += 4;
    if (topic.id === "kind" && ctx.kind) score += asksTools && ctx.tool ? 1 : 3;
    if (topic.id === "tool" && ctx.tool) score += asksTools ? 4 : ctx.tool === "claude" || ctx.tool === "antigravity" ? 0.5 : 1.5;
    if (topic.id === "tools" && asksTools && !ctx.tool) score += 2;
    if (score > 0 && (!best || score > best.score)) best = { topic, score };
  }

  // "Favourite X" is small talk, not "best project", unless a project is actually named.
  const favourite = /fav(ou?rite)?\b/.test(q) && !ctx.project && !/\b(project|work)\b/.test(q);
  // A weak keyword hit loses to a reply built from the question's own shape ("can you…", "do you like…").
  if (!best || best.score < 2 || favourite) {
    const e = echo(question);
    if (e) {
      last = e;
      return { text: e };
    }
  }

  const options = best ? best.topic.replies(ctx) : FALLBACK;
  const text = pick(options.length ? options : FALLBACK, last);
  last = text;
  return { text, action: best?.topic.action };
}
