"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Bluetooth,
  Wifi,
  WifiOff,
  Share2,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Square,
  Circle,
  Copy,
  Check,
} from "lucide-react";
import type { PulsePattern } from "@/lib/synesthesia/pulse-engine";
import { generateECGPath, addVariability } from "@/lib/synesthesia/waveform";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PulseVisualizerProps {
  pulseData?: PulsePattern;
  isLive?: boolean;
  sessionId?: string;
  onShareHeartbeat?: () => void;
  onJoinSession?: (code: string) => void;
  onPlayHaptic?: () => void;
  onStopHaptic?: () => void;
  isPlayingHaptic?: boolean;
  sessionCode?: string | null;
  participants?: { id: string; name: string }[];
  connectionStatus?: "disconnected" | "bluetooth" | "tap" | "simulation";
  breathingPhase?: "inhale" | "hold" | "exhale" | "rest";
  breathingScale?: number;
  breathingLabel?: string;
}

// ---------------------------------------------------------------------------
// Heartbeat Line (ECG Waveform)
// ---------------------------------------------------------------------------

function ECGWaveform({ bpm, color = "#f43f5e" }: { bpm: number; color?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pathD, setPathD] = useState("");
  const [offset, setOffset] = useState(0);
  const animRef = useRef<number>(0);
  const widthRef = useRef(600);

  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      widthRef.current = rect.width || 600;
    }
  }, []);

  useEffect(() => {
    const width = widthRef.current;
    const height = 100;
    const cycles = 4;

    // Generate a wider path for scrolling
    const totalWidth = width * 2;
    const path = generateECGPath(bpm, totalWidth, height, cycles * 2);
    setPathD(path);

    // Animate the scroll
    const msPerCycle = 60000 / bpm;
    const pxPerMs = (width / cycles) / msPerCycle;

    let lastTime = performance.now();
    let currentOffset = 0;

    const animate = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      currentOffset += pxPerMs * dt;

      // Reset when we've scrolled one full cycle width
      const cycleWidth = width / cycles;
      if (currentOffset >= cycleWidth) {
        currentOffset -= cycleWidth;
      }

      setOffset(currentOffset);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [bpm]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 600 100`}
      className="w-full h-24 md:h-28"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.05" />
          <stop offset="15%" stopColor={color} stopOpacity="0.6" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="85%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="ecg-glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        {/* Grid pattern */}
        <pattern id="ecg-grid" width="30" height="25" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 25" fill="none" stroke="rgba(244,63,94,0.06)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Background grid */}
      <rect width="600" height="100" fill="url(#ecg-grid)" />

      {/* Baseline */}
      <line x1="0" y1="55" x2="600" y2="55" stroke="rgba(244,63,94,0.08)" strokeWidth="0.5" />

      {/* ECG trace - glow layer */}
      <g transform={`translate(${-offset}, 0)`}>
        <path
          d={pathD}
          fill="none"
          stroke="url(#ecg-glow)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ECG trace - main line */}
      <g transform={`translate(${-offset}, 0)`}>
        <path
          d={pathD}
          fill="none"
          stroke="url(#ecg-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// BPM Display
// ---------------------------------------------------------------------------

function BPMDisplay({ bpm, previousBpm }: { bpm: number; previousBpm: number }) {
  const diff = bpm - previousBpm;
  const trend = Math.abs(diff) < 2 ? "steady" : diff > 0 ? "up" : "down";

  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="text-5xl md:text-6xl font-bold text-white tabular-nums"
        key={bpm}
        initial={{ scale: 1.08, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {bpm}
      </motion.div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 uppercase tracking-widest">BPM</span>
        <div className="flex items-center gap-1 mt-0.5">
          {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-rose-400" />}
          {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-blue-400" />}
          {trend === "steady" && <Minus className="w-3.5 h-3.5 text-gray-500" />}
          <span
            className={`text-xs ${
              trend === "up"
                ? "text-rose-400"
                : trend === "down"
                ? "text-blue-400"
                : "text-gray-500"
            }`}
          >
            {trend === "steady"
              ? "steady"
              : `${diff > 0 ? "+" : ""}${diff}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pulsing Heart Circle
// ---------------------------------------------------------------------------

function PulsingHeart({ bpm, isLive }: { bpm: number; isLive: boolean }) {
  const [beat, setBeat] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rippleIdRef = useRef(0);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const ms = 60000 / bpm;

    const doBeat = () => {
      setBeat(true);
      const id = rippleIdRef.current++;
      setRipples((prev) => [...prev.slice(-4), id]);
      setTimeout(() => setBeat(false), 150);
    };

    doBeat();
    intervalRef.current = setInterval(doBeat, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bpm]);

  return (
    <div className="relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40">
      {/* Ripple rings */}
      <AnimatePresence>
        {ripples.map((id) => (
          <motion.div
            key={id}
            className="absolute inset-0 rounded-full border border-rose-500/40"
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {/* Inner glow */}
      <motion.div
        className="absolute rounded-full bg-rose-500/10"
        animate={{
          width: beat ? "110%" : "80%",
          height: beat ? "110%" : "80%",
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ filter: "blur(20px)" }}
      />

      {/* Main circle */}
      <motion.div
        className="relative z-10 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full"
        style={{
          background: "radial-gradient(circle at 40% 35%, #fb7185, #e11d48, #9f1239)",
          boxShadow: beat
            ? "0 0 30px rgba(244,63,94,0.5), 0 0 60px rgba(244,63,94,0.2)"
            : "0 0 15px rgba(244,63,94,0.2)",
        }}
        animate={{
          scale: beat ? 1.15 : 1,
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <Heart
          className="w-8 h-8 md:w-10 md:h-10 text-white"
          fill="white"
          strokeWidth={0}
        />
      </motion.div>

      {/* Live indicator */}
      {isLive && (
        <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-rose-500/20 border border-rose-500/30 rounded-full px-2 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-[10px] text-rose-300 uppercase tracking-wider font-medium">
            Live
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Breathing Guide Circle
// ---------------------------------------------------------------------------

function BreathingCircle({
  phase,
  scale,
  label,
}: {
  phase: string;
  scale: number;
  label: string;
}) {
  const phaseColor =
    phase === "inhale"
      ? "rgba(96,165,250,0.3)"
      : phase === "hold"
      ? "rgba(167,139,250,0.3)"
      : phase === "exhale"
      ? "rgba(52,211,153,0.3)"
      : "rgba(100,100,120,0.15)";

  const borderColor =
    phase === "inhale"
      ? "rgba(96,165,250,0.5)"
      : phase === "hold"
      ? "rgba(167,139,250,0.5)"
      : phase === "exhale"
      ? "rgba(52,211,153,0.5)"
      : "rgba(100,100,120,0.2)";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center w-24 h-24">
        <motion.div
          className="absolute rounded-full border-2"
          style={{
            backgroundColor: phaseColor,
            borderColor: borderColor,
          }}
          animate={{
            width: `${scale * 100}%`,
            height: `${scale * 100}%`,
          }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
        <span className="relative z-10 text-xs text-gray-300 font-medium text-center px-2">
          {label}
        </span>
      </div>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">
        Breathing Guide
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connection Status
// ---------------------------------------------------------------------------

function ConnectionStatus({
  status,
  participants,
  sessionCode,
  onShare,
  onJoin,
}: {
  status: string;
  participants: { id: string; name: string }[];
  sessionCode: string | null;
  onShare?: () => void;
  onJoin?: (code: string) => void;
}) {
  const [joinInput, setJoinInput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [sessionCode]);

  return (
    <div className="flex flex-col gap-3">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "disconnected" ? (
            <WifiOff className="w-4 h-4 text-gray-500" />
          ) : status === "bluetooth" ? (
            <Bluetooth className="w-4 h-4 text-blue-400" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs text-gray-400 capitalize">
            {status === "disconnected"
              ? "Not connected"
              : status === "bluetooth"
              ? "Bluetooth HR Monitor"
              : status === "tap"
              ? "Manual Tap Input"
              : "Simulated"}
          </span>
        </div>

        {participants.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">
              {participants.length} connected
            </span>
          </div>
        )}
      </div>

      {/* Session code display */}
      {sessionCode && (
        <div className="flex items-center gap-2 bg-surface-800/60 border border-surface-600/30 rounded-lg px-3 py-2">
          <Share2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span className="text-xs text-gray-400">Share code:</span>
          <span className="text-sm font-mono font-bold text-rose-300 tracking-widest">
            {sessionCode}
          </span>
          <button
            onClick={handleCopy}
            className="ml-auto p-1 rounded hover:bg-surface-600/30 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
        </div>
      )}

      {/* Share and Join buttons */}
      <div className="flex gap-2">
        {!sessionCode && onShare && (
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-rose-500 hover:to-pink-500 transition-all duration-300 shadow-lg shadow-rose-500/10"
          >
            <Share2 className="w-4 h-4" />
            Share Heartbeat
          </button>
        )}

        {!sessionCode && onJoin && (
          <div className="flex-1 flex gap-1.5">
            <input
              type="text"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Enter code"
              maxLength={6}
              className="flex-1 bg-surface-800/50 border border-surface-500/30 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 font-mono tracking-wider focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 transition-all"
            />
            <button
              onClick={() => {
                if (joinInput.length === 6 && onJoin) {
                  onJoin(joinInput);
                  setJoinInput("");
                }
              }}
              disabled={joinInput.length !== 6}
              className="px-4 py-2 bg-surface-700/50 border border-surface-500/30 text-sm text-gray-300 rounded-lg hover:bg-surface-600/50 hover:border-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Join
            </button>
          </div>
        )}
      </div>

      {/* Participant list */}
      {participants.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 bg-surface-800/40 border border-surface-600/20 rounded-full px-3 py-1"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-400">{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main PulseVisualizer Component
// ---------------------------------------------------------------------------

export default function PulseVisualizer({
  pulseData,
  isLive = false,
  sessionId,
  onShareHeartbeat,
  onJoinSession,
  onPlayHaptic,
  onStopHaptic,
  isPlayingHaptic = false,
  sessionCode = null,
  participants = [],
  connectionStatus = "disconnected",
  breathingPhase = "rest",
  breathingScale = 0.3,
  breathingLabel = "",
}: PulseVisualizerProps) {
  const [currentBpm, setCurrentBpm] = useState(pulseData?.bpm ?? 72);
  const [previousBpm, setPreviousBpm] = useState(pulseData?.bpm ?? 72);

  // Simulate slight BPM variation when live
  useEffect(() => {
    if (!isLive || !pulseData) return;

    const interval = setInterval(() => {
      setPreviousBpm(currentBpm);
      const newBpm = Math.round(
        addVariability(pulseData.bpm, 3, Date.now())
      );
      setCurrentBpm(newBpm);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive, pulseData, currentBpm]);

  // Update when pulseData changes
  useEffect(() => {
    if (pulseData) {
      setPreviousBpm(currentBpm);
      setCurrentBpm(pulseData.bpm);
    }
  }, [pulseData?.bpm]);

  if (!pulseData) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl border border-surface-600/20 bg-surface-800/20">
        <div className="text-center">
          <Heart className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            No pulse data yet. Generate a pattern or connect a device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-600/20 bg-gradient-to-b from-surface-800/40 to-surface-900/60 overflow-hidden">
      {/* ECG Waveform */}
      <div className="relative border-b border-surface-600/15 bg-surface-900/40">
        <ECGWaveform bpm={currentBpm} />
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-surface-900/90 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface-900/90 to-transparent pointer-events-none" />
      </div>

      {/* Main content area */}
      <div className="p-5 md:p-6 space-y-6">
        {/* Top row: BPM + Heart + Emotional State */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <BPMDisplay bpm={currentBpm} previousBpm={previousBpm} />

          <PulsingHeart bpm={currentBpm} isLive={isLive} />

          <div className="flex flex-col items-end gap-2">
            {/* Emotional state badge */}
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-full px-3.5 py-1.5">
              <Circle className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
              <span className="text-sm text-rose-300 font-medium">
                {pulseData.emotional_state}
              </span>
            </div>

            {/* Intensity bar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                Intensity
              </span>
              <div className="w-20 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pulseData.intensity * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rhythm description */}
        <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-rose-500/20 pl-3">
          {pulseData.rhythm_description}
        </p>

        {/* Breathing guide + Haptic controls */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          {/* Breathing guide */}
          {pulseData.breathing_guide && (
            <BreathingCircle
              phase={breathingPhase}
              scale={breathingScale}
              label={breathingLabel}
            />
          )}

          {/* Haptic controls */}
          <div className="flex flex-col gap-2 items-end">
            {onPlayHaptic && onStopHaptic && (
              <button
                onClick={isPlayingHaptic ? onStopHaptic : onPlayHaptic}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isPlayingHaptic
                    ? "bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30"
                    : "bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-500/10"
                }`}
              >
                {isPlayingHaptic ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop Haptic
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Play on Device
                  </>
                )}
              </button>
            )}

            {isPlayingHaptic && (
              <motion.p
                className="text-[10px] text-rose-400/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Vibrating with heartbeat rhythm...
              </motion.p>
            )}
          </div>
        </div>

        {/* Connection / Session area */}
        <div className="border-t border-surface-600/15 pt-4">
          <ConnectionStatus
            status={connectionStatus}
            participants={participants}
            sessionCode={sessionCode}
            onShare={onShareHeartbeat}
            onJoin={onJoinSession}
          />
        </div>
      </div>
    </div>
  );
}
