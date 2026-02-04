"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { OSCFormula, Ingredient } from "@/lib/types";
import { getCategoryColor, formatPercentage } from "@/lib/utils";

interface FormulaCardProps {
  formula: OSCFormula;
  showOSC?: boolean;
}

export default function FormulaCard({ formula, showOSC = true }: FormulaCardProps) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const sortedIngredients = [...formula.ingredients].sort(
    (a, b) => b.percentage - a.percentage
  );

  const totalPercentage = formula.ingredients.reduce(
    (sum, i) => sum + i.percentage,
    0
  );

  const oscJson = JSON.stringify(
    {
      osc_version: formula.version,
      id: formula.id,
      name: formula.name,
      prompt: formula.prompt,
      ingredients: formula.ingredients.map((i) => ({
        name: i.name,
        cas_number: i.cas_number,
        category: i.category,
        note_type: i.note_type,
        percentage: i.percentage,
        intensity: i.intensity,
      })),
      evolution: formula.evolution,
      accords: formula.accords,
      metadata: {
        intensity: formula.intensity,
        longevity_hours: formula.longevity_hours,
        sillage: formula.sillage,
        mood: formula.mood,
        season: formula.season,
      },
    },
    null,
    2
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(oscJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const noteTypeLabel = (nt: string) => {
    switch (nt) {
      case "top":
        return "Top";
      case "middle":
        return "Heart";
      case "base":
        return "Base";
      default:
        return nt;
    }
  };

  return (
    <div className="space-y-4">
      {/* Formula Table */}
      <div className="overflow-hidden rounded-lg border border-surface-600/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-800/80">
              <th className="text-left px-4 py-2.5 text-gray-400 font-medium text-xs uppercase tracking-wider">
                Ingredient
              </th>
              <th className="text-left px-4 py-2.5 text-gray-400 font-medium text-xs uppercase tracking-wider">
                Category
              </th>
              <th className="text-left px-4 py-2.5 text-gray-400 font-medium text-xs uppercase tracking-wider">
                Note
              </th>
              <th className="text-right px-4 py-2.5 text-gray-400 font-medium text-xs uppercase tracking-wider">
                %
              </th>
              <th className="text-right px-4 py-2.5 text-gray-400 font-medium text-xs uppercase tracking-wider">
                Intensity
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedIngredients.map((ingredient, i) => (
              <motion.tr
                key={ingredient.name}
                className="border-t border-surface-700/30 hover:bg-surface-700/20 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: getCategoryColor(ingredient.category),
                      }}
                    />
                    <span className="text-gray-200 font-medium">
                      {ingredient.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className="text-xs capitalize px-2 py-0.5 rounded"
                    style={{
                      color: getCategoryColor(ingredient.category),
                      backgroundColor: `${getCategoryColor(ingredient.category)}15`,
                    }}
                  >
                    {ingredient.category}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">
                  {noteTypeLabel(ingredient.note_type)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-primary-400">
                  {formatPercentage(ingredient.percentage)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-surface-700 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: getCategoryColor(ingredient.category),
                        }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(ingredient.intensity / 10) * 100}%`,
                        }}
                        transition={{ delay: 0.3 + i * 0.03, duration: 0.4 }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs w-4 text-right">
                      {ingredient.intensity}
                    </span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-surface-600/50 bg-surface-800/50">
              <td className="px-4 py-2.5 text-gray-300 font-semibold" colSpan={3}>
                Total
              </td>
              <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary-300">
                {formatPercentage(totalPercentage)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* OSC JSON Output */}
      {showOSC && (
        <div>
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-400 transition-colors mb-2"
          >
            {showCode ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span className="font-mono">OSC Formula JSON</span>
          </button>

          {showCode && (
            <motion.div
              className="relative"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 rounded-lg glass hover:glass-hover transition-all z-10"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <pre className="bg-surface-900 border border-surface-600/30 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-300 max-h-96 overflow-y-auto">
                <code>{oscJson}</code>
              </pre>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
