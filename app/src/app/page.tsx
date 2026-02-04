"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sun,
  Moon,
  Wind,
  Hand,
  Droplets,
  Heart,
  Sparkles,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Module definitions
// ---------------------------------------------------------------------------

const modules = [
  {
    key: "atmosphere",
    label: "ATMOSPHERE",
    tagline: "Transform any room",
    icon: Sun,
    secondaryIcon: Moon,
    color: "#F59E0B",
    href: "/atmosphere",
  },
  {
    key: "scent",
    label: "SCENT",
    tagline: "Smell any memory",
    icon: Wind,
    color: "#10B981",
    href: "/scent",
  },
  {
    key: "texture",
    label: "TEXTURE",
    tagline: "Feel any surface",
    icon: Hand,
    color: "#3B82F6",
    href: "/texture",
  },
  {
    key: "taste",
    label: "TASTE",
    tagline: "Taste the impossible",
    icon: Droplets,
    color: "#EC4899",
    href: "/taste",
  },
  {
    key: "pulse",
    label: "PULSE",
    tagline: "Share your heartbeat",
    icon: Heart,
    color: "#EF4444",
    href: "/pulse",
  },
];

const exampleExperiences = [
  {
    title: "Northern Lights in Iceland",
    description:
      "Aurora borealis rippling overhead. Crisp glacial air carries hints of volcanic mineral and arctic moss. Fingers trace the texture of fresh ice. A warm berry-spiced drink steadies you against the cold.",
    activeModules: ["atmosphere", "scent", "texture", "taste", "pulse"],
    prompt: "Northern lights in Iceland",
  },
  {
    title: "Tokyo Jazz Bar at Midnight",
    description:
      "Smoky amber lighting pulses with a slow saxophone. Old leather seats, aged whiskey, subtle hinoki wood incense. The hum of the city fades as the music deepens.",
    activeModules: ["atmosphere", "scent", "taste", "pulse"],
    prompt: "Tokyo jazz bar at midnight",
  },
  {
    title: "Grandmother's Kitchen on Christmas Morning",
    description:
      "Warm cinnamon and vanilla fill the air. Golden light from the oven. Soft dough yields under your hands. Hot cocoa with a hint of nutmeg. Steady, comforting heartbeat of home.",
    activeModules: ["atmosphere", "scent", "texture", "taste", "pulse"],
    prompt: "Grandmother's kitchen on Christmas morning",
  },
  {
    title: "Walking Through a Rainy Forest",
    description:
      "Petrichor and wet pine needles. Mist softens every edge. Cool droplets on skin, spongy moss underfoot. The forest breathes in a slow, rhythmic pulse.",
    activeModules: ["atmosphere", "scent", "texture", "pulse"],
    prompt: "Walking through a rainy forest",
  },
];

const howItWorksSteps = [
  {
    step: "Describe",
    description:
      "Type a prompt, speak aloud, or upload an image. Describe any real or imagined experience in natural language.",
    color: "#FFD93D",
  },
  {
    step: "Decompose",
    description:
      "Our AI analyzes your prompt and decomposes it into separate sensory channels -- atmosphere, scent, texture, taste, and pulse.",
    color: "#FF6B9D",
  },
  {
    step: "Experience",
    description:
      "Receive detailed outputs for each sense. Lighting recipes, scent formulas, haptic patterns, flavor profiles, and rhythmic guides.",
    color: "#4ECDC4",
  },
];

// ---------------------------------------------------------------------------
// Animated background
// ---------------------------------------------------------------------------

