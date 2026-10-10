// Real projects, taken from Parv's Behance profile (titles, dates, tools, fields and images).
// Images are linked from Behance's CDN, not copied into this repo. To host one yourself, put the file in
// public/images/ and point `image` / `gallery` at "/images/your-file.jpg".
// `summary` is Behance's own text where the project has one; otherwise it is a plain, factual DRAFT
// built from the project's fields and tools. Edit freely.
export type ProjectType = "UI/UX" | "Branding" | "Motion" | "Illustration" | "Others";
/** The four things I do; "Others" only exists as a filter for work that fits none of them. */
export type Discipline = Exclude<ProjectType, "Others">;

export interface Person {
  name: string;
}

export interface Project {
  slug: string;
  /** "sparq" in "sparq // brand identity" */
  title: string;
  /** "brand identity" in "sparq // brand identity" */
  kind?: string;
  type: ProjectType;
  year: number;
  published: string;
  summary: string;
  /** A colour taken from the cover, used for small accents (number, hover pill). */
  accent: string;
  tools: string[];
  fields: string[];
  /** Cover, shown on the canvas and as the hero of the case study. */
  image: string;
  /** The rest of the images, in order. */
  gallery: string[];
  vimeo?: string;
  prototype?: string;
  /** Not shown on the site for now; kept so the credit is not lost. */
  team?: Person[];
  /** This project's own page on Behance. */
  behance: string;
}

// Behance serves each image at several sizes. 1400_webp is crisp enough and small; GIFs keep their own path.
const CDN = "https://mir-s3-cdn-cf.behance.net/project_modules";
const img = (file: string, size?: string) => `${CDN}/${size ?? (file.endsWith(".gif") ? "1400" : "1400_webp")}/${file}`;
const imgs = (files: string[]) => files.map((f) => (f.includes("|") ? img(f.split("|")[0], f.split("|")[1]) : img(f)));

