"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/utils/gsap";

export default function Preloader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Force browser to not restore previous scroll position
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    
    // Prevent scrolling during preloader
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    
    // Aggressively lock scroll to top 60 times a second to defeat Next.js scroll restoration
    const lockScroll = () => {
      window.scrollTo(0, 0);
      if (typeof window !== "undefined" && (window as any).lenis) {
        (window as any).lenis.scrollTo(0, { immediate: true });
        (window as any).lenis.stop();
      }
    };
    gsap.ticker.add(lockScroll);
    
    // Aggressively prevent Lenis / Native scroll via wheel and touch events
    const preventScroll = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    
    const counter = counterRef.current;
    
    // Parallax mouse interaction for the counter
    const onMouseMove = (e: MouseEvent) => {
      if (!counter) return;
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 60; 
      const y = (clientY / window.innerHeight - 0.5) * 60;
      
      gsap.to(counter, {
        x: x,
        y: y,
        duration: 1.5,
        ease: "power3.out"
      });
    };
    
    window.addEventListener("mousemove", onMouseMove);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsFinished(true);
          document.body.style.overflow = "";
          document.body.style.height = "";
          
          gsap.ticker.remove(lockScroll);
          if (typeof window !== "undefined" && (window as any).lenis) {
            (window as any).lenis.start();
          }
          
          window.scrollTo(0, 0); // Force top again just to be safe
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("wheel", preventScroll);
          window.removeEventListener("touchmove", preventScroll);
          
          // Refresh ScrollTrigger to recalculate layout dimensions now that body is unconstrained
          setTimeout(() => {
            ScrollTrigger.refresh();
          }, 100);
        }
      });

      // 1. Counter 0 to 100
      const counterObj = { val: 0 };
      tl.to(counterObj, {
        val: 100,
        duration: 2.5,
        ease: "power4.inOut",
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.innerText = `${Math.round(counterObj.val)}%`;
          }
        }
      });

      // 2. Hide counter
      tl.to(counterRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        ease: "power3.inOut"
      }, "+=0.2");

      // 3. Show Text
      const words = textContainerRef.current?.querySelectorAll(".intro-word");
      if (words) {
        tl.fromTo(words, 
          { opacity: 0, y: 40, rotateX: -30 }, 
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            stagger: 0.08,
            duration: 0.8,
            ease: "power3.out"
          }
        );

        // Hide Text
        tl.to(words, {
          opacity: 0,
          y: -30,
          rotateX: 30,
          stagger: 0.05,
          duration: 0.6,
          ease: "power3.in"
        }, "+=1.2");
      }

      // 4. Slide curtain up to reveal site
      tl.to(containerRef.current, {
        yPercent: -100,
        duration: 1.2,
        ease: "power4.inOut"
      });
      
    }, containerRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
      document.body.style.height = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  if (isFinished) return null;

  const introText = "Crafting Digital Atmospheres.";
  const words = introText.split(" ");

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9990] bg-charcoal text-ivory flex flex-col items-center justify-center overflow-hidden touch-none"
      style={{ touchAction: "none" }}
    >
      <div 
        ref={counterRef} 
        className="absolute text-[22vw] md:text-[15vw] font-sans font-normal tracking-tighter pointer-events-none"
        style={{ willChange: "transform, opacity, scale" }}
      >
        0%
      </div>
      
      <div ref={textContainerRef} className="absolute flex flex-wrap justify-center gap-x-[2vw] md:gap-x-4 px-6 text-3xl md:text-5xl lg:text-7xl font-sans tracking-tight pointer-events-none" style={{ perspective: "1000px" }}>
        {words.map((word, i) => (
          <span key={i} className="intro-word inline-block opacity-0">
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
