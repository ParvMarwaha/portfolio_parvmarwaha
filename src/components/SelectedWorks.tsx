"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "@/utils/gsap";

const mainWorks = [
  {
    title: "AURA Space",
    category: "Crafted a gamified online user experience for spatial computing",
    image: "/images/work1.png",
  },
  {
    title: "Nuit Blanche",
    category: "Redesigned digital fashion interfaces for the modern runway",
    image: "/images/work2.png",
  },
  {
    title: "The Exhibit",
    category: "55th Anniversary Release of interactive art installations",
    image: "/images/work3.png",
  },
  {
    title: "Lumina Reality",
    category: "Overall score tracking for trusted mixed reality environments",
    image: "/images/work1.png",
  },
];

const collageImages = [
  { src: "/images/work2.png", classes: "w-[40%] md:w-[25%] aspect-square left-[5%] top-[10%] -rotate-6 z-10" },
  { src: "/images/work3.png", classes: "w-[45%] md:w-[30%] aspect-video left-[30%] top-[5%] rotate-3 z-0" },
  { src: "/images/work1.png", classes: "w-[50%] md:w-[35%] aspect-[4/3] left-[20%] top-[40%] -rotate-2 z-20" },
  { src: "/images/work2.png", classes: "w-[35%] md:w-[20%] aspect-[3/4] right-[15%] bottom-[10%] rotate-6 z-10" },
  { src: "/images/work3.png", classes: "w-[30%] md:w-[25%] aspect-video right-[5%] top-[20%] -rotate-3 z-30" },
];

export default function SelectedWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const collageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subtle parallax on the images as you scroll
    const images = gsap.utils.toArray<HTMLElement>(".grid-image");
    images.forEach((img) => {
      gsap.to(img, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: img.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    // Collage floating effect
    const collageItems = gsap.utils.toArray<HTMLElement>(".collage-item");
    collageItems.forEach((item, i) => {
      gsap.to(item, {
        y: (i % 2 === 0 ? -30 : 30),
        x: (i % 2 === 0 ? 15 : -15),
        rotation: (i % 2 === 0 ? "+=5" : "-=5"),
        ease: "none",
        scrollTrigger: {
          trigger: collageRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
  }, []);

  return (
    <section id="works" ref={containerRef} className="relative z-20 w-full bg-ivory pb-32 pt-12 px-6 md:px-16">
      
      {/* Main Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-12 gap-y-16 md:gap-y-24 mt-16">
        {mainWorks.map((work, index) => (
          <div key={index} className="flex flex-col group cursor-pointer">
            <div className="relative w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-md bg-charcoal/5">
              <Image
                src={work.image}
                alt={work.title}
                fill
                className="grid-image object-cover scale-110 transition-transform duration-700 group-hover:scale-100"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="mt-5 md:mt-6">
              <h3 className="text-xl md:text-2xl font-serif text-charcoal tracking-tight">
                {work.title}
              </h3>
              <p className="text-sm md:text-base font-sans text-graphite mt-1 md:mt-2">
                {work.category}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Other Projects Section */}
      <Link href="/works" className="mt-32 w-full block group cursor-pointer" data-cursor="hover">
        <div 
          ref={collageRef}
          className="w-full h-[50vh] md:h-[60vh] bg-[#2A2A2A] rounded-md relative overflow-hidden"
        >
          {collageImages.map((img, index) => (
            <div 
              key={index} 
              className={`collage-item absolute shadow-2xl overflow-hidden rounded-sm ${img.classes}`}
            >
              <Image
                src={img.src}
                alt="Other Project"
                fill
                className="object-cover"
                sizes="33vw"
              />
            </div>
          ))}
          
          <div className="absolute inset-0 bg-charcoal opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-50 flex items-center justify-center overflow-hidden">
            <span className="text-ivory text-3xl md:text-5xl font-sans font-normal tracking-tight uppercase translate-y-12 group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
              view other projects
            </span>
          </div>
        </div>
        
        <div className="mt-6 md:mt-8 flex justify-between items-end">
          <div>
            <h3 className="text-xl md:text-2xl font-serif text-charcoal tracking-tight group-hover:text-bronze transition-colors">
              Other projects
            </h3>
            <p className="text-sm md:text-base font-sans text-graphite mt-1 md:mt-2">
              Experience Design, Visual Design, and Photography
            </p>
          </div>
        </div>
      </Link>

    </section>
  );
}