function BackgroundOrbs() {
  const orbColors = ["#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#EF4444"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbColors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 200 + i * 120,
            height: 200 + i * 120,
            left: `${10 + i * 18}%`,
            top: `${8 + (i % 3) * 22}%`,
            background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
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

// ---------------------------------------------------------------------------
// Animated typing demo
// ---------------------------------------------------------------------------

function TypingDemo() {
  const fullText = "Northern lights in Iceland";
  const [displayText, setDisplayText] = useState("");
  const [showCards, setShowCards] = useState(false);
  const [phase, setPhase] = useState<"typing" | "cards" | "pause">("typing");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let charIndex = 0;

    function typeNext() {
      if (charIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, charIndex));
        charIndex++;
        timeout = setTimeout(typeNext, 60 + Math.random() * 40);
      } else {
        setPhase("cards");
        timeout = setTimeout(() => {
          setShowCards(true);
        }, 400);
      }
    }

    if (phase === "typing") {
      setShowCards(false);
      setDisplayText("");
      charIndex = 0;
      timeout = setTimeout(typeNext, 800);
    }

    if (phase === "cards") {
      timeout = setTimeout(() => {
        setPhase("pause");
      }, 6000);
    }

    if (phase === "pause") {
      timeout = setTimeout(() => {
        setShowCards(false);
        setPhase("typing");
      }, 2000);
    }

    return () => clearTimeout(timeout);
  }, [phase]);

  const demoModules = [
    { key: "atmosphere", label: "Atmosphere", color: "#F59E0B", desc: "Aurora lighting with green-violet shifts" },
    { key: "scent", label: "Scent", color: "#10B981", desc: "Glacial air, volcanic mineral, arctic moss" },
    { key: "texture", label: "Texture", color: "#3B82F6", desc: "Crisp ice crystals under fingertips" },
    { key: "taste", label: "Taste", color: "#EC4899", desc: "Warm cloudberry and arctic thyme tea" },
    { key: "pulse", label: "Pulse", color: "#EF4444", desc: "Slow, awestruck rhythm at 56 BPM" },
  ];

  return (
    <motion.div
      className="max-w-3xl mx-auto mt-14 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
    >
      {/* Prompt bar */}
      <div className="card px-5 py-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0" />
          <span className="text-gray-300 text-sm font-mono flex-1 min-h-[1.25rem]">
            {displayText}
            <motion.span
              className="inline-block w-0.5 h-4 bg-primary-400 ml-0.5 align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </span>
        </div>
      </div>

      {/* Fan-out cards */}
      {showCards && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {demoModules.map((mod, i) => (
            <motion.div
              key={mod.key}
              className="rounded-xl p-3 border text-center"
              style={{
                backgroundColor: `${mod.color}08`,
                borderColor: `${mod.color}25`,
              }}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
            >
              <div
                className="text-[10px] font-bold tracking-wider mb-1"
                style={{ color: mod.color }}
              >
                {mod.label.toUpperCase()}
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">
                {mod.desc}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center">
      <BackgroundOrbs />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-primary-400 mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Sensory AI Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="gradient-text-light">One prompt.</span>
            <br />
            <span className="gradient-text">Every sense.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            The first multi-sensory AI platform. Describe an experience and we
            will bring it to life across sight, sound, scent, touch, and taste.
          </p>
        </motion.div>

        {/* Animated typing demo */}
        <TypingDemo />

        {/* CTA */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Link href="/create">
            <motion.button
              className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Try the Unified Experience
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Module Showcase
// ---------------------------------------------------------------------------

function ModuleShowcase() {
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
          <h2 className="section-heading">Five Senses, One Platform</h2>
          <p className="section-subheading">
            Each module generates rich, actionable output for a different sensory
            channel
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link href={mod.href}>
                  <div
                    className="card group cursor-pointer text-center hover:shadow-glow transition-all duration-300"
                    style={
                      {
                        "--tw-shadow-color": `${mod.color}15`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="mb-4">
                      <div
                        className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: `${mod.color}15`,
                          border: `1px solid ${mod.color}30`,
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: mod.color }}
                        />
                      </div>
                    </div>
                    <div
                      className="text-xs font-bold tracking-wider mb-2"
                      style={{ color: mod.color }}
                    >
                      {mod.label}
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {mod.tagline}
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
                      <span>Explore</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Example Experiences
// ---------------------------------------------------------------------------

function ExampleExperiences() {
  const moduleColorMap: Record<string, string> = {
    atmosphere: "#F59E0B",
    scent: "#10B981",
    texture: "#3B82F6",
    taste: "#EC4899",
    pulse: "#EF4444",
  };

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
          <h2 className="section-heading">Example Experiences</h2>
          <p className="section-subheading">
            See how a single prompt becomes a complete multi-sensory experience
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {exampleExperiences.map((exp, i) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Link
                href={`/create?prompt=${encodeURIComponent(exp.prompt)}`}
              >
                <div className="card group cursor-pointer hover:shadow-glow h-full">
                  <h3 className="text-lg font-semibold text-gray-200 group-hover:text-primary-400 transition-colors mb-3">
                    {exp.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4">
                    {exp.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exp.activeModules.map((mod) => (
                      <span
                        key={mod}
                        className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${moduleColorMap[mod]}15`,
                          color: moduleColorMap[mod],
                          border: `1px solid ${moduleColorMap[mod]}30`,
                        }}
                      >
                        {mod.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------

function HowItWorks() {
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
            From words to a complete sensory experience in three steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {howItWorksSteps.map((step, i) => (
            <motion.div
              key={step.step}
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
                  <span
                    className="text-xl font-bold"
                    style={{ color: step.color }}
                  >
                    {i + 1}
                  </span>
                </div>
                <div className="text-xs font-mono text-gray-600 mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-200">
                  {step.step}
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

// ---------------------------------------------------------------------------
// CTA Banner
// ---------------------------------------------------------------------------

function CTABanner() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
            Ready to feel everything?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            One prompt unlocks atmosphere, scent, texture, taste, and pulse. Try
            the unified creator now.
          </p>
          <Link href="/create">
            <motion.button
              className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Create an Experience
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ModuleShowcase />
      <ExampleExperiences />
      <HowItWorks />
      <CTABanner />
    </>
  );
}
