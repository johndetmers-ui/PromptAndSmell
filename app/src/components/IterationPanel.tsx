"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, RotateCcw } from "lucide-react";
import { HistoryEntry } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";

interface IterationPanelProps {
  history: HistoryEntry[];
  currentId: string;
  onRestore: (entry: HistoryEntry) => void;
}

export default function IterationPanel({
  history,
  currentId,
  onRestore,
}: IterationPanelProps) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-semibold text-gray-300">
          Iteration History
        </h3>
        <span className="text-xs text-gray-600 font-mono">
          ({history.length})
        </span>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {history.map((entry, index) => {
          const isCurrent = entry.id === currentId;

          return (
            <motion.div
              key={entry.id}
              className={`relative rounded-lg p-3 transition-all cursor-pointer group ${
                isCurrent
                  ? "glass-strong border-primary-400/30"
                  : "glass hover:glass-hover"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onRestore(entry)}
            >
              {/* Version indicator */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      entry.type === "initial"
                        ? "bg-primary-400/20 text-primary-400"
                        : "bg-surface-500/40 text-gray-400"
                    }`}
                  >
                    {entry.type === "initial" ? "v1.0" : `v${index + 1}.0`}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] text-primary-400 font-medium">
                      Current
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-600">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>

              {/* Prompt text */}
              <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 mb-2">
                &quot;{entry.prompt}&quot;
              </p>

              {/* Formula summary */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {entry.formula.ingredients.slice(0, 3).map((ing) => (
                  <span
                    key={ing.name}
                    className="text-[10px] text-gray-500 bg-surface-700/50 px-1.5 py-0.5 rounded"
                  >
                    {ing.name}
                  </span>
                ))}
                {entry.formula.ingredients.length > 3 && (
                  <span className="text-[10px] text-gray-600">
                    +{entry.formula.ingredients.length - 3} more
                  </span>
                )}
              </div>

              {/* Restore button on hover */}
              {!isCurrent && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <RotateCcw className="w-3.5 h-3.5 text-primary-400" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Change indicators between entries */}
      {history.length > 1 && (
        <div className="pt-2 border-t border-surface-700/30">
          <p className="text-[10px] text-gray-600">
            Click any version to restore it. {history.length} iterations total.
          </p>
        </div>
      )}
    </div>
  );
}
