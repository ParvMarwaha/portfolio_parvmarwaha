"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { name: "Works", href: "#works", image: "/images/work1.png" },
  { name: "Philosophy", href: "#philosophy", image: "/images/work2.png" },
  { name: "Studio", href: "#studio", image: "/images/work3.png" },
  { name: "Contact", href: "#contact", image: "/images/studio.png" },
];



function AnimatedLink({ name, href, onMouseEnter, onMouseLeave, onClick }: any) {
  return (
    <Link 
      href={href} 
      className="relative flex overflow-hidden group text-5xl md:text-7xl lg:text-[7vw] font-normal uppercase leading-[0.85] tracking-tight"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="flex">
        {name.split('').map((char: string, i: number) => (
          <span 
            key={i} 
            className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full group-hover:rotate-12"
            style={{ transitionDelay: `${i * 0.03}s` }}
          >
            {char}
          </span>
        ))}
      </div>
      <div className="absolute top-0 left-0 flex">
        {name.split('').map((char: string, i: number) => (
          <span 
            key={i} 
            className="inline-block translate-y-full -rotate-12 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-y-0 group-hover:rotate-0"
            style={{ transitionDelay: `${i * 0.03}s` }}
          >
            {char}
          </span>
        ))}
      </div>
    </Link>
  );
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMouse);
    return () => window.removeEventListener("mousemove", updateMouse);
  }, []);

  const menuVariants = {
    initial: {
      clipPath: "circle(0px at calc(100% - 80px) 80px)",
    },
    enter: {
      clipPath: "circle(150% at calc(100% - 80px) 80px)",
      transition: { duration: 1, ease: [0.76, 0, 0.24, 1] }
    },
    exit: {
      clipPath: "circle(0px at calc(100% - 80px) 80px)",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
    }
  };

  const linkWrapperVariants = {
    initial: { y: "20%", opacity: 0, rotate: 5 },
    enter: (i: number) => ({
      y: "0%", opacity: 1, rotate: 0,
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.1 * i + 0.2 }
    }),
    exit: {
      y: "20%", opacity: 0, rotate: -5,
      transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] }
    }
  };

  return (
    <>
      <div className="fixed top-8 right-8 z-[60] mix-blend-difference text-ivory">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="h-8 w-16 overflow-hidden relative group"
          data-cursor="hover"
        >
          <motion.div
            animate={{ y: isOpen ? -32 : 0 }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="flex flex-col w-full"
          >
            <span className="h-8 w-full flex items-center justify-end font-bold tracking-widest text-sm uppercase group-hover:opacity-70 transition-opacity">Menu</span>
            <span className="h-8 w-full flex items-center justify-end font-bold tracking-widest text-sm uppercase group-hover:opacity-70 transition-opacity">Close</span>
          </motion.div>
        </button>
      </div>

      <div className="fixed top-8 left-8 z-[60] mix-blend-difference text-ivory pointer-events-none">
        <span className="text-xl font-bold tracking-tighter">Parv Marwaha.</span>
      </div>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="fixed inset-0 z-50 bg-charcoal text-ivory flex items-center justify-center overflow-hidden"
          >
            {/* Mouse Follower Image */}
            <motion.div
              className="absolute top-0 left-0 w-[300px] md:w-[500px] aspect-[4/5] pointer-events-none z-0 hidden md:block"
              animate={{
                x: mousePos.x - 250,
                y: mousePos.y - 300,
                opacity: activeImage ? 0.6 : 0,
                scale: activeImage ? 1 : 0.8,
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 0.5,
              }}
            >
              <AnimatePresence mode="wait">
                {activeImage && (
                  <motion.div
                    key={activeImage}
                    initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                    transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                    className="w-full h-full relative rounded-xl overflow-hidden"
                  >
                    <Image src={activeImage} alt="preview" fill className="object-cover" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Links Container */}
            <nav className="relative z-10 flex flex-col items-center justify-center w-full max-w-7xl px-4 gap-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  custom={i}
                  variants={linkWrapperVariants}
                  initial="initial"
                  animate="enter"
                  exit="exit"
                >
                  <AnimatedLink 
                    name={link.name} 
                    href={link.href} 
                    onMouseEnter={() => setActiveImage(link.image)}
                    onMouseLeave={() => setActiveImage(null)}
                    onClick={() => setIsOpen(false)}
                  />
                </motion.div>
              ))}
            </nav>

            {/* Menu Footer */}
            <motion.div 
              className="absolute bottom-8 left-8 right-8 flex justify-between text-xs tracking-widest uppercase font-bold opacity-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <span>Socials</span>
              <span>2026 © Parv Marwaha</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
