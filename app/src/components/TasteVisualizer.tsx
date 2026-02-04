"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
  Droplets,
  Sparkles,
  Flame,
  Cherry,
  Clock,
  AlertTriangle,
  ChefHat,
  FlaskConical,
  ShoppingCart,
  Leaf,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { FlavorFormula } from "@/lib/synesthesia/mock-data";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TasteVisualizerProps {
  flavor: FlavorFormula;
}

// ---------------------------------------------------------------------------
// Taste axis metadata
// ---------------------------------------------------------------------------

const TASTE_META: Record<string, { label: string; color: string }> = {
  sweet: { label: "Sweet", color: "#FF8FA3" },
  sour: { label: "Sour", color: "#FFD93D" },
  salty: { label: "Salty", color: "#6EC6FF" },
  bitter: { label: "Bitter", color: "#82C46C" },
  umami: { label: "Umami", color: "#D4A574" },
};

const TASTE_KEYS = ["sweet", "sour", "salty", "bitter", "umami"] as const;

// ---------------------------------------------------------------------------
// Flavor Radar Chart (5-axis)
// ---------------------------------------------------------------------------

function FlavorRadarChart({
  tasteProfile,
  size = 280,
}: {
  tasteProfile: Record<string, number>;
  size?: number;
}) {
  const center = size / 2;
  const maxRadius = size / 2 - 45;
  const angleStep = (2 * Math.PI) / TASTE_KEYS.length;

  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getPolygonPoints = (valuesFn: (key: string) => number) => {
    return TASTE_KEYS.map((key, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (valuesFn(key) / 10) * maxRadius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(" ");
  };

  const dataPoints = getPolygonPoints((key) => tasteProfile[key] ?? 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="flavorRadarGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8FA3" stopOpacity={0.2} />
          <stop offset="50%" stopColor="#D4A574" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#FFD93D" stopOpacity={0.2} />
        </linearGradient>
      </defs>

      {/* Grid levels */}
      {levels.map((level) => (
        <polygon
          key={level}
          points={TASTE_KEYS.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r = level * maxRadius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {TASTE_KEYS.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={center + maxRadius * Math.cos(angle)}
            y2={center + maxRadius * Math.sin(angle)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Data polygon */}
      <motion.polygon
        points={dataPoints}
        fill="url(#flavorRadarGrad)"
        stroke="#D4A574"
        strokeWidth={1.5}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      />

      {/* Data points */}
      {TASTE_KEYS.map((key, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const value = tasteProfile[key] ?? 0;
        const r = (value / 10) * maxRadius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const meta = TASTE_META[key];

        return (
          <motion.circle
            key={`point-${i}`}
            cx={x}
            cy={y}
            r={4}
            fill={meta.color}
            stroke="#0A0A0F"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
          />
        );
      })}

      {/* Labels */}
      {TASTE_KEYS.map((key, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = maxRadius + 30;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        const meta = TASTE_META[key];
        const value = tasteProfile[key] ?? 0;

        return (
          <motion.g
            key={`label-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
          >
            <text
              x={x}
              y={y - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={meta.color}
              fontSize={11}
              fontWeight={600}
            >
              {meta.label}
            </text>
            <text
              x={x}
              y={y + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6B7280"
              fontSize={10}
              fontFamily="monospace"
            >
              {value}/10
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mouthfeel Panel
// ---------------------------------------------------------------------------

function MouthfeelPanel({ mouthfeel }: { mouthfeel: FlavorFormula["mouthfeel"] }) {
  const items = [
    {
      icon: Thermometer,
      label: "Temperature",
      value: mouthfeel.temperature,
      type: "text" as const,
      color: "#FF6B6B",
    },
    {
      icon: Droplets,
      label: "Viscosity",
      value: mouthfeel.viscosity,
      type: "text" as const,
      color: "#6EC6FF",
    },
    {
      icon: Sparkles,
      label: "Carbonation",
      value: mouthfeel.carbonation,
      type: "bar" as const,
      color: "#FFD93D",
    },
    {
      icon: Cherry,
      label: "Astringency",
      value: mouthfeel.astringency,
      type: "bar" as const,
      color: "#C9B1FF",
    },
    {
      icon: Flame,
      label: "Spiciness",
      value: mouthfeel.spiciness,
      type: "bar" as const,
      color: "#FF4444",
    },
  ];

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.06 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}
          >
            <item.icon className="w-4 h-4" style={{ color: item.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-300">
                {item.label}
              </span>
              {item.type === "bar" ? (
                <span className="text-xs font-mono text-gray-500">
                  {item.value}/10
                </span>
              ) : (
                <span className="text-xs text-gray-400 capitalize truncate ml-2">
                  {item.value as string}
                </span>
              )}
            </div>
            {item.type === "bar" && (
              <div className="h-1.5 rounded-full bg-surface-700/50 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${((item.value as number) / 10) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.06 }}
                />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recipe Card (Tabbed)
// ---------------------------------------------------------------------------

function RecipeCard({ flavor }: { flavor: FlavorFormula }) {
  const [tab, setTab] = useState<"home" | "molecular">("home");
  const recipe = flavor.home_recipe;
  const molecular = flavor.molecular_formula;

  const difficultyColors: Record<string, string> = {
    easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    advanced: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 p-1 rounded-lg bg-surface-800/40 border border-surface-500/20 mb-4">
        <button
          onClick={() => setTab("home")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "home"
              ? "bg-primary-400/15 text-primary-300 border border-primary-400/25"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <ChefHat className="w-4 h-4" />
          Home Recipe
        </button>
        <button
          onClick={() => setTab("molecular")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "molecular"
              ? "bg-primary-400/15 text-primary-300 border border-primary-400/25"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          Molecular Formula
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Recipe meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  difficultyColors[recipe.difficulty] || difficultyColors.medium
                }`}
              >
                {recipe.difficulty}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.time_minutes} min
              </span>
              <span className="text-xs text-gray-500">
                Yield: {recipe.yield}
              </span>
            </div>

            {/* Ingredients */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Ingredients
              </h4>
              <div className="space-y-1.5">
                {recipe.ingredients.map((ing, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-baseline gap-2 text-sm"
                  >
                    <span className="text-primary-400 font-mono text-xs min-w-[60px] text-right">
                      {ing.amount} {ing.unit}
                    </span>
                    <span className="text-gray-200">{ing.name}</span>
                    {ing.notes && (
                      <span className="text-xs text-gray-600 italic">
                        ({ing.notes})
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Instructions
              </h4>
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="flex gap-3 text-sm text-gray-300 leading-relaxed"
                  >
                    <span className="text-primary-400 font-mono text-xs mt-0.5 flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="molecular"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Solvent */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Solvent / Base
              </h4>
              <p className="text-sm text-gray-300">{molecular.solvent}</p>
            </div>

            {/* Compounds table */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Compounds
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-600/30">
                      <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-3">
                        Compound
                      </th>
                      <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-3">
                        CAS
                      </th>
                      <th className="text-right text-xs text-gray-500 font-medium pb-2 pr-3">
                        ppm
                      </th>
                      <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-3">
                        Function
                      </th>
                      <th className="text-center text-xs text-gray-500 font-medium pb-2">
                        Food Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {molecular.compounds.map((compound, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-surface-700/20"
                      >
                        <td className="py-2 pr-3 text-gray-200 font-medium">
                          {compound.name}
                        </td>
                        <td className="py-2 pr-3 text-gray-500 font-mono text-xs">
                          {compound.cas_number}
                        </td>
                        <td className="py-2 pr-3 text-right text-primary-400 font-mono text-xs">
                          {compound.concentration_ppm}
                        </td>
                        <td className="py-2 pr-3 text-gray-400 text-xs">
                          {compound.function}
                        </td>
                        <td className="py-2 text-center">
                          {compound.food_grade ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preparation */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Preparation
              </h4>
              <ol className="space-y-2">
                {molecular.preparation.map((step, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="flex gap-3 text-sm text-gray-300 leading-relaxed"
                  >
                    <span className="text-primary-400 font-mono text-xs mt-0.5 flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TasteVisualizer({ flavor }: TasteVisualizerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">{flavor.name}</h2>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed max-w-lg">
          {flavor.description}
        </p>
      </div>

      {/* Radar + Mouthfeel */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Flavor Radar */}
        <div className="card flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 self-start">
            Flavor Profile
          </h3>
          <FlavorRadarChart
            tasteProfile={flavor.taste_profile as unknown as Record<string, number>}
            size={280}
          />
        </div>

        {/* Mouthfeel */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Mouthfeel
          </h3>
          <MouthfeelPanel mouthfeel={flavor.mouthfeel} />
        </div>
      </div>

      {/* Aroma Contribution */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Aroma Contribution
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          Scent notes that contribute to the overall flavor perception via retronasal olfaction
        </p>
        <div className="flex flex-wrap gap-2">
          {flavor.aroma_contribution.map((aroma, i) => (
            <motion.span
              key={aroma}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              className="text-sm px-3 py-1.5 rounded-full glass text-gray-300 hover:glass-hover transition-all cursor-default"
            >
              {aroma}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Recipe Card */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Recipe
        </h3>
        <RecipeCard flavor={flavor} />
      </div>

      {/* Pairing Suggestions */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Pairing Suggestions
        </h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {flavor.pairing_suggestions.map((suggestion, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center gap-2 text-sm text-gray-300 py-1.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
              {suggestion}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Safety Section */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Food Safety
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Allergens */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Allergens
            </h4>
            {flavor.food_safety.allergens.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {flavor.food_safety.allergens.map((allergen) => (
                  <span
                    key={allergen}
                    className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    {allergen}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-emerald-400">No known allergens</span>
            )}
          </div>

          {/* Dietary */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Dietary
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {flavor.food_safety.dietary.map((diet) => (
                <span
                  key={diet}
                  className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"
                >
                  <Leaf className="w-3 h-3" />
                  {diet}
                </span>
              ))}
            </div>
          </div>

          {/* Shelf life */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Shelf Life
            </h4>
            <span className="text-sm text-gray-300">
              {flavor.food_safety.shelf_life}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <motion.button
          className="btn-primary flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ChefHat className="w-5 h-5" />
          Cook This
        </motion.button>
        <motion.button
          className="btn-secondary flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ShoppingCart className="w-5 h-5" />
          Order Ingredients
        </motion.button>
      </div>
    </motion.div>
  );
}
