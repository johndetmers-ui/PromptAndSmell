"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FlaskConical,
  Heart,
  Shuffle,
  Calendar,
  BookmarkCheck,
} from "lucide-react";
import { mockUserProfile, scentCards } from "@/lib/mock-data";
import { MiniScentWheel } from "@/components/ScentWheel";
import RadarChart from "@/components/RadarChart";

type Tab = "created" | "saved";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("created");
  const profile = mockUserProfile;

  const displayedScents =
    activeTab === "created" ? profile.created_scents : profile.saved_scents;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Profile header */}
      <motion.div
        className="card mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-2xl font-bold text-surface-900 flex-shrink-0">
            {profile.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-100 mb-1">
              {profile.name}
            </h1>
            <p className="text-sm text-gray-500 mb-3">
              @{profile.username}
            </p>
            <p className="text-sm text-gray-400 leading-relaxed mb-4 max-w-lg">
              {profile.bio}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>
                Joined{" "}
                {new Date(profile.joined_date).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">
                {profile.stats.scents_created}
              </div>
              <div className="text-xs text-gray-500 mt-1">Scents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">
                {profile.stats.total_likes.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">
                {profile.stats.total_remixes}
              </div>
              <div className="text-xs text-gray-500 mt-1">Remixes</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Scent Genome */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card sticky top-24">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Scent Genome
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Your olfactory preference profile based on scents you
              create and save.
            </p>
            <div className="flex justify-center">
              <RadarChart genome={profile.scent_genome} size={280} />
            </div>

            {/* Top preferences */}
            <div className="mt-4 space-y-2">
              <div className="text-xs text-gray-500 font-medium mb-2">
                Top Affinities
              </div>
              {Object.entries(profile.scent_genome)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 capitalize w-16">
                      {key}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-mono w-8 text-right">
                      {value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>

        {/* Right: Scent collections */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-surface-800/50 rounded-lg inline-flex">
            <button
              onClick={() => setActiveTab("created")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                activeTab === "created"
                  ? "bg-surface-600/80 text-primary-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              My Scents ({profile.created_scents.length})
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                activeTab === "saved"
                  ? "bg-surface-600/80 text-primary-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Saved ({profile.saved_scents.length})
            </button>
          </div>

          {/* Scent grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {displayedScents.map((scent, i) => (
              <motion.div
                key={scent.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/scent/${scent.id}`}>
                  <div className="card group cursor-pointer hover:shadow-glow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-3">
                        <h4 className="font-semibold text-gray-200 group-hover:text-primary-400 transition-colors truncate">
                          {scent.name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {activeTab === "saved"
                            ? `by ${scent.creator}`
                            : new Date(scent.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <MiniScentWheel
                        ingredients={scent.ingredients}
                        size={40}
                      />
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                      {scent.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {scent.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shuffle className="w-3 h-3" />
                          {scent.remixes}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {scent.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-surface-600/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {displayedScents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {activeTab === "created"
                  ? "You haven't created any scents yet."
                  : "You haven't saved any scents yet."}
              </p>
              <Link
                href={activeTab === "created" ? "/create" : "/gallery"}
                className="btn-primary text-sm"
              >
                {activeTab === "created"
                  ? "Create Your First Scent"
                  : "Explore Gallery"}
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
