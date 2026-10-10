# Parv Marwaha — portfolio

Next.js 16 · React 19 · Tailwind 4 · GSAP · Framer Motion · Lenis

```bash
npm run dev      # http://localhost:3000
npm run build    # production build (also type-checks)
npm start        # serve the production build
```

Do not run `npm run build` while `npm run dev` is running: they share the `.next` folder and it can get corrupted (the dev server then eats CPU and memory). If that ever happens, stop the server and run `rm -rf .next`.

## The idea

**Home is built for a recruiter who has thirty seconds.** One cobalt cover (name, one line, availability, "Hire me"), one sentence on who I am, what I do (each with the projects behind it), my tools and how to reach me, then **all the work in a plain, aligned grid**: big uncropped covers, what each one is, year, tools, one click to the project page. Nothing to discover or play with before you can see the work.

**The Lab** (`/lab`, it used to be called Canvas) is where the experiments live, not the projects: a design file you can pan, zoom, shuffle and throw frames around in. Right now it holds eight live experiments, all drawn in code in the site's colours and reacting to your cursor: Weight (the font's weight follows you), Synapse (neurons firing in cascades), Palette (the colour generator), Attractor (a Clifford strange attractor, morphing), Turing (reaction-diffusion, coral and labyrinth patterns), Brainwave (an invented EEG), Field (particles on a noise field) and Orbit (a 3D neural globe), plus the Off hours game. They only run while on screen. It is in the nav and the footer; the old /canvas address redirects to it.

