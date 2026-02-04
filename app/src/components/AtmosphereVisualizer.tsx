"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  Music,
  Thermometer,
  Flame,
  Wind,
  Waves,
  TreePine,
  CloudRain,
  CloudLightning,
  Coffee,
  Volume2,
  VolumeX,
  Play,
  Square,
  ChevronUp,
  ChevronDown,
  Zap,
  Palette,
  Clock,
  Lightbulb,
  Bird,
  Radio,
} from "lucide-react";
import type { AtmosphereResult, EvolutionPhase } from "@/lib/synesthesia/types";
import { AmbientSoundGenerator, type AmbientPreset } from "@/lib/synesthesia/ambient-audio";

// ---------------------------------------------------------------------------
// Utility: map ambient layer names to icons
// ---------------------------------------------------------------------------

function AmbientIcon({ layer, className }: { layer: string; className?: string }) {
  const cls = className || "w-4 h-4";
  switch (layer) {
    case "rain":
      return <CloudRain className={cls} />;
    case "fireplace":
      return <Flame className={cls} />;
    case "waves":
      return <Waves className={cls} />;
    case "wind":
      return <Wind className={cls} />;
    case "birds":
      return <Bird className={cls} />;
    case "city":
      return <Radio className={cls} />;
    case "thunder":
      return <CloudLightning className={cls} />;
    case "cafe":
      return <Coffee className={cls} />;
    case "forest":
      return <TreePine className={cls} />;
    case "white_noise":
      return <Zap className={cls} />;
    default:
      return <Volume2 className={cls} />;
  }
}

// ---------------------------------------------------------------------------
// Utility: hex to rgba
// ---------------------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Room Preview -- SVG room with atmosphere-responsive styling
// ---------------------------------------------------------------------------

