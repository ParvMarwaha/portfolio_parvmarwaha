"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/utils/gsap";

export default function Studio() {
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageRef.current) return;

    gsap.to(imageRef.current.querySelector("img"), {
      yPercent: 15,
      ease: "none",
      scrollTrigger: {
        trigger: imageRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  }, []);

  return (
    <section id="studio" className="w-full bg-ivory py-32 px-6 md:px-16">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-32 items-center">
        
        <div 
          ref={imageRef} 
          className="w-full lg:w-5/12 relative aspect-[4/5] overflow-hidden rounded-sm"
        >
          <Image
            src="/images/profile-photo.png"
            alt="Creative Director Portrait"
            fill
            className="object-cover scale-110 grayscale contrast-125 brightness-95"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col">
          
          <div className="text-2xl md:text-4xl font-serif text-charcoal leading-snug mb-8">
            Obsessed with the unseen details. Every micro-interaction and motion curve is considered, not just for function, but for how it makes you feel.
          </div>
          
          <p className="text-base md:text-lg font-sans text-graphite leading-relaxed max-w-md">
            Operating at the intersection of luxury brand design and immersive technology. The goal is never just to build a tool, but to craft a space—a digital environment that commands attention and leaves a lasting impression through meticulous craftsmanship and interactive storytelling.
          </p>
        </div>

      </div>
    </section>
  );
}
