"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contact" className="w-full bg-charcoal text-ivory py-32 px-6 md:px-16 flex flex-col justify-between min-h-screen">
      <div className="flex-1 flex items-center justify-center pt-24 pb-32">
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-serif text-center leading-[1.1] max-w-6xl text-balance">
          If you&apos;re building something that deserves to be remembered, I&apos;d love to help shape its experience.
        </h2>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-16 md:gap-0 border-t border-ivory/20 pt-12">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-sans uppercase tracking-widest text-bronze mb-4">
            Inquiries
          </p>
          <a 
            href="mailto:studio@example.com" 
            className="text-2xl md:text-3xl font-serif hover:text-bronze transition-colors"
            data-cursor="hover"
          >
            studio@example.com
          </a>
        </div>

        <div className="flex gap-8 text-sm font-sans uppercase tracking-widest">
          <Link href="#" className="hover:text-bronze transition-colors" data-cursor="hover">
            Instagram
          </Link>
          <Link href="#" className="hover:text-bronze transition-colors" data-cursor="hover">
            Twitter
          </Link>
          <Link href="#" className="hover:text-bronze transition-colors" data-cursor="hover">
            LinkedIn
          </Link>
        </div>
      </div>
    </footer>
  );
}
