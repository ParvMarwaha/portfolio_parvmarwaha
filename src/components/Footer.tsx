"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "@/utils/gsap";

export default function Footer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  const text = "If you're building something that deserves to be remembered, I'd love to help shape its experience.";
  const words = text.split(" ");

  useEffect(() => {
    if (!containerRef.current || !footerRef.current || !textRef.current) return;

    // 1. Cinematic Footer Reveal (Parallax)
    gsap.fromTo(
      footerRef.current,
      { yPercent: -40 }, // Start slightly higher up
      {
        yPercent: 0,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      }
    );

    // 2. High-Impact Typing / 3D Unblur Effect
    const wordElements = textRef.current.querySelectorAll(".footer-word");
    gsap.fromTo(
      wordElements,
      { opacity: 0, y: 80, filter: "blur(12px)", rotateX: -60 },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        rotateX: 0,
        duration: 1.5,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden bg-charcoal z-0">
      <footer id="contact" ref={footerRef} className="w-full min-h-screen bg-charcoal text-ivory py-16 md:py-24 px-6 md:px-16 flex flex-col justify-between will-change-transform">
        <div className="flex-1 flex items-center justify-center pt-8 pb-16" style={{ perspective: "1000px" }}>
          <h2 
            ref={textRef}
            className="text-4xl md:text-6xl lg:text-[72px] font-serif text-center leading-[1.1] max-w-6xl text-balance"
          >
            {words.map((word, index) => (
              <span key={index} className="footer-word inline-block opacity-0 will-change-transform mr-[0.25em]">
                {word}
              </span>
            ))}
          </h2>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 md:gap-0 border-t border-ivory/20 pt-10">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-sans uppercase tracking-widest text-bronze mb-2">
              Inquiries
            </p>
            <a 
              href="mailto:parvmarwaha1@gmail.com" 
              className="text-2xl md:text-3xl font-serif hover:text-bronze transition-colors tracking-tight"
              data-cursor="hover"
            >
              parvmarwaha1@gmail.com
            </a>
            <a 
              href="tel:9625432705" 
              className="text-2xl md:text-3xl font-serif hover:text-bronze transition-colors tracking-tight"
              data-cursor="hover"
            >
              +91 9625432705
            </a>
          </div>

          <div className="flex gap-8 text-sm font-sans uppercase tracking-widest">
            <a href="https://www.instagram.com/_parv.19/" target="_blank" rel="noopener noreferrer" className="hover:text-bronze transition-colors" data-cursor="hover">
              Instagram
            </a>
            <a href="https://www.linkedin.com/in/parv-marwaha-aa0361232/" target="_blank" rel="noopener noreferrer" className="hover:text-bronze transition-colors" data-cursor="hover">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
