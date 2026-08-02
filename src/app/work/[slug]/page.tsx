"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/utils/gsap";
import { useParams } from "next/navigation";

export default function ProjectDetail() {
  const { slug } = useParams();
  const heroImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      heroImageRef.current,
      { scale: 1.1, opacity: 0 },
      { scale: 1, opacity: 1, duration: 2, ease: "power3.out" }
    );
  }, []);

  return (
    <main className="w-full min-h-screen bg-ivory text-charcoal">
      {/* Opening Hero */}
      <section className="relative w-full h-[80vh] md:h-screen overflow-hidden">
        <div ref={heroImageRef} className="absolute inset-0 w-full h-full">
          <Image
            src="/images/work1.png"
            alt="Project Hero"
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-16 left-6 md:left-16 z-10 text-ivory mix-blend-difference">
          <h1 className="text-5xl md:text-8xl font-serif mb-4 capitalize">
            {slug ? (slug as string).replace("-", " ") : "The Project"}
        </div>
      </section>

      {/* The Story */}
      <section className="py-32 px-6 md:px-16 max-w-4xl mx-auto">
        <div className="text-2xl md:text-4xl font-serif leading-snug">
          How do we translate physical presence into a digital medium? We began with the concept of negative space, allowing the content to breathe exactly as it would in a modern art gallery.
        </div>
      </section>

      {/* Visual Language (Editorial Layout) */}
      <section className="py-16 md:py-32 px-6 md:px-16 w-full flex flex-col md:flex-row gap-16 items-center">
        <div className="w-full md:w-5/12 order-2 md:order-1">
          <p className="text-lg font-sans text-graphite leading-relaxed">
            Every typeface and color decision was made with restraint. We relied on a monolithic typographic hierarchy and subtle contrast to direct the user's eye, stripping away anything that didn't serve the core narrative.
          </p>
        </div>
        <div className="w-full md:w-7/12 order-1 md:order-2 relative aspect-[4/3] md:aspect-square overflow-hidden">
          <Image
            src="/images/work2.png"
            alt="Editorial detail"
            fill
            className="object-cover"
          />
        </div>
      </section>

      {/* Edge to Edge Image */}
      <section className="w-full h-screen relative overflow-hidden my-32">
        <Image
          src="/images/work3.png"
          alt="Full screen project detail"
          fill
          className="object-cover"
        />
      </section>

      {/* Outcome */}
      <section className="py-32 px-6 md:px-16 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end border-b border-charcoal/10 pb-32">
        <div className="w-full md:w-1/2 mb-16 md:mb-0">
          <div className="text-3xl md:text-5xl font-serif">
            A digital space that feels earned, not just visited.
          </div>
        </div>
        <div className="w-full md:w-1/3 text-base text-graphite font-sans">
          The result is an award-winning digital experience that increased dwell time by 300% and completely repositioned the brand within the luxury sector.
        </div>
      </section>

      {/* Next Project */}
      <section className="h-[50vh] flex items-center justify-center">
        <a 
          href="/work/next-project" 
          className="text-4xl md:text-7xl font-serif hover:opacity-70 transition-opacity"
          data-cursor="hover"
        >
          Next Project
        </a>
      </section>
    </main>
  );
}