- Cover headline: set in a variable font; letters thicken near your cursor, and poking it runs a wave of weight through them.
- Layered hero: the cover is sticky, and as you scroll the rest of the page slides over it like a sheet while the cover shrinks and dims a little.
- Ticker: a slim running line of what I do; it speeds up with your scroll and turns around when you scroll back up.
- Intro: one sentence (DRAFT, in `site.intro`), then a four-column strip: What I do, Tools, Based in, Say hi (no project names repeated, the grid is right below). Click a discipline under "What I do" and the grid filters to it and scrolls into view (a `pm:filter` window event).
- Project grid: filter by type, two aligned columns of 16:9 covers (the covers' own ratio, so nothing is cropped). Each cover wipes in as it arrives, leans a little toward the cursor, and the cards you are not pointing at dim. Every project has its own accent colour (`accent` in `projects.ts`). Click a card and its picture opens out into the project page. I tried an uneven staggered grid first; it left dead gaps and cut the covers, so it is gone.
- Footer: a full-width cobalt band that rises under the page (rounded top corners, like the cover sheet): "Let's work together" with email, availability and Hire me, then my name huge in the same weight-reacting type, then the links. Its content sits on the same 1360px column as the pages. `<SiteFooter cta={false} />` drops the hiring row (used on /contact). Labels are set in the site's own grotesk; there is no mono font.
- Project pages: parallax cover, reading-progress bar, a gallery wall that opens into a full-screen viewer (arrow keys or swipe, Esc to close), `←` / `→` for the previous or next project.
- Colour button: the round colour button in the top bar has no menu. Press it and the whole site is repainted in a new, randomly generated palette (muted greens with clay, terracotta with teal, dusk blue with peach, and so on, always with readable contrast). About one press in four gives an **x-ray** palette instead: a dark, glowing scheme. The new colours spread out from the button (View Transitions on desktop; on touch screens a flat sheet in the new colour floods out instead, because a page snapshot is heavy on phones; browsers without either just switch). Nothing is saved: the palette lasts while you browse, and every fresh visit or reload opens in Cobalt. The toast has a Reset back to Cobalt. The game, confetti and browser bar follow it. The default is **Cobalt on white** (a blue cover card on a plain white page, so the projects stand out); the earlier cream version is "Cobalt Cream" and turns up in the random mix now and then. **Project pictures and each project's own accent colour never change**, whatever the theme.
- Navigation: the top bar is set up like a design file. The link you point at gets a selection box with corner handles and a size tag, sliding between links; labels roll on hover. On phones it is the full-screen menu.
- Page changes: going to another page runs a short curtain (coloured panels rise, the name of the place is spelled out with a counter, the page changes behind it, the panels lift). Project cards and canvas frames run their own transition and are skipped (`data-no-curtain`).
- Visiting card: the home cover is dealt onto the page after the intro, the name runs a wave of weight, it leans toward the cursor, and "Flip card" turns it over to the back with my contact details and a Save contact (.vcf) button.
- One grid: every page uses the same 1360px column with 16/24px padding, so content lines up with the footer card.
- Opening sequence (once per session): the name starts as a hairline and gets heavier letter by letter as the 000 to 100 counter climbs (the cover's variable font), a design-tool selection box is drawn round it with a live size tag, then seven panels lift away from the middle and the cover is dealt in.
- Everywhere: type **hire** for confetti, type **play** to jump to the game.

### The Lab (/lab)
Drag or scroll to move, pinch or Ctrl+scroll to zoom. Frames tilt toward you, can be picked up and thrown, and open when clicked. **Shuffle / Tidy up** (`S` / `T`) lifts every frame and lands it with a bounce. `D` is dev mode (padding, dashed outlines, sizes), `F` overview, `0` back to the cover.

**On a phone or tablet** (a touch screen, or anything under 768px wide) the free canvas is replaced by one scrolling column (`MobileLab.tsx`, picked by `LabEntry.tsx`): the cover, a row of chips to jump to an experiment, then each experiment in a full-width card with a one-line note written for a finger, and the game at the end. Only the cards on screen are running.

No scroll-hijacking and no horizontal page scroll.

### Music

A small button in the top bar (four bars that dance while it plays; in the Menu on phones) turns the site's music on and off. It is on by default, at a low level: it starts as soon as the browser allows it, which for most visitors means on their first tap or key press (browsers do not allow sound before that). Switching it off is remembered. The music is not a file: `src/utils/ambient.ts` makes it live with Web Audio, a slow pad over four chords in A minor with a few soft plucks through an echo, so nothing is downloaded and there is nothing to license. The same switch gives every button and link a soft blip when the mouse moves onto it (a note from the current key, so moving around plays a little tune) and a tap when pressed. Pressing the colour button moves it to a new key, and it goes quiet when the tab is hidden. `SoundToggle.tsx` has the buttons.

### Phones

Touch screens (`(pointer: coarse)`, see `src/utils/device.ts`) get a lighter site: the card flip is a cross-fade instead of a 3D rotation, the cover letters hold still (a tap sends a wave through them) instead of breathing every frame, the Lab canvases draw at half the frames and fewer pixels, there is no backdrop blur on the floating pills, the cover dims with an overlay instead of a filter, and the tab-icon animation and confetti canvas are not started at all.

## Off hours

`/play` is **Break the Grid**, a breakout game that fills the whole screen (below the top bar): the board takes the shape of your screen, wide on a monitor and tall on a phone, with a "Full screen" button (or press F) for the browser's own full screen. Three levels, powerups, mouse / touch / arrow keys, the last level is built from the letters of HIRE ME. Sound is off by default. The logic lives in `src/components/game/engine.ts` (no React), so it can be tested headless.

## Sizing

The site is built to look the same on any screen, only bigger or smaller. Sizes are in `rem`, and one rule in `globals.css` sets the root size. The reference is a 1440 x 900 screen at 16px. From 1024px wide up, the root size follows the smaller of the screen's width and height, between 14px and 34px: a 14-inch MacBook's browser window (about 1512 x 850) runs at about 15px, a 1920 x 1080 screen at 19.2px, a 2560 x 1440 one at 25.6px. On every one of them the cover card takes about 83% of the window's height. Below 1024px it stays 16px (tablets and phones) and the full navigation gives way to a Menu button. So write new sizes in `rem` (or Tailwind's own scale), not `px`; keep `px` only for hairlines (borders, rings) and shadows. Page content is at least 1360px wide when the screen allows (`max-w-[max(85rem,1360px)]`). The hero's name is also capped by the screen's height, so the cover never outgrows a short screen.

## Content

The eight projects were taken from my Behance profile (titles, dates, tools, fields, images, videos, the Varnmala prototype). **For now, clicking a project (on the home grid or the Index) opens its own page on Behance, in a new tab**, because the real project pictures are not in yet. To switch to the site's own case studies (`/work/[slug]`, already built, just not linked), set `PROJECT_LINKS` to `"pages"` in `src/content/projects.ts`. Nothing else on the site links to Behance, and the case-study page no longer shows a team credit (the names are still in the data as `team`). They live in one file:

| File | What it controls |
| --- | --- |
| `src/content/projects.ts` | The projects: title, type, year, tools, fields, cover, gallery, video, prototype, team (names only) |
| `src/content/site.ts` | Name, role, contact details, socials, cover line, availability, the hire comment |
| `src/content/lab.ts` | The Lab's experiments (title, kind, note, optional image and link) |
| `src/content/themes.ts` | The default colours (Cobalt) and the random palette generator behind the colour button (families, names, the contrast rules) |

Images are **linked from Behance's CDN**, not copied into this repo, so the pictures still load from Behance's servers and the site depends on them staying up. To host one yourself, put the file in `public/images/` and point `image` / `gallery` at `"/images/your-file.jpg"`. Videos are Vimeo embeds that load when you press play, with a "Watch it on Vimeo" fallback.

Only "A Research Case Study" has a written description on Behance. The other `summary` lines are short factual drafts built from the project's fields and tools, so rewrite them in your own words.

The Lab's frames come from `src/content/lab.ts`. To add an experiment, add an entry there: give it an `image` for a picture frame (a path under `public/` or a URL), an `href` if clicking it should open a page, or register a live demo for its `id` in `src/components/canvas/experiments.tsx`. Frames fill eight hand-placed slots in order, then rows underneath (`src/components/canvas/world.ts`).

About has draft text (in `site.about`, rewrite in your own voice). The portrait is a real photo, `public/images/parv-marwaha.webp`; the three pictures lower down are placeholders (`src/components/ui/Placeholder.tsx`) until the rest arrive.

## Where things are

- `src/components/home/` — the home page: `HeroCard.tsx`, `HeroSticky.tsx` (the layered scroll effect), `Marquee.tsx` (the ticker), `Intro.tsx` (sentence + what I do), `WorkGrid.tsx` (grid + filters + wipe reveal + spotlight), `usePageEnter.tsx` (the click-through animation)
- `src/components/hero/LetterHeadline.tsx` — the weight-animated name, shared by the home cover and the Lab cover
- `src/components/canvas/` — the Lab's canvas (/lab): `Canvas.tsx` (camera, input, shuffle/tidy, intro, ghost cursor), `world.ts` (where everything sits), `Cover.tsx`, `Frame.tsx` (tilt, drag, throw), `experiments.tsx` (the live demos), `PlayFrame.tsx`, `Sticky.tsx`, `CommentPin.tsx`, `Selection.tsx`
- `src/components/game/` — the game
- `src/components/TopBar.tsx`, `ThemeSwitcher.tsx` (the colour button), `NavLinks.tsx` (the selection-box nav), `PageTransition.tsx` (the curtain between pages), `Preloader.tsx`, `CustomCursor.tsx`, `SmoothScroll.tsx`, `Confetti.tsx` (easter eggs) — site-wide chrome
- `src/components/Gallery.tsx`, `ProjectChrome.tsx`, `VideoEmbed.tsx` — project page pieces
- `src/app/` — `/` home, `/lab`, `/work` list view, `/work/[slug]` case study, `/about`, `/contact`, `/play`
- Colours and fonts: `src/app/globals.css` (tokens) and `src/app/layout.tsx` (fonts)
