"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Lightbulb,
  Speaker,
  Thermometer,
  Clock,
  Save,
  Share2,
  Wifi,
  WifiOff,
  Check,
} from "lucide-react";
import AtmosphereVisualizer from "@/components/AtmosphereVisualizer";
import type { AtmosphereResult, AtmosphereResponse, DeviceIntegration } from "@/lib/synesthesia/types";
import { DEMO_ATMOSPHERES } from "@/lib/synesthesia/types";

// ---------------------------------------------------------------------------
// Example prompts
// ---------------------------------------------------------------------------

const EXAMPLE_PROMPTS = [
  "Tokyo jazz bar at midnight",
  "Cabin in Norwegian woods, winter",
  "Tropical sunset beach party",
  "Rainy London bookshop",
  "Deep space station",
  "1920s speakeasy",
];

// ---------------------------------------------------------------------------
// Device Connection Card
// ---------------------------------------------------------------------------

function DeviceCheckbox({
  device,
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  device: DeviceIntegration;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (device: DeviceIntegration, checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 glass rounded-lg px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(device, e.target.checked)}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
          checked
            ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
            : "border-surface-500/40 text-transparent"
        }`}
      >
        <Check className="w-3 h-3" />
      </div>
      <Icon className={`w-4 h-4 ${checked ? "text-amber-400" : "text-gray-500"}`} />
      <span className={`text-sm ${checked ? "text-gray-200" : "text-gray-500"}`}>{label}</span>
      <WifiOff className="w-3 h-3 text-gray-700 ml-auto" />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Pre-built Atmosphere Cards (for demo browsing)
// ---------------------------------------------------------------------------

function DemoAtmosphereCard({
  atm,
  onClick,
}: {
  atm: AtmosphereResult;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="text-left glass rounded-xl p-4 hover:bg-white/[0.04] transition-all group w-full"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${atm.profile.lighting.color_hex}, ${
              atm.profile.lighting.secondary_colors?.[0] || atm.profile.lighting.color_hex
            })`,
            opacity: atm.profile.lighting.brightness / 100 + 0.3,
          }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-200 group-hover:text-amber-300 transition-colors truncate">
            {atm.name}
          </h4>
          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
            {atm.description}
          </p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {atm.mood.slice(0, 3).map((m) => (
              <span
                key={m}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-600/40 text-gray-600 capitalize"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main Atmosphere Page
// ---------------------------------------------------------------------------

export default function AtmospherePage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [atmosphere, setAtmosphere] = useState<AtmosphereResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enableEvolution, setEnableEvolution] = useState(false);
  const [devices, setDevices] = useState<Record<DeviceIntegration, boolean>>({
    hue: false,
    sonos: false,
    nest: false,
  });
  const [saved, setSaved] = useState(false);

  const handleGenerate = useCallback(
    async (inputPrompt?: string) => {
      const finalPrompt = inputPrompt || prompt;
      if (!finalPrompt.trim()) return;

      setIsLoading(true);
      setError(null);
      setAtmosphere(null);
      setSaved(false);

      try {
        const activeDevices = (Object.entries(devices) as [DeviceIntegration, boolean][])
          .filter(([, v]) => v)
          .map(([k]) => k);

        const res = await fetch("/api/atmosphere", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: finalPrompt.trim(),
            devices: activeDevices.length > 0 ? activeDevices : undefined,
            evolution: enableEvolution,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed with status ${res.status}`);
        }

        const data: AtmosphereResponse = await res.json();
        setAtmosphere(data.atmosphere);
      } catch (err: any) {
        setError(err.message || "Something went wrong generating the atmosphere.");
      } finally {
        setIsLoading(false);
      }
    },
    [prompt, devices, enableEvolution]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerate();
  };

  const handleChipClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    handleGenerate(examplePrompt);
  };

  const handleDemoClick = (atm: AtmosphereResult) => {
    setPrompt(atm.prompt);
    setAtmosphere(atm);
    setError(null);
    setSaved(false);
  };

  const handleDeviceToggle = (device: DeviceIntegration, checked: boolean) => {
    setDevices((prev) => ({ ...prev, [device]: checked }));
  };

  const handleSave = () => {
    setSaved(true);
    // Placeholder: in production this would save to a database
  };

  const handleShare = () => {
    if (atmosphere) {
      const text = `Check out this atmosphere I created: "${atmosphere.name}" -- ${atmosphere.description}`;
      if (navigator.share) {
        navigator.share({ title: atmosphere.name, text }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    }
  };

  const handleApply = () => {
    // Placeholder: in production this would send commands to connected devices
    alert(
      "Apply to Room: This would send commands to your connected smart home devices.\n\n" +
        "Connected devices: " +
        (Object.entries(devices)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(", ") || "None") +
        "\n\nConnect Philips Hue, Sonos, or Nest in the settings below to enable."
    );
  };

  const demoAtmospheres = Object.values(DEMO_ATMOSPHERES);

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <section className="relative pt-8 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-amber-400 mb-6">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Synesthesia.ai -- ATMOSPHERE Module</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent">
                ATMOSPHERE
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Transform any room with a single prompt. Control lighting, sound,
              temperature, and ambiance through natural language.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Prompt input */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                placeholder="Describe the atmosphere you want to create... A place, a mood, a moment in time."
                rows={3}
                className="w-full bg-surface-800/30 border border-surface-500/30 rounded-xl px-5 py-4
                  text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-400/40
                  focus:ring-2 focus:ring-amber-400/15 transition-all duration-300 resize-none
                  text-lg leading-relaxed glass"
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-600 font-mono">
                {prompt.length}/500
              </div>
            </div>

            {/* Example chips */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((ex) => (
                <motion.button
                  key={ex}
                  type="button"
                  onClick={() => handleChipClick(ex)}
                  className="chip text-xs text-gray-400 hover:text-amber-300"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isLoading}
                >
                  &quot;{ex}&quot;
                </motion.button>
              ))}
            </div>

            {/* Options row */}
            <div className="flex items-center gap-6 flex-wrap">
              {/* Evolution toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableEvolution}
                  onChange={(e) => setEnableEvolution(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    enableEvolution ? "bg-amber-500/30" : "bg-surface-600/50"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                      enableEvolution
                        ? "left-[18px] bg-amber-400"
                        : "left-0.5 bg-gray-500"
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-400">Enable time evolution</span>
                </div>
              </label>

              {/* Generate button */}
              <motion.button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="btn-primary ml-auto flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Atmosphere</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>

          {/* Error display */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="glass border border-red-500/20 rounded-xl p-4 text-sm text-red-400"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                className="flex flex-col items-center justify-center py-16 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 rounded-full border-2 border-amber-400/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-0 w-16 h-16 rounded-full border-t-2 border-amber-400"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <Sparkles className="w-5 h-5 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-gray-400">Designing your atmosphere...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Atmosphere result */}
          <AnimatePresence mode="wait">
            {atmosphere && !isLoading && (
              <motion.div
                key={atmosphere.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AtmosphereVisualizer
                  atmosphere={atmosphere}
                  onApply={handleApply}
                />

                {/* Save / Share buttons */}
                <motion.div
                  className="flex gap-3 mt-6 flex-wrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={handleSave}
                    className={`btn-secondary flex items-center gap-2 ${
                      saved ? "text-green-400 border-green-500/20" : ""
                    }`}
                    disabled={saved}
                  >
                    {saved ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Atmosphere
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Device connections section */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-300">Device Connections</h3>
              <span className="text-[10px] text-gray-600 ml-2">(requires API keys)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <DeviceCheckbox
                device="hue"
                label="Philips Hue"
                icon={Lightbulb}
                checked={devices.hue}
                onChange={handleDeviceToggle}
              />
              <DeviceCheckbox
                device="sonos"
                label="Sonos"
                icon={Speaker}
                checked={devices.sonos}
                onChange={handleDeviceToggle}
              />
              <DeviceCheckbox
                device="nest"
                label="Nest"
                icon={Thermometer}
                checked={devices.nest}
                onChange={handleDeviceToggle}
              />
            </div>
          </motion.div>

          {/* Demo atmospheres section -- shown when no result yet */}
          {!atmosphere && !isLoading && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-sm font-semibold text-gray-300">
                Pre-built Atmospheres
              </h3>
              <p className="text-xs text-gray-500">
                Try one of these curated atmospheres, or type your own prompt above.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {demoAtmospheres.map((atm) => (
                  <DemoAtmosphereCard
                    key={atm.id}
                    atm={atm}
                    onClick={() => handleDemoClick(atm)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
