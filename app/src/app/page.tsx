"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Cpu,
  Droplets,
  ArrowRight,
  Heart,
  Shuffle,
  PenTool,
  FlaskConical,
  Printer,
} from "lucide-react";
import { communityScents, examplePrompts } from "@/lib/mock-data";
import { MiniScentWheel } from "@/components/ScentWheel";
import { getCategoryColor } from "@/lib/utils";

// Animated background orbs
function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 200 + i * 100,
            height: 200 + i * 100,
            left: `${15 + i * 18}%`,
            top: `${10 + (i % 3) * 25}%`,
            background: `radial-gradient(circle, rgba(212,165,116,${0.03 + i * 0.01}) 0%, transparent 70%)`,
          }}
          animate={{
            x: [0, 30 * (i % 2 === 0 ? 1 : -1), 0],
            y: [0, 20 * (i % 2 === 0 ? -1 : 1), 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center">
      <BackgroundOrbs />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-primary-400 mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generative Olfaction Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="gradient-text-light">Type a prompt.</span>
            <br />
            <span className="gradient-text">Get a scent.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Transform words into fragrance formulas. Our AI understands
            memories, moods, and moments -- then composes precise
            olfactory blueprints you can actually produce.
          </p>
        </motion.div>

        {/* Example prompts */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {examplePrompts.slice(0, 3).map((prompt, i) => (
            <Link key={prompt} href={`/create?prompt=${encodeURIComponent(prompt)}`}>
              <motion.div
                className="chip text-sm text-gray-400 hover:text-primary-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                &quot;{prompt}&quot;
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link href="/create">
            <motion.button
              className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <PenTool className="w-5 h-5" />
              Start Creating
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: PenTool,
      title: "Describe",
      description:
        "Write a natural language prompt describing any scent -- a memory, a place, a mood, a dream.",
      color: "#FFD93D",
    },
    {
      icon: FlaskConical,
      title: "Generate",
      description:
        "Our AI composes a precise formula with real ingredients, percentages, and note structure in OSC format.",
      color: "#FF6B9D",
    },
    {
      icon: Printer,
      title: "Dispense",
      description:
        "Send the formula to a compatible scent printer or use it as a blueprint for manual composition.",
      color: "#4ECDC4",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-heading">How It Works</h2>
          <p className="section-subheading">
            From words to molecules in three steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="card text-center group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="mb-5">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${step.color}15`,
                    border: `1px solid ${step.color}30`,
                  }}
                >
                  <step.icon
                    className="w-6 h-6"
                    style={{ color: step.color }}
                  />
                </div>
                <div className="text-xs font-mono text-gray-600 mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-200">
                  {step.title}
                </h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedScents() {
  const featured = communityScents.slice(0, 6);

  return (
    <section className="py-24 px-6 bg-surface-800/20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-heading">Community Creations</h2>
          <p className="section-subheading">
            Explore scents crafted by our community of olfactory designers
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((scent, i) => (
            <motion.div
              key={scent.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Link href={`/scent/${scent.id}`}>
                <div className="card group cursor-pointer hover:shadow-glow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="text-lg font-semibold text-gray-200 group-hover:text-primary-400 transition-colors truncate">
                        {scent.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        by {scent.creator}
                      </p>
                    </div>
                    <MiniScentWheel
                      ingredients={scent.ingredients}
                      size={50}
                    />
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                    {scent.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {scent.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-surface-600/40 text-gray-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {Math.floor(Math.random() * 300) + 50}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shuffle className="w-3 h-3" />
                        {Math.floor(Math.random() * 20) + 3}
                      </span>
                    </div>
                    <span className="capitalize">{scent.sillage}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/gallery">
            <motion.button
              className="btn-secondary inline-flex items-center gap-2"
              whileHover={{ scale: 1.03 }}
            >
              Explore All Scents
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeaturedScents />
    </>
  );
}
