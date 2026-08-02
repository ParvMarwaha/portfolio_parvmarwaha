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

  // Force scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      <div className="w-full">
        
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
          <div className="flex flex-wrap gap-6 md:gap-8 text-base md:text-lg font-serif tracking-tight pb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative transition-colors duration-300 py-2 ${activeCategory === cat ? 'text-charcoal font-semibold' : 'text-graphite hover:text-charcoal font-normal'}`}
                data-cursor="hover"
              >
                {cat}
                {activeCategory === cat && (
                  <motion.div 
                    layoutId="underline"
                    className="absolute left-0 right-0 h-[1.5px] bg-charcoal bottom-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Match Homepage 2-Column Landscape Grid */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-12 gap-y-16 md:gap-y-24">
          <AnimatePresence mode="wait">
            {filteredProjects.map((project, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeOut",
                  delay: index * 0.05 
                }}
                key={project.id}
                className="group flex flex-col cursor-pointer"
                data-cursor="hover"
              >
                <Link href={`/work/${project.slug}`}>
                  <div className="relative w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-md bg-charcoal/5">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover scale-110 transition-transform duration-700 group-hover:scale-100"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="mt-5 md:mt-6 flex flex-col">
                    <h3 className="text-xl md:text-2xl font-serif text-charcoal tracking-tight group-hover:text-bronze transition-colors duration-300">
                      {project.title}
                    </h3>
                    <p className="text-sm font-sans text-graphite mt-1 md:mt-2 font-normal">
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
