"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Vibrate, Hand, Smartphone, Gamepad2, Square } from "lucide-react";
import { TextureProfile } from "@/lib/synesthesia/mock-data";
import { getHapticEngine } from "@/lib/synesthesia/haptics";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TextureVisualizerProps {
  texture: TextureProfile;
  compareTexture?: TextureProfile;
  onPlay?: () => void;
}

// ---------------------------------------------------------------------------
// Property metadata for display
// ---------------------------------------------------------------------------

const PROPERTY_META: Record<
  string,
  { label: string; color: string; unit?: string }
> = {
  friction: { label: "Friction", color: "#FF6B6B" },
  grain: { label: "Grain", color: "#FFAA33" },
  temperature: { label: "Temperature", color: "#4ECDC4" },
  resistance: { label: "Resistance", color: "#C9B1FF" },
  elasticity: { label: "Elasticity", color: "#7BC67E" },
  moisture: { label: "Moisture", color: "#6EC6FF" },
  roughness: { label: "Roughness", color: "#FF8FA3" },
};

const PROPERTY_KEYS = [
  "friction",
  "grain",
  "temperature",
  "resistance",
  "elasticity",
  "moisture",
  "roughness",
] as const;

// ---------------------------------------------------------------------------
// Material Preview
// ---------------------------------------------------------------------------

