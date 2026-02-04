"use client";

import React from "react";
import { motion } from "framer-motion";
import { Ingredient } from "@/lib/types";
import { getCategoryColor, groupByNoteType } from "@/lib/utils";

interface NotePyramidProps {
  ingredients: Ingredient[];
}

function IngredientPill({ ingredient, delay }: { ingredient: Ingredient; delay: number }) {
  return (
    <motion.span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${getCategoryColor(ingredient.category)}20`,
        border: `1px solid ${getCategoryColor(ingredient.category)}40`,
        color: getCategoryColor(ingredient.category),
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: getCategoryColor(ingredient.category) }}
      />
      {ingredient.name}
      <span className="text-gray-500 text-[10px]">{ingredient.percentage}%</span>
    </motion.span>
  );
}

export default function NotePyramid({ ingredients }: NotePyramidProps) {
  const grouped = groupByNoteType(ingredients);

  const tiers = [
    { label: "Top Notes", sublabel: "First impression (0-30 min)", notes: grouped.top, icon: "^" },
    { label: "Heart Notes", sublabel: "Character (30 min - 2 hr)", notes: grouped.middle, icon: "-" },
    { label: "Base Notes", sublabel: "Foundation (2+ hours)", notes: grouped.base, icon: "v" },
  ];

  return (
    <div className="relative">
      {/* Pyramid shape background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-5"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
      >
        <polygon
          points="200,10 380,290 20,290"
          fill="none"
          stroke="#D4A574"
          strokeWidth="1"
        />
        <line x1="60" y1="120" x2="340" y2="120" stroke="#D4A574" strokeWidth="0.5" strokeDasharray="4,4" />
        <line x1="40" y1="200" x2="360" y2="200" stroke="#D4A574" strokeWidth="0.5" strokeDasharray="4,4" />
      </svg>

      <div className="relative space-y-6 py-4">
        {tiers.map((tier, tierIndex) => (
          <motion.div
            key={tier.label}
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (2 - tierIndex) * 0.2, duration: 0.5 }}
          >
            <div className="mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-400">
                {tier.label}
              </span>
              <span className="text-[10px] text-gray-500 ml-2">
                {tier.sublabel}
              </span>
            </div>

            <div
              className="flex flex-wrap justify-center gap-2"
              style={{
                maxWidth: `${60 + tierIndex * 20}%`,
                margin: "0 auto",
              }}
            >
              {tier.notes.length > 0 ? (
                tier.notes
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((ing, i) => (
                    <IngredientPill
                      key={ing.name}
                      ingredient={ing}
                      delay={(2 - tierIndex) * 0.2 + i * 0.08}
                    />
                  ))
              ) : (
                <span className="text-xs text-gray-600 italic">No notes in this tier</span>
              )}
            </div>

            {tierIndex < tiers.length - 1 && (
              <div className="mt-4 border-b border-surface-600/30 mx-auto" style={{ width: `${50 + tierIndex * 15}%` }} />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
