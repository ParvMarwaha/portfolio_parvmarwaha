"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { site } from "@/content/site";
import { displayTitle, projectHref, projects, linkTarget } from "@/content/projects";
import Magnetic from "@/components/ui/Magnetic";
import RemoteImage from "@/components/ui/RemoteImage";
import { toWork } from "@/components/home/hero/shared";
import { LAND_H, PORT_H, RIBBONS, SHAPES, type DecoId, type StickerSpec } from "./v3-data";

/** One die-cut sticker: the white rim (also the hit area), the printed art inside it and, over both, the corner that peels. */
function Body({
  spec,
  flow,
  artClass = "",
  artStyle,
  children,
}: {
  spec: StickerSpec;
  /** Sized by its content (text stickers) rather than by an aspect ratio (pictures and badges). */
  flow?: boolean;
  artClass?: string;
  artStyle?: CSSProperties;
  children: ReactNode;
}) {
  const shape = SHAPES[spec.shape];
  return (
    <>
      <div className="lid3-cut">
        <div className={flow ? "lid3-white lid3-flow" : "lid3-white"} style={{ ...shape.white, aspectRatio: flow ? undefined : spec.ar }}>
          <div className={`lid3-art ${artClass}`} style={{ ...shape.art, ...artStyle }}>
            {children}
          </div>
        </div>
      </div>
      {/* The folded-back corner: the sticker's pale underside, a triangle that grows as it is pulled. Positioned and sized by the engine. */}
      <div className="lid3-flapwrap" aria-hidden style={shape.white}>
        <div className="lid3-flapbox">
          <div className="lid3-flapi" />
        </div>
      </div>
    </>
  );
}

const Arrow = ({ turn = 0 }: { turn?: number }) => (
  <svg
    viewBox="0 0 16 16"
    className="h-[0.85em] w-[0.85em] shrink-0"
    aria-hidden
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: `rotate(${turn}deg)` }}
  >
    <path d="M4 12L12 4M5.5 4H12v6.5" />
  </svg>
);

// ---- the stickers that matter -------------------------------------------------------------------------------

function NameFace({ spec }: { spec: StickerSpec }) {
  return (
    <div className="lid3-face" tabIndex={0} role="group" aria-label="Name sticker" data-cursor="hover" data-cursor-label="Peel">
      <Body
        spec={spec}
        flow
        artClass="on-primary bg-cobalt text-paper"
        artStyle={{
          padding: "0.55em 0.6em 0.5em",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.14) 0.05em, transparent 0.07em)",
          backgroundSize: "0.62em 0.62em",
        }}
      >
        <span className="block text-[0.5em] font-medium uppercase leading-none tracking-[0.16em] opacity-80">hello, I&apos;m</span>
        <p aria-label={site.name} className="mt-[0.16em] text-[1.56em] font-semibold uppercase leading-[0.86] tracking-[-0.045em]">
          <span className="block">Parv</span> <span className="block">Marwaha</span>
        </p>
        <div className="mt-[0.32em] flex items-end justify-between gap-[0.4em]">
          <span className="font-display text-[1.4em] italic leading-[0.85] tracking-normal text-butter">designer</span>
          <span className="pb-[0.12em] text-right text-[0.4em] font-medium uppercase leading-[1.3] tracking-[0.08em] opacity-85">
            UI/UX · Brand
            <br />
            Motion · Code
          </span>
        </div>
      </Body>
    </div>
  );
}

function HireFace({ spec }: { spec: StickerSpec }) {
  return (
    <Magnetic className="lid3-mag" strength={0.16} radius={60}>
      <Link href="/contact" className="lid3-face" draggable={false} data-cursor-label="Let's talk">
        <Body spec={spec} flow artClass="flex items-center justify-center gap-[0.35em] whitespace-nowrap bg-vermilion text-white" artStyle={{ padding: "0.62em 0.9em" }}>
          <span className="text-[1.3em] font-semibold leading-none tracking-tight">Hire me</span>
          <span className="text-[1.15em]">
            <Arrow />
          </span>
        </Body>
      </Link>
    </Magnetic>
  );
}

