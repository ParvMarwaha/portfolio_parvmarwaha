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
    <main className="min-h-screen bg-ivory text-charcoal pt-32 pb-24 px-6 md:px-16 w-full relative z-10">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16 md:mb-24 mt-12 md:mt-0">
          <h1 className="text-5xl md:text-7xl lg:text-[100px] font-serif tracking-tight leading-[0.9]">
            Selected<br />Works
          </h1>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-6 md:gap-8 text-xs md:text-sm font-sans uppercase tracking-widest">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative transition-colors duration-300 ${activeCategory === cat ? 'text-charcoal font-bold' : 'text-graphite hover:text-charcoal font-normal'}`}
                data-cursor="hover"
              >
                {cat}
                {activeCategory === cat && (
                  <motion.div 
                    layoutId="underline"
                    className="absolute left-0 right-0 h-[1.5px] bg-charcoal -bottom-2"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-12 gap-y-16 md:gap-y-24">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                key={project.id}
                className="group flex flex-col cursor-pointer"
                data-cursor="hover"
              >
                <Link href={`/work/${project.slug}`}>
                  <div className="relative w-full aspect-[4/5] overflow-hidden rounded-md bg-charcoal/5">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover scale-110 transition-transform duration-700 group-hover:scale-100"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="mt-5 md:mt-6">
                    <h3 className="text-xl md:text-2xl font-serif text-charcoal tracking-tight">
                      {project.title}
                    </h3>
                    <p className="text-sm font-sans text-graphite uppercase tracking-widest mt-2 md:mt-3">
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
