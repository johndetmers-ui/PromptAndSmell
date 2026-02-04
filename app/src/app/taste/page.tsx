"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Loader2, Cpu, Play, Leaf } from "lucide-react";
import TasteVisualizer from "@/components/TasteVisualizer";
import { FlavorFormula, mockFlavors } from "@/lib/synesthesia/mock-data";

// ---------------------------------------------------------------------------
// Example chips
// ---------------------------------------------------------------------------

const EXAMPLE_PROMPTS = [
  "What would a sunset taste like?",
  "The opposite of coffee",
  "Nostalgia in liquid form",
  "A color: deep purple",
  "The sound of rain as a flavor",
  "Umami cloud",
];

// ---------------------------------------------------------------------------
// Dietary filter options
// ---------------------------------------------------------------------------

const DIETARY_OPTIONS = [
  { key: "Vegan", label: "Vegan" },
  { key: "Gluten-Free", label: "Gluten-Free" },
  { key: "Nut-Free", label: "Nut-Free" },
  { key: "Sugar-Free", label: "Sugar-Free" },
];

// ---------------------------------------------------------------------------
// Format options
// ---------------------------------------------------------------------------

type FormatOption = "home" | "molecular" | "both";

const FORMAT_OPTIONS: { key: FormatOption; label: string }[] = [
  { key: "home", label: "Home Recipe" },
  { key: "molecular", label: "Molecular Formula" },
  { key: "both", label: "Both" },
];

// ---------------------------------------------------------------------------
// TastePage
// ---------------------------------------------------------------------------

export default function TastePage() {
  const [prompt, setPrompt] = useState("");
  const [flavor, setFlavor] = useState<FlavorFormula | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generationMode, setGenerationMode] = useState<"ai" | "demo" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(true);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [formatOption, setFormatOption] = useState<FormatOption>("both");

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const toggleDietary = (key: string) => {
    setDietaryFilters((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const handleGenerate = useCallback(
    async (inputPrompt?: string) => {
      const finalPrompt = (inputPrompt || prompt).trim();
      if (!finalPrompt) return;

      setIsLoading(true);
      setShowGallery(false);

      try {
        const res = await fetch("/api/taste", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: finalPrompt,
            format: formatOption,
            dietary: dietaryFilters.length > 0 ? dietaryFilters : undefined,
          }),
        });
        const data = await res.json();

        if (data.flavor) {
          setFlavor(data.flavor);
          setGenerationMode(data.demo ? "demo" : "ai");
          if (data.demo) {
            showToast("Running in demo mode -- flavor data is simulated");
          }
        } else {
          throw new Error(data.error || "Failed to generate flavor");
        }
      } catch {
        showToast("Could not reach API -- falling back to demo mode");
        const { getMockFlavorForPrompt } = await import(
          "@/lib/synesthesia/mock-data"
        );
        const mock = getMockFlavorForPrompt(finalPrompt);
        setFlavor({
          ...mock,
          name: finalPrompt
            .split(" ")
            .slice(0, 4)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        });
        setGenerationMode("demo");
      }

      setIsLoading(false);
    },
    [prompt, formatOption, dietaryFilters, showToast]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerate();
  };

  const handleChipClick = (chipPrompt: string) => {
    setPrompt(chipPrompt);
    handleGenerate(chipPrompt);
  };

  const handleGalleryClick = (galleryFlavor: FlavorFormula) => {
    setFlavor(galleryFlavor);
    setGenerationMode("demo");
    setShowGallery(false);
    setPrompt(galleryFlavor.name);
  };

  const handleStartOver = () => {
    setFlavor(null);
    setPrompt("");
    setGenerationMode(null);
    setShowGallery(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-400/10 border border-primary-400/20 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">TASTE</h1>
            <p className="text-gray-500 text-sm">
              Describe any flavor. We will formulate it.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a flavor, concept, or experience..."
            className="input-field pr-28 text-lg py-4"
            maxLength={500}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary text-sm py-2 px-5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Tasting
              </>
            ) : (
              <>
                <ChefHat className="w-4 h-4" />
                Formulate
              </>
            )}
          </button>
        </form>

        {/* Example chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {EXAMPLE_PROMPTS.map((example) => (
            <motion.button
              key={example}
              onClick={() => handleChipClick(example)}
              className="chip text-sm text-gray-400 hover:text-primary-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isLoading}
            >
              &quot;{example}&quot;
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8 space-y-4"
      >
        {/* Dietary filters */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Dietary Filters
          </h3>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => {
              const active = dietaryFilters.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleDietary(opt.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : "glass text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Format toggle */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Recipe Format
          </h3>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-surface-800/40 border border-surface-500/20">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFormatOption(opt.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  formatOption === opt.key
                    ? "bg-primary-400/15 text-primary-300 border border-primary-400/25"
                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Loading state */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <ChefHat className="w-12 h-12 text-primary-400/50" />
            </motion.div>
            <p className="text-gray-500 mt-4 text-sm">
              Formulating flavor profile...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {flavor && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Generation mode badge */}
            {generationMode && (
              <div className="mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    generationMode === "ai"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                  }`}
                >
                  {generationMode === "ai" ? (
                    <>
                      <Cpu className="w-3.5 h-3.5" /> AI Generated
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Demo Mode
                    </>
                  )}
                </span>
              </div>
            )}

            <TasteVisualizer flavor={flavor} />

            {/* Start over */}
            <div className="text-center mt-8">
              <button onClick={handleStartOver} className="btn-secondary text-sm">
                Formulate Another Flavor
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery */}
      <AnimatePresence>
        {showGallery && !isLoading && !flavor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-gray-300 mb-4">
              Pre-made Flavors
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Explore these flavor formulas or describe your own above
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockFlavors.map((flv, i) => {
                const tp = flv.taste_profile;
                // Dominant taste for color accent
                const tastes = [
                  { key: "sweet", val: tp.sweet, color: "#FF8FA3" },
                  { key: "sour", val: tp.sour, color: "#FFD93D" },
                  { key: "salty", val: tp.salty, color: "#6EC6FF" },
                  { key: "bitter", val: tp.bitter, color: "#82C46C" },
                  { key: "umami", val: tp.umami, color: "#D4A574" },
                ];
                const dominant = tastes.reduce((a, b) =>
                  a.val > b.val ? a : b
                );

                return (
                  <motion.button
                    key={flv.name}
                    onClick={() => handleGalleryClick(flv)}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="card text-left group cursor-pointer hover:shadow-glow"
                  >
                    {/* Mini taste bars */}
                    <div className="flex gap-1 mb-3 h-8 items-end">
                      {tastes.map((t) => (
                        <div
                          key={t.key}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${(t.val / 10) * 100}%`,
                            backgroundColor: t.color,
                            opacity: 0.6,
                            minHeight: "2px",
                          }}
                        />
                      ))}
                    </div>

                    <h3 className="text-sm font-semibold text-gray-200 group-hover:text-primary-400 transition-colors">
                      {flv.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {flv.description}
                    </p>

                    {/* Dominant taste + difficulty */}
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${dominant.color}15`,
                          color: dominant.color,
                          border: `1px solid ${dominant.color}30`,
                        }}
                      >
                        {dominant.key} dominant
                      </span>
                      <span className="text-[10px] text-gray-600 capitalize">
                        {flv.home_recipe.difficulty}
                      </span>
                    </div>

                    {/* Dietary badges */}
                    {flv.food_safety.dietary.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {flv.food_safety.dietary.slice(0, 3).map((d) => (
                          <span
                            key={d}
                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/70"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-700 border border-surface-500 text-gray-300 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