function WorkFace({ spec }: { spec: StickerSpec }) {
  return (
    <button type="button" className="lid3-face" onClick={toWork} data-cursor-label="Scroll">
      <Body
        spec={spec}
        flow
        artClass="flex items-center justify-center gap-[0.4em] whitespace-nowrap bg-paper text-ink ring-1 ring-inset ring-ink/20"
        artStyle={{ padding: "0.6em 0.9em" }}
      >
        <span className="text-[1.05em] font-semibold leading-none tracking-tight">See the work</span>
        <Arrow turn={135} />
      </Body>
    </button>
  );
}

function AvailFace({ spec }: { spec: StickerSpec }) {
  const [first, ...rest] = site.availability.split(" ");
  return (
    <div className="lid3-face" tabIndex={0} role="group" aria-label="Availability sticker" data-cursor="hover" data-cursor-label="Peel">
      <Body spec={spec} flow artClass="flex items-center gap-[0.7em] whitespace-nowrap bg-deep text-on-deep" artStyle={{ padding: "0.55em 1em" }}>
        <span className="relative flex h-[0.85em] w-[0.85em] shrink-0">
          <span className="lid3-pulse absolute inset-0 rounded-full bg-spark" style={{ animation: "pin-pulse 2s ease-out infinite" }} />
          <span className="relative h-full w-full rounded-full bg-spark" />
        </span>
        <span className="flex flex-col leading-[1.15]">
          <span className="text-[1.2em] font-semibold tracking-tight">{first}</span>{" "}
          <span className="text-[0.8em] opacity-85">{rest.join(" ")}</span>
        </span>
      </Body>
    </div>
  );
}

// ---- the projects ---------------------------------------------------------------------------------------------

