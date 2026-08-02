"use client";

import { useState, useEffect } from "react";
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
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="min-h-screen bg-ivory text-charcoal pt-32 pb-32 px-6 md:px-16 w-full relative z-10"
    >
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20 md:mb-32 mt-12 md:mt-0"
        >
          <h1 className="text-5xl md:text-7xl lg:text-[100px] font-sans font-normal tracking-tight leading-[0.85] uppercase">
            Works
          </h1>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-6 md:gap-8 text-xs md:text-sm font-sans uppercase tracking-widest pb-4">
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
        </motion.div>

        {/* Clean Standard Grid */}
        <motion.div 
          layout 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-16 md:gap-y-24"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.25, 1, 0.5, 1], // Very smooth, non-bouncy ease
                  delay: index * 0.05 
                }}
                key={project.id}
                className="group flex flex-col cursor-pointer"
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
    </motion.main>
  );
}
