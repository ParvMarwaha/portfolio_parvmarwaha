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
  resume: { href: "/parv-marwaha-resume.pdf", file: "Parv-Marwaha-Resume.pdf" },
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/_parv.19/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/parv-marwaha-aa0361232/" },
  ],
  // DRAFT: cover, intro and hire copy. The intro is split so the middle part can be set in the serif.
  availability: "Available for freelance & full-time",
  coverLine: "designing stuff that actually ships.",
  intro: ["I'm Parv, a ", "designer", " from India. I design interfaces, shape identities and build experiences that leave an impression."],
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
      "Most of my work is product design and brand identity, with motion alongside. Lately I also build what I design: Varnmala and Noto are apps I designed and then built with Claude.",
      "I'm open to freelance projects and full-time roles.",
    ],
    disciplines: {
      "UI/UX": "Apps and websites, from research and user flows to wireframes, a polished interface and a clickable prototype. When it helps, I build it too.",
      Branding: "Identities that hold together: the idea behind the brand, the logo, colour and type, and a brand book so anyone can use it right.",
      Motion: "Short motion pieces in After Effects: product films, app walkthroughs, and transitions that make an interface feel alive.",
      Illustration: "Shape-based vector illustration.",
    },
  },
  hireComment: "Need a designer who also ships the code? Let's talk.",
} as const;
