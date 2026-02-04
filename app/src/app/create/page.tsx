"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, History, ChevronLeft, ChevronRight, Cpu, Play } from "lucide-react";
import PromptInput from "@/components/PromptInput";
import ScentWheel from "@/components/ScentWheel";
import NotePyramid from "@/components/NotePyramid";
import ScentTimeline from "@/components/ScentTimeline";
import FormulaCard from "@/components/FormulaCard";
import IterationPanel from "@/components/IterationPanel";
import { communityScents } from "@/lib/mock-data";
import { OSCFormula, HistoryEntry } from "@/lib/types";
import { generateScentId } from "@/lib/utils";

// Generate a mock formula from a prompt (simulates the API)
function generateMockFormula(prompt: string): OSCFormula {
  // Pick a random base scent and modify it
  const base = communityScents[Math.floor(Math.random() * communityScents.length)];

  // Shuffle ingredients slightly
  const shuffledIngredients = [...base.ingredients]
    .sort(() => Math.random() - 0.5)
    .slice(0, 8 + Math.floor(Math.random() * 4));

  // Normalize percentages to sum to 100
  const rawTotal = shuffledIngredients.reduce((s, i) => s + i.percentage, 0);
  const normalizedIngredients = shuffledIngredients.map((ing, idx) => ({
    ...ing,
    percentage:
      idx === shuffledIngredients.length - 1
        ? Math.round(
            (100 -
              shuffledIngredients
                .slice(0, -1)
                .reduce(
                  (s, i) =>
                    s + Math.round((i.percentage / rawTotal) * 100 * 10) / 10,
                  0
                )) *
              10
          ) / 10
        : Math.round((ing.percentage / rawTotal) * 100 * 10) / 10,
  }));

  // Re-normalize if off due to rounding
  const checkTotal = normalizedIngredients.reduce((s, i) => s + i.percentage, 0);
  if (Math.abs(checkTotal - 100) > 0.2) {
    normalizedIngredients[0].percentage += 100 - checkTotal;
    normalizedIngredients[0].percentage = Math.round(normalizedIngredients[0].percentage * 10) / 10;
  }

  const scentName = prompt.split(" ").slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return {
    ...base,
    id: generateScentId(),
    name: scentName,
    description: `A scent inspired by: "${prompt}"`,
    prompt,
    creator: "You",
    created_at: new Date().toISOString(),
    ingredients: normalizedIngredients,
    evolution: {
      opening: normalizedIngredients
        .filter((i) => i.note_type === "top")
        .slice(0, 3)
        .map((i) => i.name),
      heart: normalizedIngredients
        .filter((i) => i.note_type === "middle")
        .slice(0, 3)
        .map((i) => i.name),
      drydown: normalizedIngredients
        .filter((i) => i.note_type === "base")
        .slice(0, 4)
        .map((i) => i.name),
    },
  };
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-8"><div className="text-gray-500">Loading...</div></div>}>
      <CreatePageInner />
    </Suspense>
  );
}

