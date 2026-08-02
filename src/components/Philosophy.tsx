"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/utils/gsap";

export default function Philosophy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Text Reveal Animation
      gsap.fromTo(
        textRefs.current,
        { opacity: 0.1, y: 15 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 60%",
            end: "center 40%",
            scrub: true,
          },
        }
      );

      // Pin the section to allow the next section to overlap
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        pin: true,
        pinSpacing: false,
      });
    });

    return () => ctx.revert();
  }, []);

  const paragraph = 
    "I don't design websites. I design digital experiences. Every interaction should reinforce this. Craft is not just about pixels; it's about the emotion felt between the spaces. Storytelling that transcends the screen, built on timelessness and precision.";
  const words = paragraph.split(" ");

  return (
    <section 
      id="philosophy" 
      ref={containerRef} 
      className="w-full min-h-screen flex items-center justify-center py-32 px-6 md:px-16 bg-ivory"
    >
      <div className="max-w-4xl mx-auto">
        
        <div className="text-2xl md:text-4xl lg:text-5xl font-serif leading-[1.1] tracking-tight text-charcoal">
          {words.map((word, i) => (
            <span 
              key={i} 
              ref={(el) => { textRefs.current[i] = el; }} 
              className="inline-block mr-2 md:mr-3 mb-1 md:mb-2"
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
