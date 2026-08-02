"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const allProjects = [
  {
    id: 1,
    title: "AURA Space",
    category: "Experience Design",
    image: "/images/work1.png",
    slug: "aura-space"
  },
  {
    id: 2,
    title: "Nuit Blanche",
    category: "Visual Design",
    image: "/images/work2.png",
    slug: "nuit-blanche"
  },
  {
    id: 3,
    title: "Urban Silence",
    category: "Photography",
    image: "/images/profile-photo.png",
    slug: "urban-silence"
  },
  {
    id: 4,
    title: "Lumina Reality",
    category: "Experience Design",
    image: "/images/work3.png",
    slug: "lumina-reality"
  },
  {
    id: 5,
    title: "The Exhibit",
    category: "Visual Design",
    image: "/images/work1.png",
    slug: "the-exhibit"
  },
  {
    id: 6,
    title: "Editorial Portraits",
    category: "Photography",
    image: "/images/work2.png",
    slug: "editorial-portraits"
  },
];

const categories = ["All", "Experience Design", "Visual Design", "Photography"];

export default function WorksGallery() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProjects = activeCategory === "All" 
    ? allProjects 
    : allProjects.filter(p => p.category === activeCategory);

  return (
    <main className="min-h-screen bg-ivory text-charcoal pt-32 pb-32 px-6 md:px-16 w-full relative z-10">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20 md:mb-32 mt-12 md:mt-0">
          <h1 className="text-6xl md:text-8xl lg:text-[120px] font-sans font-bold tracking-tighter leading-[0.85] uppercase">
            Selected<br />Works
          </h1>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-6 md:gap-8 text-xs md:text-sm font-sans uppercase tracking-widest">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative transition-colors duration-300 py-2 ${activeCategory === cat ? 'text-charcoal font-bold' : 'text-graphite hover:text-charcoal font-normal'}`}
                data-cursor="hover"
              >
                {cat}
                {activeCategory === cat && (
                  <motion.div 
                    layoutId="underline"
                    className="absolute left-0 right-0 h-[2px] bg-charcoal bottom-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry-style Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-16 md:gap-y-24">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8, y: 80, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.8, y: -80, filter: "blur(10px)" }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 25,
                  delay: index * 0.05 
                }}
                key={project.id}
                // Create a staggered masonry look on desktop
                className={`group flex flex-col cursor-pointer ${
                  index % 3 === 1 ? 'lg:mt-24' : index % 3 === 2 ? 'lg:mt-48' : ''
                }`}
                data-cursor="hover"
              >
                <Link href={`/work/${project.slug}`}>
                  <div className="relative w-full aspect-[4/5] overflow-hidden bg-charcoal/5">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover scale-110 transition-transform duration-[1.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-100"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="mt-6 md:mt-8 flex flex-col">
                    <h3 className="text-2xl md:text-3xl font-sans font-bold tracking-tight text-charcoal group-hover:text-bronze transition-colors duration-300">
                      {project.title}
                    </h3>
                    <p className="text-xs font-sans text-graphite uppercase tracking-widest mt-2 md:mt-3 font-semibold">
                      {project.category}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
