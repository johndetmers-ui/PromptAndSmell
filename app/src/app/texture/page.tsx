"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, Loader2, Cpu, Play } from "lucide-react";
import TextureVisualizer from "@/components/TextureVisualizer";
import { TextureProfile, mockTextures } from "@/lib/synesthesia/mock-data";

// ---------------------------------------------------------------------------
// Example chips
// ---------------------------------------------------------------------------

const EXAMPLE_PROMPTS = [
  "Warm velvet",
  "Cold steel",
  "Wet sand at sunset",
  "Old leather book",
  "Fresh snow",
  "Liquid mercury",
  "Grandmother's knitted blanket",
  "Polished marble",
];

// ---------------------------------------------------------------------------
// TexturePage
// ---------------------------------------------------------------------------

export default function TexturePage() {
  const [prompt, setPrompt] = useState("");
  const [texture, setTexture] = useState<TextureProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generationMode, setGenerationMode] = useState<"ai" | "demo" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(true);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const handleGenerate = useCallback(
    async (inputPrompt?: string) => {
      const finalPrompt = (inputPrompt || prompt).trim();
      if (!finalPrompt) return;

      setIsLoading(true);
      setShowGallery(false);

      try {
        const res = await fetch("/api/texture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: finalPrompt }),
        });
        const data = await res.json();

        if (data.texture) {
          setTexture(data.texture);
          setGenerationMode(data.demo ? "demo" : "ai");
          if (data.demo) {
            showToast("Running in demo mode -- texture properties are simulated");
          }
        } else {
          throw new Error(data.error || "Failed to generate texture");
        }
      } catch {
        showToast("Could not reach API -- falling back to demo mode");
        // Client-side fallback
        const { getMockTextureForPrompt } = await import(
          "@/lib/synesthesia/mock-data"
        );
        const mock = getMockTextureForPrompt(finalPrompt);
        setTexture({
          ...mock,
          name: finalPrompt
            .split(" ")
            .slice(0, 3)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        });
        setGenerationMode("demo");
      }

      setIsLoading(false);
    },
    [prompt, showToast]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerate();
  };

  const handleChipClick = (chipPrompt: string) => {
    setPrompt(chipPrompt);
    handleGenerate(chipPrompt);
  };

  const handleGalleryClick = (galleryTexture: TextureProfile) => {
    setTexture(galleryTexture);
    setGenerationMode("demo");
    setShowGallery(false);
    setPrompt(galleryTexture.name);
  };

  const handleStartOver = () => {
    setTexture(null);
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
            <Hand className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">TEXTURE</h1>
            <p className="text-gray-500 text-sm">
              Feel any material through your device
            </p>
          </div>
        </div>
      </motion.div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a material or texture..."
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
                Generating
              </>
            ) : (
              <>
                <Hand className="w-4 h-4" />
                Generate
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
              <Hand className="w-12 h-12 text-primary-400/50" />
            </motion.div>
            <p className="text-gray-500 mt-4 text-sm">
              Analyzing material properties...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {texture && !isLoading && (
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

            <TextureVisualizer texture={texture} />

            {/* Start over */}
            <div className="text-center mt-8">
              <button onClick={handleStartOver} className="btn-secondary text-sm">
                Generate Another Texture
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery */}
      <AnimatePresence>
        {showGallery && !isLoading && !texture && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-gray-300 mb-4">
              Pre-made Textures
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Explore these material profiles or generate your own above
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockTextures.map((tex, i) => {
                const pp = tex.physical_properties;
                const normalizedTemp = (pp.temperature + 1) / 2;
                const r = Math.round(60 + 140 * normalizedTemp);
                const g = Math.round(120);
                const b = Math.round(200 - 140 * normalizedTemp);

                return (
                  <motion.button
                    key={tex.name}
                    onClick={() => handleGalleryClick(tex)}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="card text-left group cursor-pointer hover:shadow-glow"
                  >
                    {/* Mini material swatch */}
                    <div
                      className="w-full h-16 rounded-lg mb-3 flex items-center justify-center"
                      style={{
                        background: `radial-gradient(circle at 40% 40%, rgba(${r}, ${g}, ${b}, 0.5), rgba(${r}, ${g}, ${b}, 0.15))`,
                      }}
                    >
                      <span className="text-xs font-mono text-white/40">
                        {pp.roughness > 0.5 ? "ROUGH" : "SMOOTH"}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-200 group-hover:text-primary-400 transition-colors">
                      {tex.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {tex.description}
                    </p>

                    {/* Mini property bars */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 w-12">Rough</span>
                        <div className="flex-1 h-1 rounded-full bg-surface-700/50">
                          <div
                            className="h-full rounded-full bg-primary-400/60"
                            style={{ width: `${pp.roughness * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 w-12">Temp</span>
                        <div className="flex-1 h-1 rounded-full bg-surface-700/50">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${normalizedTemp * 100}%`,
                              backgroundColor:
                                pp.temperature < 0 ? "#6EC6FF" : "#FF6B6B",
                            }}
                          />
                        </div>
                      </div>
                    </div>
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