// Order matters: it is the order on the canvas (slots: wide, square, wide, tall, wide, square, wide, wide).
export const projects: Project[] = [
  {
    slug: "sangeet-sathi",
    behance: "https://www.behance.net/gallery/220123713/Sangeet-Sathi",
    accent: "#E5531C",
    title: "Sangeet Sathi",
    type: "Branding",
    year: 2025,
    published: "February 2025",
    summary: "A product design case study about mental health in older people.",
    tools: ["Illustrator", "Photoshop", "Figma"],
    fields: ["Graphic Design", "Product Design", "Case Study"],
    image: img("c34b29220123713.67bdbb53c7d86.png"),
    gallery: imgs([
      "62795c220123713.67bdbb53c87a3.png", "fd2dfe220123713.67bdbb53caeca.png", "c89f51220123713.67bdbb53ca46d.png",
      "d082d6220123713.67bdbb53c829f.png", "f67e3f220123713.67bdbb53cc413.png", "34dc48220123713.67bdbb53c6a7d.png",
      "8f84ea220123713.67bdbb53c8cd7.png", "705d1a220123713.67bdbb53cbece.png", "936860220123713.67bdbb53ccab9.png",
      "2d9cb4220123713.67bdbb53c9dae.png", "54b63e220123713.67bdbb53ccfe4.png", "4afc13220123713.67bdbb53cb7dc.png",
      "ad5433220123713.6918463571dff.png", "3b1515220123713.6918463571897.png", "7e19f8220123713.6918463572ee5.png",
      "639d38220123713.69184635748ab.png", "928766220123713.6918463574d5a.png", "33a613220123713.69184635733d7.png",
      "ae84c3220123713.6918463572985.png", "cec8d1220123713.69184635740e5.png", "636f59220123713.6918463573932.png",
      "ddf9a8220123713.691846357241b.png",
    ]),
    team: [
      { name: "Riya Srivastava" },
      { name: "Devanshi Bhardwaj" },
    ],
  },
  {
    slug: "sparq",
    behance: "https://www.behance.net/gallery/231161263/sparq-brand-identity",
    accent: "#2D3BFF",
    title: "sparq",
    kind: "brand identity",
    type: "Branding",
    year: 2025,
    published: "July 2025",
    summary: "Logo, visual identity and motion for sparq.",
    tools: ["Illustrator", "Photoshop", "After Effects"],
    fields: ["Motion Graphics", "Logo Design", "Branding"],
    image: img("14d24c231161263.6883bb0c4b2e2.png"),
    gallery: imgs([
      "166e8b231161263.6883bb0c4949a.png", "66f141231161263.6883bb0c4a487.png", "9054c6231161263.6883bb0c4d5fa.gif|source",
      "f77972231161263.6883bb0c49c9c.png", "a41b41231161263.6883bb0c4cef4.png", "e125b9231161263.6883bb0c4accf.gif|1400",
      "f5a00d231161263.6883bb0c4c4de.png", "be7207231161263.6883bb0c4bd16.png", "f7bdf3231161263.6883bb0c4dd95.png",
    ]),
  },
  {
    slug: "a-research-case-study",
    behance: "https://www.behance.net/gallery/240646351/A-Research-Case-Study",
    accent: "#1A3BFF",
    title: "A Research Case Study",
    type: "Others",
    year: 2025,
    published: "December 2025",
    summary: "This research project explores usability and accessibility challenges in commonly used government application forms in India.",
    tools: ["Figma"],
    fields: ["Interaction Design", "Research", "Accessibility"],
    image: img("fb0205240646351.6942d80b5df60.png"),
    gallery: imgs([
      "3ef2e8240646351.6942d80b5f372.png", "dd68e8240646351.6942dd45ed62c.png", "62da6b240646351.6942d80b624df.png",
      "01fd14240646351.6942d80b606e8.png", "313c32240646351.6942dffd14c67.png", "1e272b240646351.6942d80b5e7a8.png",
      "f0fd28240646351.6942d80b66f84.png", "e1732b240646351.6942d80b66185.png", "fbe838240646351.6942d80b66779.png",
      "fe80b1240646351.6942d80b60f0f.png", "baf7da240646351.6942d80b64404.png", "83e5d9240646351.6942d80b67d82.png",
      "75e59a240646351.6942d80b65698.png", "5098b4240646351.6942d80b6770c.png", "a585c6240646351.6942d80b6195c.png",
      "e6fd02240646351.6942d80b5fc1f.png", "f25501240646351.6942d80b62f1f.png", "fab98c240646351.6942d80b64c6b.png",
    ]),
  },
  {
    slug: "varnmala",
    behance: "https://www.behance.net/gallery/226426649/Varnmala-UIUX",
    accent: "#F25C2A",
    title: "Varnmala",
    kind: "UI/UX",
    type: "UI/UX",
    year: 2025,
    published: "May 2025",
    summary: "A mobile app UI/UX project, with a clickable Figma prototype.",
    tools: ["Figma", "After Effects"],
    fields: ["Interaction Design", "Graphic Design", "Mobile App"],
    image: img("9e99db226426649.682e1bce63998.png"),
    gallery: imgs([
      "94a752226426649.682e1bce5f56d.png", "13d2fc226426649.682e1bce6343a.png", "7e0303226426649.682e1bce60ebc.png",
      "82fbec226426649.682e1bce5fcd4.png", "cef1a9226426649.682e1bce62198.png", "8fdee0226426649.682e1bce627b3.png",
      "b18347226426649.682e1bce61a8e.png", "47cf3c226426649.682e1bce5f058.png", "15b24f226426649.682e1bce60484.png",
      "d8f5dd226426649.682e1bce615bd.png", "0067b8226426649.682e1bce60a24.png", "f4d64d226426649.682e1bce62e77.png",
    ]),
    vimeo: "1106510982",
    prototype:
      "https://embed.figma.com/proto/QY7HiRt68QSTP6nMMcKek3/design-project---language?page-id=163%3A26&node-id=892-540&viewport=-633%2C-2344%2C0.41&scaling=scale-down&content-scaling=fixed&starting-point-node-id=892%3A540&show-proto-sidebar=1&embed-host=share",
  },
  {
    slug: "alone",
    behance: "https://www.behance.net/gallery/229242855/Alone-Motion-Design",
    accent: "#0E0F1A",
    title: "Alone",
    kind: "motion design",
    type: "Motion",
    year: 2025,
    published: "June 2025",
    summary: "A motion graphics piece made in After Effects.",
    tools: ["After Effects"],
    fields: ["Motion Graphics", "Animation"],
    image: img("14198f229242855.686192279ab76.png"),
    gallery: [],
    vimeo: "1097344020",
  },
  {
    slug: "shapes",
    behance: "https://www.behance.net/gallery/176461291/shapes-illustrations",
    accent: "#A3162B",
    title: "shapes",
    kind: "illustrations",
    type: "Illustration",
    year: 2023,
    published: "July 2023",
    summary: "Digital illustration, made in Illustrator.",
    tools: ["Illustrator"],
    fields: ["Graphic Design", "Illustration"],
    image: img("4eeb3b176461291.64c5335aa72ec.png"),
    gallery: imgs(["a32eef176461291.64c5335aa833c.png"]),
  },
  {
    slug: "apple-motion-design",
    behance: "https://www.behance.net/gallery/206845855/-Apple-motion-design",
    accent: "#1FA85F",
    title: "Apple",
    kind: "motion design",
    type: "Motion",
    year: 2024,
    published: "August 2024",
    summary: "Motion graphics for an Apple advertisement, made in After Effects and Illustrator.",
    tools: ["After Effects", "Illustrator"],
    fields: ["Motion Graphics", "Animation", "Advertising"],
    image: img("237136206845855.66d349c749988.png"),
    gallery: imgs(["94f98a206845855.66d349c749536.png"]),
    vimeo: "1004877513",
  },
  {
    slug: "sout",
    behance: "https://www.behance.net/gallery/206781221/sout-brand-identity",
    accent: "#6C5BB0",
    title: "sout",
    kind: "brand identity",
    type: "Branding",
    year: 2024,
    published: "August 2024",
    summary: "Brand identity and guidelines for sout, “say it out”.",
    tools: ["After Effects", "Illustrator", "Photoshop"],
    fields: ["Graphic Design", "Logo Design", "Branding"],
    image: img("5922ab206781221.66d208238c11b.png"),
    gallery: imgs([
      "f9807b206781221.66d208238d96e.png", "39fa11206781221.66d20823910d5.png", "bd257a206781221.66d2082390764.png",
      "0f6db9206781221.66d2082390bf9.png", "7413bd206781221.66d208238dec0.png", "d9333c206781221.66d2082391622.png",
      "1a4369206781221.66d208239024a.png", "04d58f206781221.66d208239231f.png", "ddc605206781221.66d2082391aa8.png",
      "b84519206781221.66d208238d1cc.png", "123f82206781221.66d208238fa7a.png", "df0d58206781221.66d20bc36d432.gif|max_1200",
      "8f4747206781221.66d209992ea41.png", "de08f4206781221.66d20bc36ccb4.gif|1400", "d20c70206781221.66d208238ec39.png",
      "65b749206781221.66d208238c9b4.png", "abb053206781221.66d208238e6d4.png",
    ]),
  },
];

/**
 * Where a click on a project goes. For now every project opens its own Behance page, in a new tab. Once the real
 * project pictures are in, set this to "pages" and the site's own case studies (/work/[slug]) open again.
 */
export const PROJECT_LINKS: "behance" | "pages" = "behance";
export const projectsOpenOnBehance = () => PROJECT_LINKS === "behance";
export const projectHref = (p: Project) => (PROJECT_LINKS === "behance" ? p.behance : `/work/${p.slug}`);

export const TYPES: ProjectType[] = ["UI/UX", "Branding", "Motion", "Illustration", "Others"];
export const DISCIPLINES: Discipline[] = ["UI/UX", "Branding", "Motion", "Illustration"];

export const pad2 = (n: number) => String(n).padStart(2, "0");
export const numberOf = (p: Project) => pad2(projects.indexOf(p) + 1);
export const displayTitle = (p: Project) => (p.kind ? `${p.title} // ${p.kind}` : p.title);
export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
export const nextOf = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};
