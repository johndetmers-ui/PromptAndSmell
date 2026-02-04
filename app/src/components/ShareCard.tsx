"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Share2, Download, X } from "lucide-react";
import { OSCFormula } from "@/lib/types";
import { getCategoryColor } from "@/lib/utils";
import { MiniScentWheel } from "./ScentWheel";

interface ShareCardProps {
  formula: OSCFormula;
  onClose?: () => void;
}

export default function ShareCard({ formula, onClose }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const topIngredients = [...formula.ingredients]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/scent/${formula.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    // Create a canvas-based download from the card
    if (!cardRef.current) return;

    // Simple approach: copy as text representation
    const text = `${formula.name}\n"${formula.prompt}"\n\nTop ingredients:\n${topIngredients.map(i => `- ${i.name} (${i.percentage}%)`).join('\n')}\n\nCreated by ${formula.creator}\nPrompt & Smell`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formula.name.toLowerCase().replace(/\s+/g, '-')}-scent.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center hover:bg-surface-600 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {/* The shareable card */}
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden border border-surface-600/30"
          style={{
            background: "linear-gradient(135deg, #12121A 0%, #1A1A2E 50%, #12121A 100%)",
          }}
        >
          {/* Header gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary-400 via-accent-rose to-primary-500" />

          <div className="p-6">
            {/* Logo */}
            <div className="text-xs font-medium text-gray-500 tracking-wider uppercase mb-4">
              Prompt & Smell
            </div>

            {/* Scent name and wheel */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold gradient-text mb-1">
                  {formula.name}
                </h3>
                <p className="text-sm text-gray-400 italic leading-relaxed">
                  &quot;{formula.prompt}&quot;
                </p>
              </div>
              <MiniScentWheel ingredients={formula.ingredients} size={70} />
            </div>

            {/* Top ingredients */}
            <div className="mb-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                Key Notes
              </div>
              <div className="flex gap-2">
                {topIngredients.map((ing) => (
                  <div
                    key={ing.name}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: `${getCategoryColor(ing.category)}15`,
                      border: `1px solid ${getCategoryColor(ing.category)}30`,
                      color: getCategoryColor(ing.category),
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getCategoryColor(ing.category) }}
                    />
                    {ing.name}
                    <span className="text-gray-500">{ing.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-surface-600/30">
              <span>By {formula.creator}</span>
              <div className="flex items-center gap-3">
                {formula.mood.slice(0, 2).map((m) => (
                  <span key={m} className="text-gray-600">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCopyLink}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
