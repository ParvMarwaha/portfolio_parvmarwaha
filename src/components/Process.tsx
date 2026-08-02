"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/utils/gsap";

const steps = [
  "Observe",
  "Understand",
  "Craft",
  "Refine",
  "Experience",
];

export default function Process() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const words = gsap.utils.toArray<HTMLElement>(".process-step");
    
    gsap.fromTo(
      words,
      { opacity: 0.2, x: -50 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 50%",
          end: "bottom 80%",
          scrub: true,
        },
      }
    );
  }, []);

  return (
    <section className="w-full bg-charcoal text-ivory py-48 px-6 md:px-16 overflow-hidden" ref={containerRef}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 md:gap-32 items-start md:items-center">
        <div className="w-full md:w-1/3">
          <p className="text-lg font-sans text-ivory/60 max-w-sm">
            Moving beyond aesthetics to build meaning. A systematic approach to shaping atmosphere and emotion.
          </p>
        </div>
        
        <div className="w-full md:w-2/3 flex flex-col gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="process-step text-5xl md:text-7xl lg:text-8xl font-serif tracking-tight"
            >
              {step}.
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