function MaterialPreview({
  texture,
  size = 200,
}: {
  texture: TextureProfile;
  size?: number;
}) {
  const pp = texture.physical_properties;

  // Temperature-based color shift
  const normalizedTemp = (pp.temperature + 1) / 2; // 0=cold, 1=hot
  const coldR = 60,  coldG = 120, coldB = 200;
  const hotR = 200, hotG = 120, hotB = 60;
  const r = Math.round(coldR + (hotR - coldR) * normalizedTemp);
  const g = Math.round(coldG + (hotG - coldG) * normalizedTemp);
  const b = Math.round(coldB + (hotB - coldB) * normalizedTemp);
  const baseColor = `rgb(${r}, ${g}, ${b})`;
  const lightColor = `rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)})`;

  // Grain noise parameters
  const noiseFrequency = 0.02 + pp.grain * 0.15;
  const turbulence = Math.round(1 + pp.roughness * 6);

  // Smoothness of gradient
  const gradientSpread = 1 - pp.roughness * 0.5;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {/* Noise filter for rough textures */}
          <filter id="textureNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={noiseFrequency}
              numOctaves={turbulence}
              seed={42}
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="saturate"
              values="0"
              result="grayNoise"
            />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" />
          </filter>

          {/* Gradient for the material */}
          <radialGradient id="materialGrad" cx="40%" cy="40%" r={`${50 + gradientSpread * 30}%`}>
            <stop offset="0%" stopColor={lightColor} stopOpacity={0.9} />
            <stop offset="60%" stopColor={baseColor} stopOpacity={0.7} />
            <stop offset="100%" stopColor={baseColor} stopOpacity={0.4} />
          </radialGradient>

          {/* Moisture overlay */}
          {pp.moisture > 0.2 && (
            <radialGradient id="moistureGrad" cx="60%" cy="60%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity={pp.moisture * 0.3} />
              <stop offset="100%" stopColor="white" stopOpacity={0} />
            </radialGradient>
          )}
        </defs>

        {/* Base circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="url(#materialGrad)"
          filter={pp.roughness > 0.15 ? "url(#textureNoise)" : undefined}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {/* Moisture highlight */}
        {pp.moisture > 0.2 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="url(#moistureGrad)"
          />
        )}

        {/* Grain lines for textured materials */}
        {pp.grain > 0.2 && (
          <g opacity={pp.grain * 0.4}>
            {Array.from({ length: Math.round(4 + pp.grain * 12) }).map((_, i) => {
              const y = (i / (4 + pp.grain * 12)) * size;
              const waveAmp = pp.grain * 8;
              const d = `M 0 ${y} Q ${size / 4} ${y + waveAmp} ${size / 2} ${y} Q ${size * 3 / 4} ${y - waveAmp} ${size} ${y}`;
              return (
                <path
                  key={`grain-${i}`}
                  d={d}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={0.5 + pp.roughness}
                  clipPath={`circle(${size / 2 - 4}px at ${size / 2}px ${size / 2}px)`}
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* Material name overlay */}
      <div className="absolute inset-0 flex items-end justify-center pb-4">
        <span className="text-xs font-mono text-white/50 bg-black/30 px-2 py-0.5 rounded">
          {texture.name}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Radar Chart (7-axis for texture properties)
// ---------------------------------------------------------------------------

function TextureRadarChart({
  texture,
  compareTexture,
  size = 280,
}: {
  texture: TextureProfile;
  compareTexture?: TextureProfile;
  size?: number;
}) {
  const center = size / 2;
  const maxRadius = size / 2 - 45;
  const angleStep = (2 * Math.PI) / PROPERTY_KEYS.length;

  const getPolygonPoints = (props: Record<string, number>) => {
    return PROPERTY_KEYS.map((key, i) => {
      const angle = i * angleStep - Math.PI / 2;
      let value = props[key] ?? 0;
      // Normalize temperature from [-1,1] to [0,1]
      if (key === "temperature") {
        value = (value + 1) / 2;
      }
      const r = value * maxRadius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(" ");
  };

  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const primaryPoints = getPolygonPoints(texture.physical_properties as unknown as Record<string, number>);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid levels */}
      {levels.map((level) => (
        <polygon
          key={level}
          points={PROPERTY_KEYS.map((_, i) => {
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
      {PROPERTY_KEYS.map((_, i) => {
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

      {/* Comparison polygon */}
      {compareTexture && (
        <motion.polygon
          points={getPolygonPoints(compareTexture.physical_properties as unknown as Record<string, number>)}
          fill="rgba(78, 205, 196, 0.1)"
          stroke="#4ECDC4"
          strokeWidth={1}
          strokeDasharray="4,4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
      )}

      {/* Primary data polygon */}
      <motion.polygon
        points={primaryPoints}
        fill="rgba(212, 165, 116, 0.15)"
        stroke="#D4A574"
        strokeWidth={1.5}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      />

      {/* Data points */}
      {PROPERTY_KEYS.map((key, i) => {
        const angle = i * angleStep - Math.PI / 2;
        let value = (texture.physical_properties as unknown as Record<string, number>)[key] ?? 0;
        if (key === "temperature") value = (value + 1) / 2;
        const r = value * maxRadius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const meta = PROPERTY_META[key];

        return (
          <motion.circle
            key={`point-${i}`}
            cx={x}
            cy={y}
            r={3.5}
            fill={meta.color}
            stroke="#0A0A0F"
            strokeWidth={1.5}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
          />
        );
      })}

      {/* Labels */}
      {PROPERTY_KEYS.map((key, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = maxRadius + 28;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        const meta = PROPERTY_META[key];
        let value = (texture.physical_properties as unknown as Record<string, number>)[key] ?? 0;
        const displayValue =
          key === "temperature"
            ? `${value > 0 ? "+" : ""}${value.toFixed(1)}`
            : value.toFixed(2);

        return (
          <motion.g
            key={`label-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.04 }}
          >
            <text
              x={x}
              y={y - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={meta.color}
              fontSize={9}
              fontWeight={600}
            >
              {meta.label}
            </text>
            <text
              x={x}
              y={y + 7}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6B7280"
              fontSize={8}
              fontFamily="monospace"
            >
              {displayValue}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Haptic Waveform Display
// ---------------------------------------------------------------------------

function WaveformDisplay({
  waveform,
  isPlaying,
  width = 500,
  height = 120,
}: {
  waveform: number[];
  isPlaying: boolean;
  width?: number;
  height?: number;
}) {
  const [playheadX, setPlayheadX] = useState(0);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const playDuration = 2000; // 2 seconds per waveform cycle

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const progress = (elapsed % playDuration) / playDuration;
        setPlayheadX(progress * width);
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animFrameRef.current);
      setPlayheadX(0);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, width]);

  // Build SVG path from waveform
  const padding = 8;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const pathData = waveform
    .map((v, i) => {
      const x = padding + (i / (waveform.length - 1)) * drawWidth;
      const y = padding + drawHeight - v * drawHeight;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  // Mirror path for filled area
  const fillPath =
    pathData +
    ` L ${padding + drawWidth} ${padding + drawHeight} L ${padding} ${padding + drawHeight} Z`;

  return (
    <div className="relative">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="rounded-lg"
      >
        <defs>
          <linearGradient id="waveformGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A574" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#D4A574" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Background grid */}
        {[0.25, 0.5, 0.75].map((level) => (
          <line
            key={level}
            x1={padding}
            y1={padding + drawHeight * (1 - level)}
            x2={padding + drawWidth}
            y2={padding + drawHeight * (1 - level)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={0.5}
          />
        ))}

        {/* Filled area */}
        <motion.path
          d={fillPath}
          fill="url(#waveformGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Waveform line */}
        <motion.path
          d={pathData}
          fill="none"
          stroke="#D4A574"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Playhead */}
        {isPlaying && (
          <motion.line
            x1={playheadX}
            y1={padding}
            x2={playheadX}
            y2={padding + drawHeight}
            stroke="#FFAA33"
            strokeWidth={2}
            opacity={0.8}
          />
        )}
      </svg>

      {/* Labels */}
      <div className="flex justify-between px-2 mt-1">
        <span className="text-[10px] text-gray-600 font-mono">0</span>
        <span className="text-[10px] text-gray-600 font-mono">
          {isPlaying ? "PLAYING" : "WAVEFORM"}
        </span>
        <span className="text-[10px] text-gray-600 font-mono">255</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property Bars
// ---------------------------------------------------------------------------

function PropertyBars({ texture }: { texture: TextureProfile }) {
  return (
    <div className="space-y-3">
      {PROPERTY_KEYS.map((key, i) => {
        const meta = PROPERTY_META[key];
        let value = (texture.physical_properties as unknown as Record<string, number>)[key] ?? 0;
        let displayValue: string;
        let barWidth: number;

        if (key === "temperature") {
          // Temperature: -1 to 1
          displayValue = `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
          barWidth = ((value + 1) / 2) * 100; // normalize to 0-100%
        } else {
          displayValue = value.toFixed(2);
          barWidth = value * 100;
        }

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: meta.color }}>
                {meta.label}
              </span>
              <span className="text-xs font-mono text-gray-500">
                {displayValue}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-700/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: meta.color }}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TextureVisualizer({
  texture,
  compareTexture,
  onPlay,
}: TextureVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hapticSupported, setHapticSupported] = useState(false);
  const [gamepadSupported, setGamepadSupported] = useState(false);

  useEffect(() => {
    const engine = getHapticEngine();
    setHapticSupported(engine.isSupported());
    setGamepadSupported(engine.isGamepadHapticSupported());
  }, []);

  const handlePlay = useCallback(() => {
    const engine = getHapticEngine();
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    onPlay?.();
    engine.playTexture(texture, 3).finally(() => {
      // Auto-stop after playback completes
      setTimeout(() => setIsPlaying(false), 3000);
    });
  }, [isPlaying, texture, onPlay]);

  const handlePlayWaveform = useCallback(() => {
    const engine = getHapticEngine();
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    engine.playWaveform(texture.waveform, 2000);
    setTimeout(() => setIsPlaying(false), 2200);
  }, [isPlaying, texture.waveform]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">{texture.name}</h2>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed max-w-lg">
            {texture.description}
          </p>
        </div>
      </div>

      {/* Material reference */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Hand className="w-3.5 h-3.5" />
        <span className="font-mono">{texture.material_reference}</span>
      </div>

      {/* Main grid: preview + radar */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Material Preview + Comparison */}
        <div className="card flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 self-start">
            Material Preview
          </h3>
          <div className="flex items-center gap-6">
            <MaterialPreview texture={texture} size={180} />
            {compareTexture && (
              <>
                <div className="text-gray-600 text-xs font-mono">VS</div>
                <MaterialPreview texture={compareTexture} size={180} />
              </>
            )}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="card flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 self-start">
            Properties Radar
          </h3>
          <TextureRadarChart
            texture={texture}
            compareTexture={compareTexture}
            size={280}
          />
        </div>
      </div>

      {/* Waveform + Properties */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Haptic Waveform */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">
              Haptic Waveform
            </h3>
            <button
              onClick={handlePlayWaveform}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
            >
              {isPlaying ? (
                <>
                  <Square className="w-3 h-3" /> Stop
                </>
              ) : (
                <>
                  <Vibrate className="w-3 h-3" /> Play Waveform
                </>
              )}
            </button>
          </div>
          <WaveformDisplay
            waveform={texture.waveform}
            isPlaying={isPlaying}
          />
        </div>

        {/* Property Bars */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Physical Properties
          </h3>
          <PropertyBars texture={texture} />
        </div>
      </div>

      {/* Feel It Button + Device Info */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Feel It Button */}
          <motion.button
            onClick={handlePlay}
            className={`flex-1 sm:flex-none px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
              isPlaying
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-gradient-to-r from-primary-400 to-primary-500 text-surface-900 shadow-glow hover:shadow-glow-lg"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key="stop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <Square className="w-6 h-6" />
                  Stop Haptics
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <Vibrate className="w-6 h-6" />
                  Feel It
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Device compatibility */}
          <div className="flex-1 text-sm text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>
                Vibration API:{" "}
                <span
                  className={
                    hapticSupported ? "text-emerald-400" : "text-amber-400"
                  }
                >
                  {hapticSupported ? "Supported" : "Not available"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              <span>
                Gamepad Haptics:{" "}
                <span
                  className={
                    gamepadSupported ? "text-emerald-400" : "text-gray-600"
                  }
                >
                  {gamepadSupported ? "Connected" : "No controller detected"}
                </span>
              </span>
            </div>
            {!hapticSupported && (
              <p className="text-xs text-gray-600 mt-1">
                Haptic feedback requires a mobile device or gamepad controller.
                Visualization is always available.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
