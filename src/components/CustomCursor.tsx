"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/utils/gsap";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Only run on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Use quickSetters for 0-latency hardware-accelerated tracking
    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    
    // Start completely invisible until the mouse physically moves
    gsap.set([dot, ring], { opacity: 0 });

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let hasMoved = false;

    const updateMouse = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      
      // Instant update for the tiny dot (perfect accuracy)
      setDotX(mouse.x);
      setDotY(mouse.y);
      
      if (!hasMoved) {
        hasMoved = true;
        // Snap the ring to the first position immediately
        ringPos.x = mouse.x;
        ringPos.y = mouse.y;
        gsap.set(ring, { x: ringPos.x, y: ringPos.y });
        // Fade in smoothly without triggering React re-renders
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
    };

    const tickerCallback = () => {
      if (!hasMoved) return;
      // Lerp for smooth trailing (adjustable speed)
      ringPos.x += (mouse.x - ringPos.x) * 0.2;
      ringPos.y += (mouse.y - ringPos.y) * 0.2;
      
      gsap.set(ring, { x: ringPos.x, y: ringPos.y });
    };
    
    gsap.ticker.add(tickerCallback);

    const handleMouseOver = (e: MouseEvent) => {
      if (!hasMoved) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button") ||
        target.dataset.cursor === "hover"
      ) {
        gsap.to(dot, { scale: 0, opacity: 0, duration: 0.3 });
        gsap.to(ring, { 
          scale: 2.5, 
          backgroundColor: "#ffffff",
          borderWidth: "0px",
          duration: 0.3,
          ease: "back.out(1.5)"
        });
      } else {
        gsap.to(dot, { scale: 1, opacity: 1, duration: 0.3 });
        gsap.to(ring, { 
          scale: 1, 
          backgroundColor: "transparent", 
          borderWidth: "1px",
          duration: 0.3,
          ease: "power2.out"
        });
      }
    };

    window.addEventListener("mousemove", updateMouse);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updateMouse);
      window.removeEventListener("mouseover", handleMouseOver);
      gsap.ticker.remove(tickerCallback);
    };
  }, [isMounted]);

  if (!isMounted) return null;

  // Hide cursor completely on touch devices
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <>
      {/* Outer trailing ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full border border-white mix-blend-difference pointer-events-none z-[9999]"
      />
      {/* Inner accurate dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 bg-white mix-blend-difference rounded-full pointer-events-none z-[9999]"
      />
    </>
  );
}
