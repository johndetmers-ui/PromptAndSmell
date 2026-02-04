"use client";

import React from "react";
import { motion } from "framer-motion";
import { Evolution, Ingredient } from "@/lib/types";
import { getCategoryColor } from "@/lib/utils";

interface ScentTimelineProps {
  evolution: Evolution;
  ingredients: Ingredient[];
}

export default function ScentTimeline({ evolution, ingredients }: ScentTimelineProps) {
  const ingredientMap = new Map(ingredients.map((i) => [i.name, i]));

  const phases = [
    {
      label: "Opening",
      time: "0 - 30 min",
      names: evolution.opening,
      gradient: "from-primary-400/20 to-primary-500/10",
      dotColor: "#FFD93D",
    },
    {
      label: "Heart",
      time: "30 min - 2 hr",
      names: evolution.heart,
      gradient: "from-primary-500/10 to-accent-rose/10",
      dotColor: "#FF6B9D",
    },
    {
      label: "Drydown",
      time: "2+ hours",
      names: evolution.drydown,
      gradient: "from-accent-rose/10 to-surface-700/20",
      dotColor: "#8B6914",
    },
  ];

  return (
    <div className="relative">
      {/* Horizontal timeline bar */}
      <div className="relative h-2 rounded-full overflow-hidden mb-8 bg-surface-700">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-400 via-accent-rose to-surface-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ transformOrigin: "left" }}
        />
      </div>

      {/* Phase markers on timeline */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-4 -mt-1">
        {phases.map((phase, i) => (
          <motion.div
            key={phase.label}
            className="w-4 h-4 rounded-full border-2 border-surface-900"
            style={{ backgroundColor: phase.dotColor }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.3, duration: 0.3 }}
          />
        ))}
      </div>

      {/* Phase content */}
      <div className="grid grid-cols-3 gap-4 mt-2">
        {phases.map((phase, phaseIndex) => (
          <motion.div
            key={phase.label}
            className="text-center"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + phaseIndex * 0.2, duration: 0.4 }}
          >
            <div className="mb-2">
              <div className="text-sm font-semibold text-gray-200">{phase.label}</div>
              <div className="text-[10px] text-gray-500 font-mono">{phase.time}</div>
            </div>

            <div className={`rounded-lg p-3 bg-gradient-to-b ${phase.gradient} border border-surface-600/20`}>
              <div className="flex flex-wrap justify-center gap-1.5">
                {phase.names.map((ingredientName, i) => {
                  const ing = ingredientMap.get(ingredientName);
                  const color = ing
                    ? getCategoryColor(ing.category)
                    : "#888888";

                  return (
                    <motion.div
                      key={ingredientName}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                      style={{
                        backgroundColor: `${color}15`,
                        border: `1px solid ${color}30`,
                        color: color,
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.6 + phaseIndex * 0.2 + i * 0.06,
                        duration: 0.25,
                      }}
                    >
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      {ingredientName}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Flow arrows */}
      <div className="flex justify-center gap-2 mt-4">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="text-gray-600 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 + i * 0.2 }}
          >
            {"-->"}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
