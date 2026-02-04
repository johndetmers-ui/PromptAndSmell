"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, Shuffle, SlidersHorizontal, X } from "lucide-react";
import { scentCards } from "@/lib/mock-data";
import { MiniScentWheel } from "@/components/ScentWheel";
import { ScentCard } from "@/lib/types";

const filterCategories = [
  "All",
  "Fresh",
  "Warm",
  "Woody",
  "Floral",
  "Gourmand",
  "Aquatic",
  "Spicy",
  "Oriental",
  "Green",
  "Smoky",
];

const moodFilters = [
  "All Moods",
  "Romantic",
  "Energizing",
  "Cozy",
  "Mystical",
  "Bold",
  "Delicate",
  "Luxurious",
  "Clean",
  "Peaceful",
];

const seasonFilters = ["All Seasons", "Spring", "Summer", "Autumn", "Winter"];

const intensityFilters = [
  { label: "Any Intensity", min: 0, max: 10 },
  { label: "Light (1-3)", min: 1, max: 3 },
  { label: "Medium (4-6)", min: 4, max: 6 },
  { label: "Strong (7-10)", min: 7, max: 10 },
];

export default function GalleryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeMood, setActiveMood] = useState("All Moods");
  const [activeSeason, setActiveSeason] = useState("All Seasons");
  const [activeIntensity, setActiveIntensity] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const filteredScents = useMemo(() => {
    return scentCards.filter((scent) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          scent.name.toLowerCase().includes(q) ||
          scent.description.toLowerCase().includes(q) ||
          scent.creator.toLowerCase().includes(q) ||
          scent.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (activeCategory !== "All") {
        const matchesCategory = scent.tags.some(
          (t) => t.toLowerCase() === activeCategory.toLowerCase()
        ) || scent.mood.some(
          (m) => m.toLowerCase() === activeCategory.toLowerCase()
        );
        if (!matchesCategory) return false;
      }

      // Mood filter
      if (activeMood !== "All Moods") {
        if (!scent.mood.includes(activeMood)) return false;
      }

      // Season filter
      if (activeSeason !== "All Seasons") {
        if (!scent.season.includes(activeSeason)) return false;
      }

      // Intensity filter
      const intensityRange = intensityFilters[activeIntensity];
      if (
        scent.intensity < intensityRange.min ||
        scent.intensity > intensityRange.max
      ) {
        return false;
      }

      return true;
    });
  }, [search, activeCategory, activeMood, activeSeason, activeIntensity]);

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setActiveMood("All Moods");
    setActiveSeason("All Seasons");
    setActiveIntensity(0);
  };

  const hasActiveFilters =
    search ||
    activeCategory !== "All" ||
    activeMood !== "All Moods" ||
    activeSeason !== "All Seasons" ||
    activeIntensity !== 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Scent Gallery
        </h1>
        <p className="text-gray-500">
          Explore community-created fragrances and find inspiration
        </p>
      </motion.div>

      {/* Search and filter bar */}
      <motion.div
        className="mb-6 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scents, creators, tags..."
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${
              showFilters ? "glass-strong text-primary-300" : ""
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center gap-2 text-red-400/70 hover:text-red-400"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {filterCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`chip text-xs transition-all ${
                activeCategory === cat
                  ? "bg-primary-400/20 text-primary-400 border-primary-400/30"
                  : "text-gray-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="card grid md:grid-cols-3 gap-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Mood */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block">
                  Mood
                </label>
                <select
                  value={activeMood}
                  onChange={(e) => setActiveMood(e.target.value)}
                  className="input-field text-sm"
                >
                  {moodFilters.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block">
                  Season
                </label>
                <select
                  value={activeSeason}
                  onChange={(e) => setActiveSeason(e.target.value)}
                  className="input-field text-sm"
                >
                  {seasonFilters.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Intensity */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block">
                  Intensity
                </label>
                <select
                  value={activeIntensity}
                  onChange={(e) =>
                    setActiveIntensity(parseInt(e.target.value))
                  }
                  className="input-field text-sm"
                >
                  {intensityFilters.map((f, i) => (
                    <option key={i} value={i}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-500">
        {filteredScents.length} scent{filteredScents.length !== 1 ? "s" : ""}{" "}
        found
      </div>

      {/* Scent grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredScents.map((scent, i) => (
            <ScentCardComponent key={scent.id} scent={scent} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredScents.length === 0 && (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-4xl mb-4 text-gray-700">...</div>
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            No scents match your filters
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or filters
          </p>
          <button onClick={clearFilters} className="btn-secondary text-sm">
            Clear All Filters
          </button>
        </motion.div>
      )}
    </div>
  );
}

function ScentCardComponent({
  scent,
  index,
}: {
  scent: ScentCard;
  index: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/scent/${scent.id}`}>
        <div className="card group cursor-pointer hover:shadow-glow h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 mr-3">
              <h3 className="text-lg font-semibold text-gray-200 group-hover:text-primary-400 transition-colors truncate">
                {scent.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                by {scent.creator}
              </p>
            </div>
            <MiniScentWheel ingredients={scent.ingredients} size={50} />
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed flex-1">
            {scent.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {scent.mood.slice(0, 2).map((m) => (
              <span
                key={m}
                className="text-[10px] px-2 py-0.5 rounded-full bg-primary-400/10 text-primary-400/80"
              >
                {m}
              </span>
            ))}
            {scent.season.slice(0, 1).map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full bg-surface-500/40 text-gray-500"
              >
                {s}
              </span>
            ))}
            {scent.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-surface-600/40 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-surface-700/30">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {scent.likes}
              </span>
              <span className="flex items-center gap-1">
                <Shuffle className="w-3 h-3" />
                {scent.remixes}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Intensity</span>
              <div className="flex gap-0.5">
                {[...Array(10)].map((_, j) => (
                  <div
                    key={j}
                    className={`w-1 h-3 rounded-sm ${
                      j < scent.intensity
                        ? "bg-primary-400"
                        : "bg-surface-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
