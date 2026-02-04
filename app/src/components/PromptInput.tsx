"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, SendHorizontal } from "lucide-react";
import { examplePrompts } from "@/lib/mock-data";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  mode?: "create" | "iterate";
  placeholder?: string;
}

export default function PromptInput({
  onSubmit,
  isLoading,
  mode = "create",
  placeholder,
}: PromptInputProps) {
  const [value, setValue] = useState("");
  const maxChars = mode === "create" ? 500 : 200;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      if (mode === "iterate") setValue("");
    }
  };

  const handleChipClick = (prompt: string) => {
    setValue(prompt);
  };

  const defaultPlaceholder =
    mode === "create"
      ? "Describe your scent... What memory, place, or feeling do you want to capture?"
      : "Refine: e.g. 'Make it smokier' or 'Less sweet, more citrus'";

  if (mode === "iterate") {
    return (
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder || defaultPlaceholder}
              maxLength={maxChars}
              className="input-field pr-10 text-sm"
              disabled={isLoading}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono">
              {value.length}/{maxChars}
            </span>
          </div>
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="btn-primary px-4 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SendHorizontal className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, maxChars))}
          placeholder={placeholder || defaultPlaceholder}
          rows={4}
          className="w-full bg-surface-800/30 border border-surface-500/30 rounded-xl px-5 py-4
            text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-400/50
            focus:ring-2 focus:ring-primary-400/20 transition-all duration-300 resize-none
            text-lg leading-relaxed glass"
          disabled={isLoading}
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          <span className="text-xs text-gray-600 font-mono">
            {value.length}/{maxChars}
          </span>
        </div>
      </div>

      {/* Example prompt chips */}
      <div className="flex flex-wrap gap-2">
        {examplePrompts.slice(0, 6).map((prompt) => (
          <motion.button
            key={prompt}
            type="button"
            onClick={() => handleChipClick(prompt)}
            className="chip text-xs text-gray-400 hover:text-primary-300"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {prompt}
          </motion.button>
        ))}
      </div>

      {/* Generate button */}
      <motion.button
        type="submit"
        disabled={!value.trim() || isLoading}
        className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3
          disabled:opacity-40 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Composing your scent...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate Scent</span>
          </>
        )}
      </motion.button>
    </form>
  );
}
