"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Shuffle,
  Share2,
  Download,
  Copy,
  Check,
} from "lucide-react";
import ScentWheel from "@/components/ScentWheel";
import NotePyramid from "@/components/NotePyramid";
import ScentTimeline from "@/components/ScentTimeline";
import FormulaCard from "@/components/FormulaCard";
import ShareCard from "@/components/ShareCard";
import { MiniScentWheel } from "@/components/ScentWheel";
import { communityScents, scentCards } from "@/lib/mock-data";
import { getCategoryColor } from "@/lib/utils";

export default function ScentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showShare, setShowShare] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const formula = communityScents.find((s) => s.id === params.id);

  if (!formula) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-300 mb-4">
          Scent Not Found
        </h2>
        <p className="text-gray-500 mb-6">
          This scent formula could not be found.
        </p>
        <Link href="/gallery" className="btn-primary">
          Back to Gallery
        </Link>
      </div>
    );
  }

  const relatedScents = communityScents
    .filter((s) => s.id !== formula.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const handleDownloadOSC = () => {
    const oscData = JSON.stringify(
      {
        osc_version: formula.version,
        id: formula.id,
        name: formula.name,
        prompt: formula.prompt,
        ingredients: formula.ingredients,
        evolution: formula.evolution,
        accords: formula.accords,
        metadata: {
          intensity: formula.intensity,
          longevity_hours: formula.longevity_hours,
          sillage: formula.sillage,
          mood: formula.mood,
          season: formula.season,
        },
        safety: formula.safety,
      },
      null,
      2
    );

    const blob = new Blob([oscData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formula.name.toLowerCase().replace(/\s+/g, "-")}.osc.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Back navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </motion.div>

      {/* Header */}
      <motion.div
        className="card mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
              {formula.name}
            </h1>
            <p className="text-gray-400 italic mb-4">
              &quot;{formula.prompt}&quot;
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              {formula.description}
            </p>

            {/* Creator */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center text-xs font-bold text-primary-400">
                {formula.creator.charAt(0)}
              </div>
              <div>
                <span className="text-sm text-gray-300 font-medium">
                  {formula.creator}
                </span>
                <span className="text-xs text-gray-600 ml-2">
                  {new Date(formula.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {formula.mood.map((m) => (
                <span
                  key={m}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary-400/10 text-primary-400"
                >
                  {m}
                </span>
              ))}
              {formula.season.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded-full bg-surface-500/40 text-gray-400"
                >
                  {s}
                </span>
              ))}
              {formula.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2.5 py-1 rounded-full bg-surface-600/40 text-gray-500"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>
                Intensity:{" "}
                <span className="text-primary-400 font-medium">
                  {formula.intensity}/10
                </span>
              </span>
              <span>
                Longevity:{" "}
                <span className="text-primary-400 font-medium">
                  {formula.longevity_hours}h
                </span>
              </span>
              <span>
                Sillage:{" "}
                <span className="text-primary-400 font-medium capitalize">
                  {formula.sillage}
                </span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex md:flex-col gap-3">
            <button
              onClick={() => setLiked(!liked)}
              className={`btn-secondary flex items-center gap-2 text-sm ${
                liked ? "text-red-400 border-red-400/30" : ""
              }`}
            >
              <Heart
                className={`w-4 h-4 ${liked ? "fill-red-400" : ""}`}
              />
              {liked ? "Liked" : "Like"}
            </button>
            <Link
              href={`/create?prompt=${encodeURIComponent(formula.prompt)}`}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Shuffle className="w-4 h-4" />
              Remix
            </Link>
            <button
              onClick={() => setShowShare(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={handleDownloadOSC}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              OSC JSON
            </button>
          </div>
        </div>
      </motion.div>

      {/* Visualizations */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          className="card flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-semibold text-gray-300 mb-4 self-start">
            Scent Composition
          </h3>
          <ScentWheel
            ingredients={formula.ingredients}
            name={formula.name}
            size={300}
          />
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Note Pyramid
          </h3>
          <NotePyramid ingredients={formula.ingredients} />
        </motion.div>
      </div>

      {/* Timeline */}
      <motion.div
        className="card mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-6">
          Scent Evolution
        </h3>
        <ScentTimeline
          evolution={formula.evolution}
          ingredients={formula.ingredients}
        />
      </motion.div>

      {/* Formula table */}
      <motion.div
        className="card mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Complete Formula
        </h3>
        <FormulaCard formula={formula} showOSC={true} />
      </motion.div>

      {/* Accords */}
      {formula.accords.length > 0 && (
        <motion.div
          className="card mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Detected Accords
          </h3>
          <div className="space-y-3">
            {formula.accords.map((accord) => (
              <div key={accord.name} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-300">
                  {accord.name}
                </div>
                <div className="flex-1 h-2 rounded-full bg-surface-700 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-warm"
                    initial={{ width: 0 }}
                    animate={{ width: `${accord.strength}%` }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  />
                </div>
                <div className="text-xs text-gray-500 font-mono w-10 text-right">
                  {accord.strength}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Safety info */}
      <motion.div
        className="card mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Safety Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">IFRA Compliance:</span>{" "}
            <span className={formula.safety.ifra_compliance ? "text-green-400" : "text-red-400"}>
              {formula.safety.ifra_compliance ? "Compliant" : "Non-compliant"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Max Skin Concentration:</span>{" "}
            <span className="text-gray-300">
              {formula.safety.max_skin_concentration}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">Known Allergens:</span>{" "}
            <span className="text-gray-300">
              {formula.safety.allergens.join(", ") || "None"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Notes:</span>{" "}
            <span className="text-gray-300">{formula.safety.notes}</span>
          </div>
        </div>
      </motion.div>

      {/* Related scents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="section-heading text-xl mb-6">
          Related Scents
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {relatedScents.map((related) => (
            <Link key={related.id} href={`/scent/${related.id}`}>
              <div className="card group cursor-pointer hover:shadow-glow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <h4 className="font-semibold text-gray-200 group-hover:text-primary-400 transition-colors truncate">
                      {related.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      by {related.creator}
                    </p>
                  </div>
                  <MiniScentWheel
                    ingredients={related.ingredients}
                    size={40}
                  />
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {related.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && (
          <ShareCard
            formula={formula}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
