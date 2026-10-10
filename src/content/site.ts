// Everything the visitor reads that isn't a project lives here or in projects.ts.
// Strings marked DRAFT are placeholders to be replaced when the real content is ready.
export const site = {
  name: "Parv Marwaha",
  role: "Designer",
  title: "Parv Marwaha — Designer",
  description: "Parv Marwaha is a designer working across UI/UX, brand identity and motion. Available for freelance and full-time work.",
  email: "parvmarwaha1@gmail.com",
  phone: "+91 9625432705",
  phoneHref: "tel:9625432705",
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/_parv.19/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/parv-marwaha-aa0361232/" },
  ],
  // DRAFT: cover, intro and hire copy. The intro is split so the middle part can be set in the serif.
  availability: "Available for freelance & full-time",
  coverLine: "designing stuff that actually ships.",
  intro: ["I'm Parv, a ", "designer", " from India. I design interfaces, brands and motion, and I can build and ship them too."],
  // The tools I work in (shown on Home and About), and a note on how AI fits in. DRAFT wording, rewrite freely.
  tools: ["Figma", "After Effects", "Claude", "Antigravity", "Illustrator"],
  aiNote: {
    short: "AI is part of how I work: I use it to make products more engaging, user-friendly and interactive.",
    long: "I actively try to bring AI into my practice. Claude and Antigravity sit next to Figma, After Effects and Illustrator, and I use them to get to outputs that make the end product more engaging, more user-friendly and more interactive for the person using it.",
  },
  // DRAFT: the About page. Written from what the projects show; rewrite in your own voice.
  about: {
    lead: "I'm Parv Marwaha, a designer from India. I like making things that look considered, and I can build and ship them too.",
    paragraphs: [
      "Most of my work so far is design: product case studies, a mobile app prototype, brand identities, motion graphics and illustration. All of it is on the home page.",
      "I work in Figma, After Effects and Illustrator, with Claude and Antigravity alongside them. I can build and ship what I design when a project needs it. I'm open to freelance projects and full-time roles.",
    ],
    disciplines: {
      "UI/UX": "Product and app design, from research to a clickable prototype.",
      Branding: "Logos, visual identity and brand guidelines.",
      Motion: "Short motion pieces, made in After Effects.",
      Illustration: "Shape-based vector illustration.",
    },
  },
  hireComment: "Need a designer who also ships the code? Let's talk.",
} as const;