function CreatePageInner() {
  const searchParams = useSearchParams();
  const [formula, setFormula] = useState<OSCFormula | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIterating, setIsIterating] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [generationMode, setGenerationMode] = useState<"ai" | "demo" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle pre-filled prompt from URL
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt) {
      handleGenerate(prompt);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsLoading(true);

    let newFormula: OSCFormula | null = null;
    let mode: "ai" | "demo" = "demo";

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, intensity: 5 }),
      });
      const data = await res.json();

      if (res.ok && data.formula) {
        // Map API response to OSCFormula type
        newFormula = data.formula as OSCFormula;
        mode = "ai";
      } else if (data.demo) {
        // API explicitly says to use demo mode (e.g. no API key)
        showToast("API key not configured -- using demo mode");
        newFormula = generateMockFormula(prompt);
        mode = "demo";
      } else {
        throw new Error(data.error || "API request failed");
      }
    } catch {
      // Network error or unexpected failure -- fall back to mock
      showToast("Could not reach API -- falling back to demo mode");
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 500));
      newFormula = generateMockFormula(prompt);
      mode = "demo";
    }

    setGenerationMode(mode);
    setFormula(newFormula);
    setHistory([
      {
        id: newFormula.id,
        prompt,
        formula: newFormula,
        timestamp: new Date().toISOString(),
        type: "initial",
      },
    ]);
    setIsLoading(false);
  }, [showToast]);

  const handleIterate = useCallback(
    async (modification: string) => {
      if (!formula) return;
      setIsIterating(true);

      let modifiedFormula: OSCFormula | null = null;
      let mode: "ai" | "demo" = "demo";

      try {
        const res = await fetch("/api/iterate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modification, current_formula: formula }),
        });
        const data = await res.json();

        if (res.ok && data.formula) {
          modifiedFormula = data.formula as OSCFormula;
          mode = "ai";
        } else if (data.demo) {
          showToast("API key not configured -- using demo mode");
          modifiedFormula = generateMockFormula(`${formula.prompt} -- ${modification}`);
          modifiedFormula.name = formula.name;
          mode = "demo";
        } else {
          throw new Error(data.error || "API request failed");
        }
      } catch {
        showToast("Could not reach API -- falling back to demo mode");
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
        modifiedFormula = generateMockFormula(`${formula.prompt} -- ${modification}`);
        modifiedFormula.name = formula.name;
        mode = "demo";
      }

      setGenerationMode(mode);
      setFormula(modifiedFormula);
      setHistory((prev) => [
        ...prev,
        {
          id: modifiedFormula!.id,
          prompt: modification,
          formula: modifiedFormula!,
          timestamp: new Date().toISOString(),
          type: "iteration",
        },
      ]);
      setIsIterating(false);
    },
    [formula, showToast]
  );

  const handleRestore = useCallback((entry: HistoryEntry) => {
    setFormula(entry.formula);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Scent Creator
        </h1>
        <p className="text-gray-500">
          Describe a memory, a place, or a feeling. We will compose a
          fragrance formula.
        </p>
      </motion.div>

      {/* Main input area */}
      {!formula && (
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PromptInput
            onSubmit={handleGenerate}
            isLoading={isLoading}
            mode="create"
          />
        </motion.div>
      )}

      {/* Result area */}
      <AnimatePresence>
        {formula && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex gap-6">
              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-8">
                {/* Scent header */}
                <div className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-gray-100">
                          {formula.name}
                        </h2>
                        {generationMode && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              generationMode === "ai"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                            }`}
                          >
                            {generationMode === "ai" ? (
                              <><Cpu className="w-3 h-3" /> AI</>
                            ) : (
                              <><Play className="w-3 h-3" /> Demo</>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 italic">
                        &quot;{formula.prompt}&quot;
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="capitalize">
                        {formula.sillage} sillage
                      </span>
                      <span className="text-surface-600">|</span>
                      <span>{formula.longevity_hours}h longevity</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {formula.mood.map((m) => (
                      <span
                        key={m}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary-400/10 text-primary-400"
                      >
                        {m}
                      </span>
                    ))}
                    {formula.season.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-surface-500/40 text-gray-500"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Iteration input */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    Refine Your Scent
                  </h3>
                  <PromptInput
                    onSubmit={handleIterate}
                    isLoading={isIterating}
                    mode="iterate"
                    placeholder="Make it smokier, less floral, add vanilla..."
                  />
                </div>

                {/* Visualizations grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Scent Wheel */}
                  <div className="card flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 self-start">
                      Scent Wheel
                    </h3>
                    <ScentWheel
                      ingredients={formula.ingredients}
                      name={formula.name}
                      size={280}
                    />
                  </div>

                  {/* Note Pyramid */}
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">
                      Note Pyramid
                    </h3>
                    <NotePyramid ingredients={formula.ingredients} />
                  </div>
                </div>

                {/* Timeline */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-300 mb-6">
                    Scent Evolution
                  </h3>
                  <ScentTimeline
                    evolution={formula.evolution}
                    ingredients={formula.ingredients}
                  />
                </div>

                {/* Formula Card */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">
                    Complete Formula
                  </h3>
                  <FormulaCard formula={formula} showOSC={true} />
                </div>

                {/* Start over */}
                <div className="text-center pt-4">
                  <button
                    onClick={() => {
                      setFormula(null);
                      setHistory([]);
                      setGenerationMode(null);
                    }}
                    className="btn-secondary text-sm"
                  >
                    Start Over With New Prompt
                  </button>
                </div>
              </div>

              {/* History sidebar */}
              <div className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-24">
                  <div className="card">
                    <IterationPanel
                      history={history}
                      currentId={formula.id}
                      onRestore={handleRestore}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile history toggle */}
            <div className="lg:hidden mt-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
              >
                <History className="w-4 h-4" />
                {showHistory ? "Hide" : "Show"} History ({history.length})
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    className="mt-4 card"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <IterationPanel
                      history={history}
                      currentId={formula.id}
                      onRestore={handleRestore}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notification */}
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