function ProjectFace({ spec }: { spec: StickerSpec }) {
  const p = projects[spec.project ?? 0];
  return (
    <a
      href={projectHref(p)}
      {...linkTarget(p)}
      className="lid3-face"
      draggable={false}
      aria-label={`${displayTitle(p)}, ${p.type}, ${p.year}`}
      data-cursor-label="Open"
    >
      <Body spec={spec} artStyle={{ background: p.accent }}>
        <RemoteImage
          src={p.image}
          className="lid3-img"
          ref={(img) => {
            if (img && img.complete && img.naturalWidth) img.style.opacity = "1";
          }}
          onLoad={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        />
        <span className="lid3-ribbon" style={{ bottom: `${SHAPES[spec.shape].rb}%`, fontSize: `${spec.rf ?? 0.9}em` }}>
          <i className="lid3-dot" style={{ background: p.accent }} />
          <span>{RIBBONS[p.slug] ?? p.title}</span>
        </span>
      </Body>
    </a>
  );
}

// ---- decoration -----------------------------------------------------------------------------------------------

function FridayArt() {
  return (
    <svg viewBox="0 0 100 100" className="block h-full w-full" aria-hidden>
      <defs>
        <path id="lid3-arc" d="M50 50 m-37 0 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" />
      </defs>
      <text fontSize="9.6" fontWeight="700" fill="#fff">
        <textPath href="#lid3-arc" textLength="224" lengthAdjust="spacing">
          SHIPS ON FRIDAYS · SHIPS ON FRIDAYS ·
        </textPath>
      </text>
      <circle cx="50" cy="50" r="20" fill="#fff" />
      <path d="M40.5 51 L48 58.5 L60.5 43" fill="none" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-vermilion" />
    </svg>
  );
}

function KerningArt() {
  return (
    <div className="text-center">
      <svg viewBox="0 0 100 58" className="block w-full" aria-hidden>
        <path d="M6 45 H94 M6 6 H94" strokeWidth="0.8" strokeDasharray="2.5 2" className="stroke-vermilion" fill="none" />
        <text x="50" y="45" textAnchor="middle" fontSize="54" fontWeight="700" letterSpacing="-6" className="fill-ink">
          AV
        </text>
        <path d="M45 50 V56 M55 50 V56 M45 53 H55" strokeWidth="1.1" strokeLinecap="round" className="stroke-vermilion" fill="none" />
      </svg>
      <span className="mt-[0.1em] block text-[0.82em] font-semibold leading-none tracking-tight">kerning is love</span>
    </div>
  );
}

function LoremArt() {
  return (
    <div className="flex flex-col items-center gap-[0.18em] text-center">
      <span className="text-[0.62em] font-semibold uppercase leading-none tracking-[0.12em] text-spark">pls no</span>
      <span className="relative text-[1.2em] font-semibold leading-none tracking-tight">
        lorem ipsum
        <span className="absolute -left-[4%] -right-[4%] top-1/2 h-[0.13em] -rotate-3 rounded-full bg-vermilion" />
      </span>
    </div>
  );
}

function LayoutArt() {
  return (
    <div className="text-center">
      <svg viewBox="0 0 100 74" className="block w-full" aria-hidden>
        <rect x="5" y="4" width="84" height="66" rx="6" fill="none" strokeWidth="1.1" strokeDasharray="3 2.4" className="stroke-cobalt" />
        <rect x="14" y="12" width="66" height="14" rx="3.5" className="fill-cobalt" />
        <rect x="14" y="32" width="66" height="14" rx="3.5" className="fill-vermilion" />
        <rect x="14" y="52" width="66" height="10" rx="3.5" className="fill-ink" opacity="0.85" />
        <path d="M93 26 V32 M93 46 V52" strokeWidth="1.6" strokeLinecap="round" className="stroke-vermilion" fill="none" />
      </svg>
      <span className="mt-[0.15em] block text-[0.78em] font-semibold leading-none tracking-tight">auto layout fan</span>
    </div>
  );
}

const DECO_LABEL: Record<DecoId, string> = {
  friday: "Sticker: ships on Fridays",
  kerning: "Sticker: kerning is love",
  lorem: "Sticker: please no lorem ipsum",
  layout: "Sticker: auto layout fan",
};

function DecoFace({ spec }: { spec: StickerSpec }) {
  const id = spec.deco ?? "friday";
  const art =
    id === "friday" ? (
      <FridayArt />
    ) : id === "kerning" ? (
      <KerningArt />
    ) : id === "lorem" ? (
      <LoremArt />
    ) : (
      <LayoutArt />
    );
  const cls = id === "friday" ? "bg-vermilion" : id === "lorem" ? "bg-deep text-on-deep" : "bg-paper text-ink";
  return (
    <div className="lid3-face" tabIndex={0} role="group" aria-label={`${DECO_LABEL[id]}. Arrow keys move it.`} data-cursor="hover" data-cursor-label="Peel">
      <Body spec={spec} flow={id !== "friday"} artClass={cls} artStyle={id === "friday" ? undefined : { padding: "0.6em 0.7em" }}>
        {art}
      </Body>
    </div>
  );
}

// ---- the sticker itself ---------------------------------------------------------------------------------------

/** Where a sticker sits, as CSS variables: one set for the landscape lid, one for the portrait lid. */
function placement(spec: StickerSpec): CSSProperties {
  const L = spec.land;
  const v: Record<string, string | number> = {
    "--lx": `${L.x}%`,
    "--ly": `${((L.y / LAND_H) * 100).toFixed(3)}%`,
    "--lw": spec.fit ? "max-content" : `${L.w}cqw`,
    "--lf": `${L.f ?? L.w / 10}cqw`,
    "--lr": `${L.r}deg`,
    "--b": `${spec.b ?? SHAPES[spec.shape].b}em`,
    "--i": spec.order,
    zIndex: spec.z,
  };
  const P = spec.port;
  if (P) {
    v["--px"] = `${P.x}%`;
    v["--py"] = `${((P.y / PORT_H) * 100).toFixed(3)}%`;
    v["--pw"] = spec.fit ? "max-content" : `${P.w}cqw`;
    v["--pf"] = `${P.f ?? P.w / 10}cqw`;
    v["--pr"] = `${P.r}deg`;
  }
  return v as CSSProperties;
}

export default function Sticker({ spec }: { spec: StickerSpec }) {
  const face =
    spec.kind === "name" ? (
      <NameFace spec={spec} />
    ) : spec.kind === "hire" ? (
      <HireFace spec={spec} />
    ) : spec.kind === "work" ? (
      <WorkFace spec={spec} />
    ) : spec.kind === "avail" ? (
      <AvailFace spec={spec} />
    ) : spec.kind === "project" ? (
      <ProjectFace spec={spec} />
    ) : (
      <DecoFace spec={spec} />
    );
  return (
    <div
      className={spec.port ? "lid3-st" : "lid3-st lid3-hp"}
      data-id={spec.id}
      data-z={spec.z}
      data-k0={SHAPES[spec.shape].k0.join(",")}
      style={placement(spec)}
    >
      <div className="lid3-rot">{face}</div>
    </div>
  );
}