function RoomPreview({ atmosphere }: { atmosphere: AtmosphereResult }) {
  const { lighting, visual } = atmosphere.profile;
  const primaryColor = lighting.color_hex;
  const brightness = lighting.brightness / 100;
  const secondaryColors = lighting.secondary_colors || [];

  // Animation variants based on animation type
  const glowVariants: Record<string, object> = {
    static: {},
    breathe: {
      opacity: [brightness * 0.4, brightness * 0.8, brightness * 0.4],
      scale: [1, 1.05, 1],
    },
    candle: {
      opacity: [brightness * 0.5, brightness * 0.9, brightness * 0.6, brightness * 0.85, brightness * 0.5],
      scale: [1, 1.02, 0.99, 1.03, 1],
    },
    aurora: {
      opacity: [brightness * 0.4, brightness * 0.7, brightness * 0.5, brightness * 0.8, brightness * 0.4],
      scale: [1, 1.1, 1.05, 1.15, 1],
    },
    storm: {
      opacity: [brightness * 0.1, brightness * 1.0, brightness * 0.1, brightness * 0.05],
      scale: [1, 1.2, 1, 0.98],
    },
    sunset: {
      opacity: [brightness * 0.6, brightness * 0.8, brightness * 0.7],
      scale: [1, 1.03, 1],
    },
  };

  const animationDuration = Math.max(2, 12 - (lighting.speed / 100) * 10);

  return (
    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-surface-500/20">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            ${hexToRgba(primaryColor, 0.15)} 0%,
            ${hexToRgba(secondaryColors[0] || primaryColor, 0.08)} 50%,
            ${hexToRgba(secondaryColors[1] || "#0A0A0F", 0.95)} 100%
          )`,
        }}
      />

      {/* Animated glow orb */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: "60%",
          height: "60%",
          background: `radial-gradient(circle, ${hexToRgba(primaryColor, 0.4)} 0%, ${hexToRgba(primaryColor, 0.1)} 40%, transparent 70%)`,
          filter: "blur(30px)",
        }}
        animate={(glowVariants[lighting.animation] || glowVariants.static) as Record<string, number[]>}
        transition={{
          duration: animationDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary glow for aurora/multi-color animations */}
      {(lighting.animation === "aurora" || lighting.animation === "sunset") && secondaryColors.length > 0 && (
        <motion.div
          className="absolute top-1/3 right-1/4 rounded-full pointer-events-none"
          style={{
            width: "40%",
            height: "40%",
            background: `radial-gradient(circle, ${hexToRgba(secondaryColors[0], 0.3)} 0%, transparent 60%)`,
            filter: "blur(25px)",
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            x: [0, 30, -20, 0],
            y: [0, -15, 10, 0],
          }}
          transition={{
            duration: animationDuration * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Room structure (minimal SVG) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Floor */}
        <path
          d="M0 350 L400 380 L800 350 L800 450 L0 450 Z"
          fill={hexToRgba(primaryColor, 0.05)}
          stroke={hexToRgba(primaryColor, 0.1)}
          strokeWidth="1"
        />
        {/* Back wall */}
        <path
          d="M100 100 L700 100 L800 350 L0 350 Z"
          fill={hexToRgba("#1A1A2E", 0.6)}
          stroke={hexToRgba(primaryColor, 0.08)}
          strokeWidth="0.5"
        />
        {/* Window */}
        <rect
          x="300"
          y="130"
          width="200"
          height="150"
          rx="4"
          fill={hexToRgba(primaryColor, brightness * 0.15)}
          stroke={hexToRgba(primaryColor, 0.2)}
          strokeWidth="1.5"
        />
        {/* Window cross */}
        <line x1="400" y1="130" x2="400" y2="280" stroke={hexToRgba(primaryColor, 0.15)} strokeWidth="1" />
        <line x1="300" y1="205" x2="500" y2="205" stroke={hexToRgba(primaryColor, 0.15)} strokeWidth="1" />
        {/* Lamp */}
        <ellipse
          cx="600"
          cy="240"
          rx="15"
          ry="30"
          fill={hexToRgba(primaryColor, brightness * 0.6)}
          filter="url(#lampGlow)"
        />
        <line x1="600" y1="270" x2="600" y2="350" stroke={hexToRgba("#8B7355", 0.5)} strokeWidth="2" />
        {/* Lamp glow filter */}
        <defs>
          <filter id="lampGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Scene description overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-surface-900/90 to-transparent">
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
          {visual.scene_description}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lighting Panel
// ---------------------------------------------------------------------------

function LightingPanel({ atmosphere }: { atmosphere: AtmosphereResult }) {
  const { lighting } = atmosphere.profile;

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-gray-200">Lighting</h3>
      </div>

      {/* Color swatch */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg border border-white/10 shadow-lg"
          style={{ backgroundColor: lighting.color_hex }}
        />
        <div>
          <p className="text-xs text-gray-500 font-mono">{lighting.color_hex}</p>
          <p className="text-[10px] text-gray-600">{lighting.temperature_kelvin}K</p>
        </div>
        {lighting.secondary_colors && lighting.secondary_colors.length > 0 && (
          <div className="flex gap-1 ml-auto">
            {lighting.secondary_colors.map((c, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded border border-white/10"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        )}
      </div>

      {/* Brightness bar */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Brightness</span>
          <span>{lighting.brightness}%</span>
        </div>
        <div className="h-2 bg-surface-700/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${hexToRgba(lighting.color_hex, 0.3)}, ${lighting.color_hex})`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${lighting.brightness}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Color temperature */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {lighting.temperature_kelvin < 3000 ? (
            <Moon className="w-3.5 h-3.5 text-orange-400" />
          ) : lighting.temperature_kelvin < 4500 ? (
            <Sun className="w-3.5 h-3.5 text-yellow-300" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-blue-300" />
          )}
          <span className="text-xs text-gray-400">{lighting.temperature_kelvin}K</span>
        </div>
        <span className="text-[10px] text-gray-600">
          {lighting.temperature_kelvin < 2500
            ? "Candlelight"
            : lighting.temperature_kelvin < 3500
              ? "Warm White"
              : lighting.temperature_kelvin < 5000
                ? "Neutral"
                : "Cool Daylight"}
        </span>
      </div>

      {/* Animation */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 capitalize">{lighting.animation}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-600/40 text-gray-500">
          Speed: {lighting.speed}%
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sound Panel
// ---------------------------------------------------------------------------

function SoundPanel({
  atmosphere,
  onPlayAmbient,
  isPlaying,
  ambientVolume,
  onVolumeChange,
}: {
  atmosphere: AtmosphereResult;
  onPlayAmbient: (layer: AmbientPreset) => void;
  isPlaying: boolean;
  ambientVolume: number;
  onVolumeChange: (vol: number) => void;
}) {
  const { sound } = atmosphere.profile;

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Music className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-gray-200">Sound</h3>
      </div>

      {/* Genre and mood */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 font-medium capitalize">
          {sound.genre}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-surface-600/40 text-gray-400 capitalize">
          {sound.mood}
        </span>
      </div>

      {/* BPM */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">BPM Range</span>
        <span className="text-xs text-gray-300 font-mono">
          {sound.bpm_range[0]} - {sound.bpm_range[1]}
        </span>
      </div>

      {/* Ambient layer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AmbientIcon layer={sound.ambient_layer as string} className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 capitalize">
            {(sound.ambient_layer as string).replace("_", " ")}
          </span>
        </div>
        <button
          onClick={() => onPlayAmbient(sound.ambient_layer as AmbientPreset)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-surface-600/50 hover:bg-surface-500/50 text-gray-300 transition-colors"
        >
          {isPlaying ? (
            <>
              <Square className="w-3 h-3" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              <span>Play</span>
            </>
          )}
        </button>
      </div>

      {/* Volume bar */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Ambient Volume</span>
          <span>{Math.round(ambientVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(ambientVolume * 100)}
          onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
          className="w-full h-1.5 bg-surface-700/50 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Spotify search hint */}
      {sound.spotify_search_query && (
        <div className="text-[10px] text-gray-600 truncate" title={sound.spotify_search_query}>
          Spotify: &quot;{sound.spotify_search_query}&quot;
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Temperature Panel
// ---------------------------------------------------------------------------

function TemperaturePanel({ atmosphere }: { atmosphere: AtmosphereResult }) {
  const { temperature } = atmosphere.profile;
  const targetC = temperature.target_c ?? Math.round(((temperature.target_f - 32) * 5 / 9) * 10) / 10;

  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Thermometer className="w-4 h-4 text-red-400" />
        <h3 className="text-sm font-semibold text-gray-200">Temperature</h3>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-100">
            {temperature.target_f}
          </span>
          <span className="text-sm text-gray-500">F</span>
          <span className="text-xs text-gray-600">/ {targetC}C</span>
        </div>

        <div className="flex items-center gap-1">
          {temperature.change_direction === "warmer" ? (
            <ChevronUp className="w-5 h-5 text-red-400" />
          ) : temperature.change_direction === "cooler" ? (
            <ChevronDown className="w-5 h-5 text-blue-400" />
          ) : (
            <span className="w-5 h-5 flex items-center justify-center text-gray-500 text-xs">--</span>
          )}
          <span
            className={`text-xs capitalize ${
              temperature.change_direction === "warmer"
                ? "text-red-400"
                : temperature.change_direction === "cooler"
                  ? "text-blue-400"
                  : "text-gray-500"
            }`}
          >
            {temperature.change_direction}
          </span>
        </div>
      </div>

      {temperature.description && (
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {temperature.description}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Evolution Timeline
// ---------------------------------------------------------------------------

function EvolutionTimeline({ phases }: { phases: EvolutionPhase[] }) {
  const totalMinutes = phases.reduce((sum, p) => sum + p.duration_minutes, 0);

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-gray-200">Evolution Timeline</h3>
        <span className="text-[10px] text-gray-600 ml-auto">{totalMinutes} min total</span>
      </div>

      {/* Timeline bar */}
      <div className="flex rounded-full overflow-hidden h-3 bg-surface-700/50">
        {phases.map((phase, i) => {
          const widthPct = (phase.duration_minutes / totalMinutes) * 100;
          const color = phase.lighting?.color_hex || "#E8B87D";
          const brightness = (phase.lighting?.brightness ?? 50) / 100;

          return (
            <motion.div
              key={i}
              className="h-full relative group"
              style={{
                width: `${widthPct}%`,
                backgroundColor: hexToRgba(color, 0.3 + brightness * 0.5),
                borderRight: i < phases.length - 1 ? "1px solid rgba(0,0,0,0.3)" : "none",
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              title={`${phase.name}: ${phase.duration_minutes}min`}
            />
          );
        })}
      </div>

      {/* Phase labels */}
      <div className="space-y-3">
        {phases.map((phase, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.3 }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
              style={{
                backgroundColor: phase.lighting?.color_hex || "#E8B87D",
                boxShadow: `0 0 6px ${hexToRgba(phase.lighting?.color_hex || "#E8B87D", 0.4)}`,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-300">{phase.name}</span>
                <span className="text-[10px] text-gray-600">{phase.duration_minutes}min</span>
                {phase.sound?.genre && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-600/40 text-gray-500 capitalize">
                    {phase.sound.genre}
                  </span>
                )}
              </div>
              {phase.description && (
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  {phase.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AtmosphereVisualizer Component
// ---------------------------------------------------------------------------

interface AtmosphereVisualizerProps {
  atmosphere: AtmosphereResult;
  onApply?: () => void;
}

export default function AtmosphereVisualizer({ atmosphere, onApply }: AtmosphereVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ambientVolume, setAmbientVolume] = useState(
    (atmosphere.profile.sound.ambient_volume ?? 30) / 100
  );
  const generatorRef = useRef<AmbientSoundGenerator | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (generatorRef.current) {
        generatorRef.current.destroy();
        generatorRef.current = null;
      }
    };
  }, []);

  const handlePlayAmbient = useCallback((layer: AmbientPreset) => {
    if (isPlaying) {
      // Stop
      if (generatorRef.current) {
        generatorRef.current.stop();
      }
      setIsPlaying(false);
    } else {
      // Play
      if (!generatorRef.current) {
        generatorRef.current = new AmbientSoundGenerator();
      }
      generatorRef.current.play(layer, ambientVolume);
      setIsPlaying(true);
    }
  }, [isPlaying, ambientVolume]);

  const handleVolumeChange = useCallback((vol: number) => {
    setAmbientVolume(vol);
    if (generatorRef.current) {
      generatorRef.current.setVolume(vol);
    }
  }, []);

  const hasEvolution = atmosphere.profile.evolution && atmosphere.profile.evolution.phases.length > 0;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="space-y-2">
        <motion.h2
          className="text-2xl font-bold text-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {atmosphere.name}
        </motion.h2>
        <motion.p
          className="text-sm text-gray-400 leading-relaxed max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {atmosphere.description}
        </motion.p>
        {atmosphere.mood.length > 0 && (
          <motion.div
            className="flex gap-2 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {atmosphere.mood.map((m) => (
              <span
                key={m}
                className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400/80 border border-amber-500/15 capitalize"
              >
                {m}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Room preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <RoomPreview atmosphere={atmosphere} />
      </motion.div>

      {/* Panels grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <LightingPanel atmosphere={atmosphere} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SoundPanel
            atmosphere={atmosphere}
            onPlayAmbient={handlePlayAmbient}
            isPlaying={isPlaying}
            ambientVolume={ambientVolume}
            onVolumeChange={handleVolumeChange}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TemperaturePanel atmosphere={atmosphere} />
        </motion.div>
      </div>

      {/* Evolution timeline */}
      {hasEvolution && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <EvolutionTimeline phases={atmosphere.profile.evolution!.phases} />
        </motion.div>
      )}

      {/* Color palette */}
      {atmosphere.profile.visual.color_palette.length > 0 && (
        <motion.div
          className="glass rounded-xl p-5"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-gray-200">Color Palette</h3>
          </div>
          <div className="flex gap-2">
            {atmosphere.profile.visual.color_palette.map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 rounded-lg border border-white/10 shadow-lg"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[9px] text-gray-600 font-mono">{color}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        className="flex gap-3 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <button
          onClick={onApply}
          className="btn-primary flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Apply to Room
        </button>
        <button
          onClick={() => {
            const layer = atmosphere.profile.sound.ambient_layer as AmbientPreset;
            handlePlayAmbient(layer);
          }}
          className="btn-secondary flex items-center gap-2"
        >
          {isPlaying ? (
            <>
              <VolumeX className="w-4 h-4" />
              Stop Ambient Sound
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              Play Ambient Sound
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}
