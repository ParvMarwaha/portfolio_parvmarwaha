"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/content/site";
import { getLenis } from "@/utils/lenis";
import Magnetic from "@/components/ui/Magnetic";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import SoundToggle, { SoundBrain, SoundRow } from "@/components/SoundToggle";
import NavLinks, { LINKS as links } from "@/components/NavLinks";

const pillBase = "rounded-full ring-1 ring-ink/10 md:backdrop-blur-md";
const pill = `${pillBase} bg-paper md:bg-paper/85`;

/** Three floating pills (name, navigation, hire) so it stays legible over any content. */
export default function TopBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (open) getLenis()?.stop();
    else getLenis()?.start();
    return () => getLenis()?.start();
  }, [open]);

  return (
    <>
      <SoundBrain />
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-start justify-between p-3 md:p-5">
        <Link
          href="/"
          className={`pointer-events-auto px-4 py-2 text-[0.9375rem] font-semibold tracking-tighter ${pill}`}
          data-cursor-label="Home"
        >
          {site.name}.
        </Link>

        <div className="pointer-events-auto absolute left-1/2 top-3 hidden -translate-x-1/2 md:top-5 lg:block">
          <NavLinks pathname={pathname} />
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <ThemeSwitcher />
          <SoundToggle />
          <Link
            href="/play"
            className={`hidden px-4 py-2 text-[0.8125rem] font-medium tracking-normal transition-colors sm:block ${pillBase} ${
              pathname === "/play" ? "bg-ink text-paper" : "bg-paper hover:bg-paper md:bg-paper/85"
            }`}
            data-cursor-label="Play"
          >
            Off hours
          </Link>
          <Magnetic strength={0.28} radius={60}>
            <Link
              href="/contact"
              className="block rounded-full bg-vermilion px-4 py-2 text-[0.8125rem] font-semibold tracking-normal text-white transition-transform hover:scale-[1.04]"
              data-cursor-label="Let's talk"
            >
              Hire me ↗
            </Link>
          </Magnetic>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`px-4 py-2 text-[0.8125rem] font-medium tracking-normal lg:hidden ${pill}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ clipPath: "circle(0px at calc(100% - 40px) 32px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 40px) 32px)" }}
            exit={{ clipPath: "circle(0px at calc(100% - 40px) 32px)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[55] flex flex-col justify-between bg-cobalt px-6 pb-8 pt-28 text-paper"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {[...links, { label: "Off hours", href: "/play", active: () => false }].map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                >
                  <Link href={l.href} className="block text-6xl font-medium tracking-tighter">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="flex flex-col gap-5">
              <SoundRow />
            <div className="label flex flex-col gap-2 opacity-80">
              <a href={`mailto:${site.email}`}>{site.email}</a>
              <span>2026 © {site.name}</span>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
