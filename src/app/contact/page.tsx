import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  const rows: [string, string, string, boolean][] = [
    ["Phone", site.phone, site.phoneHref, false],
    ...site.socials.map((s): [string, string, string, boolean] => [s.label, "Open profile", s.href, true]),
  ];

  return (
    <>
      <main className="px-4 pb-16 pt-28 md:px-6 md:pb-24 md:pt-36">
        <div className="mx-auto max-w-[85rem]">
        <p className="label mb-5 text-mute">Contact</p>
        <h1 className="text-6xl font-medium leading-[0.9] tracking-tighter md:text-[9rem]">
          Con<em className="font-display italic text-cobalt">tact</em>
        </h1>

        <div className="mt-14 grid gap-12 md:mt-24 md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-7">
            <p className="label mb-4 text-mute">Email</p>
            <a href={`mailto:${site.email}`} className="group block w-fit max-w-full break-all text-3xl font-medium tracking-tighter md:text-[3.6rem] md:leading-[1.05]" data-cursor="hover">
              <span className="bg-[linear-gradient(var(--vermilion),var(--vermilion))] bg-[length:0%_100%] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_100%] group-hover:text-white">
                {site.email}
              </span>
            </a>
            <p className="mt-6 flex items-center gap-3 text-[1rem]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inset-0 rounded-full bg-vermilion" style={{ animation: "pin-pulse 2s ease-out infinite" }} />
                <span className="relative h-2.5 w-2.5 rounded-full bg-vermilion" />
              </span>
              {site.availability}
            </p>
          </div>

          <ul className="md:col-span-5">
            {rows.map(([label, value, href, external]) => (
              <li key={label} className="border-t border-ink/15 last:border-b">
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-baseline justify-between gap-4 py-5 transition-colors hover:text-cobalt"
                  data-cursor="hover"
                >
                  <span className="label text-mute">{label}</span>
                  <span className="flex items-center gap-3 text-xl font-medium tracking-tight">
                    {value}
                    <span aria-hidden className="text-vermilion transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </main>
      <SiteFooter cta={false} />
    </>
  );
}
