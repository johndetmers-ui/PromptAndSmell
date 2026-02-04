"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, X, AlertTriangle, Check, Loader2, ChevronDown } from "lucide-react";
import { OSCFormula } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DispenseStep {
  channel: number;
  ingredient: string;
  volume_ml: number;
  duration_ms: number;
}

interface DispensePlan {
  steps: DispenseStep[];
  skipped?: { ingredient: string; reason: string }[];
  estimated_time_ms: number;
  total_volume_ml: number;
  formula_name: string;
}

type DispenseStatus = "idle" | "loading" | "previewing" | "dispensing" | "complete" | "error";

interface DispenseButtonProps {
  formula: OSCFormula;
}

// ---------------------------------------------------------------------------
// Volume Options
// ---------------------------------------------------------------------------

const VOLUME_OPTIONS = [1, 2, 5, 10] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DispenseButton({ formula }: DispenseButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<DispenseStatus>("idle");
  const [mode, setMode] = useState<"simulate" | "real">("simulate");
  const [volumeMl, setVolumeMl] = useState<number>(5);
  const [plan, setPlan] = useState<DispensePlan | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        if (status !== "dispensing") {
          handleClose();
        }
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, status]);

  // Cleanup progress timer on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setStatus("idle");
    setPlan(null);
    setErrorMessage("");
    setProgress(0);
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setStatus("idle");
    setPlan(null);
    setErrorMessage("");
    setProgress(0);
  }, []);

  // Fetch the dispense plan preview
  const fetchPlan = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    setPlan(null);

    try {
      const res = await fetch("/api/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formula,
          volume_ml: volumeMl,
          simulate: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to generate dispense plan.");
        setStatus("error");
        return;
      }

      setPlan(data.plan);
      setStatus("previewing");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Network error. Could not reach the server."
      );
      setStatus("error");
    }
  }, [formula, volumeMl]);

  // Execute the dispense (simulate or real)
  const handleDispense = useCallback(async () => {
    if (!plan) return;

    setStatus("dispensing");
    setProgress(0);

    // Start a progress timer based on estimated time
    const totalMs = plan.estimated_time_ms || 5000;
    const intervalMs = 100;
    let elapsed = 0;

    progressTimerRef.current = setInterval(() => {
      elapsed += intervalMs;
      const pct = Math.min((elapsed / totalMs) * 100, 95);
      setProgress(pct);
    }, intervalMs);

    try {
      const res = await fetch("/api/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formula,
          volume_ml: volumeMl,
          simulate: mode === "simulate",
        }),
      });

      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Dispense operation failed.");
        setStatus("error");
        setProgress(0);
        return;
      }

      setProgress(100);
      setStatus("complete");
    } catch (err) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setErrorMessage(
        err instanceof Error ? err.message : "Network error during dispense."
      );
      setStatus("error");
      setProgress(0);
    }
  }, [plan, formula, volumeMl, mode]);

  // Format duration for display
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <motion.button
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300",
          "bg-gradient-to-r from-primary-500 to-primary-600 text-surface-900",
          "hover:from-primary-400 hover:to-primary-500",
          "shadow-glow hover:shadow-glow-lg active:scale-[0.97]"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <FlaskConical className="w-4 h-4" />
        Dispense
      </motion.button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              ref={modalRef}
              className="w-full max-w-lg mx-4 rounded-xl border border-surface-600/40 bg-surface-800 shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
                    <FlaskConical className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Dispense Formula</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{formula.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={status === "dispensing"}
                  className="p-1.5 rounded-lg hover:bg-surface-700/50 transition-colors text-gray-500 hover:text-gray-300 disabled:opacity-30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Volume Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Volume
                  </label>
                  <div className="flex gap-2">
                    {VOLUME_OPTIONS.map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setVolumeMl(v);
                          if (status === "previewing" || status === "error") {
                            setStatus("idle");
                            setPlan(null);
                          }
                        }}
                        disabled={status === "dispensing"}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          volumeMl === v
                            ? "bg-primary-500/20 text-primary-300 border border-primary-500/40"
                            : "bg-surface-700/40 text-gray-400 border border-surface-600/30 hover:bg-surface-700/60 hover:text-gray-300"
                        )}
                      >
                        {v} ml
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Toggle */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode("simulate")}
                      disabled={status === "dispensing"}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        mode === "simulate"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : "bg-surface-700/40 text-gray-400 border border-surface-600/30 hover:bg-surface-700/60"
                      )}
                    >
                      Simulate
                    </button>
                    <button
                      onClick={() => setMode("real")}
                      disabled={status === "dispensing"}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        mode === "real"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-surface-700/40 text-gray-400 border border-surface-600/30 hover:bg-surface-700/60"
                      )}
                    >
                      Real
                    </button>
                  </div>
                  {mode === "real" && (
                    <motion.div
                      className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-300/80 leading-relaxed">
                        Real mode will actuate physical pumps. Ensure the hardware is connected
                        and the mixing chamber is in place.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Preview / Load Plan Button */}
                {(status === "idle" || status === "error") && (
                  <button
                    onClick={fetchPlan}
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-surface-700/50 border border-surface-600/30 text-gray-300 hover:bg-surface-700/70 hover:text-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Preview Dispense Plan
                  </button>
                )}

                {/* Loading State */}
                {status === "loading" && (
                  <div className="flex items-center justify-center py-6 gap-3">
                    <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                    <span className="text-sm text-gray-400">Calculating dispense plan...</span>
                  </div>
                )}

                {/* Error State */}
                {status === "error" && errorMessage && (
                  <motion.div
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-xs text-red-400">{errorMessage}</p>
                  </motion.div>
                )}

                {/* Plan Preview Table */}
                {plan && (status === "previewing" || status === "dispensing" || status === "complete") && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Dispense Plan
                      </span>
                      <span className="text-xs text-gray-500">
                        {plan.steps.length} steps -- ~{formatDuration(plan.estimated_time_ms)}
                      </span>
                    </div>

                    <div className="rounded-lg border border-surface-600/30 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-surface-900/60">
                            <th className="text-left px-3 py-2 text-gray-500 font-medium">CH</th>
                            <th className="text-left px-3 py-2 text-gray-500 font-medium">Ingredient</th>
                            <th className="text-right px-3 py-2 text-gray-500 font-medium">Volume</th>
                            <th className="text-right px-3 py-2 text-gray-500 font-medium">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.steps.map((step, i) => (
                            <motion.tr
                              key={`${step.channel}-${step.ingredient}`}
                              className="border-t border-surface-700/20 hover:bg-surface-700/15 transition-colors"
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04, duration: 0.25 }}
                            >
                              <td className="px-3 py-2 text-gray-500 font-mono">{step.channel}</td>
                              <td className="px-3 py-2 text-gray-300">{step.ingredient}</td>
                              <td className="px-3 py-2 text-right text-primary-400 font-mono">
                                {step.volume_ml.toFixed(3)} ml
                              </td>
                              <td className="px-3 py-2 text-right text-gray-400 font-mono">
                                {formatDuration(step.duration_ms)}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-surface-600/40 bg-surface-900/40">
                            <td className="px-3 py-2 text-gray-400 font-medium" colSpan={2}>
                              Total
                            </td>
                            <td className="px-3 py-2 text-right text-primary-300 font-mono font-medium">
                              {plan.steps
                                .reduce((s, st) => s + st.volume_ml, 0)
                                .toFixed(3)}{" "}
                              ml
                            </td>
                            <td className="px-3 py-2 text-right text-gray-400 font-mono font-medium">
                              {formatDuration(plan.estimated_time_ms)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Skipped ingredients */}
                    {plan.skipped && plan.skipped.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">
                          {plan.skipped.length} ingredient{plan.skipped.length > 1 ? "s" : ""} skipped:
                        </p>
                        <div className="space-y-1">
                          {plan.skipped.map((sk) => (
                            <div
                              key={sk.ingredient}
                              className="flex items-center justify-between text-xs px-3 py-1.5 rounded bg-surface-900/40"
                            >
                              <span className="text-gray-500">{sk.ingredient}</span>
                              <span className="text-gray-600 text-[10px]">{sk.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Progress Bar */}
                {status === "dispensing" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
                        {mode === "simulate" ? "Simulating..." : "Dispensing..."}
                      </span>
                      <span className="text-gray-500 font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-700 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Complete State */}
                {status === "complete" && (
                  <motion.div
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-300">
                        {mode === "simulate" ? "Simulation complete" : "Dispense complete"}
                      </p>
                      <p className="text-xs text-green-400/60 mt-0.5">
                        {plan?.steps.length} pump{plan && plan.steps.length !== 1 ? "s" : ""} actuated
                        {plan ? ` -- ${plan.steps.reduce((s, st) => s + st.volume_ml, 0).toFixed(2)} ml total` : ""}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-surface-700/40 flex items-center justify-end gap-3">
                {status !== "dispensing" && (
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-300 hover:bg-surface-700/50 transition-all duration-200"
                  >
                    {status === "complete" ? "Done" : "Cancel"}
                  </button>
                )}

                {status === "previewing" && plan && (
                  <motion.button
                    onClick={handleDispense}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      mode === "simulate"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
                        : "bg-gradient-to-r from-primary-500 to-primary-600 text-surface-900 hover:from-primary-400 hover:to-primary-500 shadow-glow"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FlaskConical className="w-4 h-4" />
                    {mode === "simulate" ? "Run Simulation" : "Confirm Dispense"}
                  </motion.button>
                )}

                {status === "complete" && (
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setPlan(null);
                      setProgress(0);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-700/50 text-gray-300 hover:bg-surface-700/70 transition-all duration-200"
                  >
                    Dispense Again
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
