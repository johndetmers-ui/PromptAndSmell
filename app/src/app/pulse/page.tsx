"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Bluetooth,
  Hand,
  Play,
  Square,
  Clock,
  Zap,
  Radio,
  Archive,
  Disc,
  Trash2,
  RotateCcw,
} from "lucide-react";
import PulseVisualizer from "@/components/PulseVisualizer";
import {
  HeartbeatDetector,
  HapticPulsePlayer,
  PulseSession,
  BreathingGuide,
  DEMO_PATTERNS,
} from "@/lib/synesthesia/pulse-engine";
import type {
  PulsePattern,
  SavedMoment,
  BeatEvent,
} from "@/lib/synesthesia/pulse-engine";
import { generateRRIntervals } from "@/lib/synesthesia/waveform";

// ---------------------------------------------------------------------------
// Mock saved moments
// ---------------------------------------------------------------------------

const MOCK_SAVED_MOMENTS: SavedMoment[] = [
  {
    id: "m1",
    name: "Morning meditation",
    date: "2026-01-28T08:15:00Z",
    average_bpm: 58,
    emotional_state: "Serene",
    duration_seconds: 600,
    pattern: DEMO_PATTERNS.calm,
  },
  {
    id: "m2",
    name: "After the half-marathon",
    date: "2026-01-26T11:42:00Z",
    average_bpm: 102,
    emotional_state: "Exhilarated",
    duration_seconds: 180,
    pattern: {
      bpm: 102,
      rhythm_description: "Pounding and triumphant, the post-race heartbeat gradually settling from its peak.",
      haptic_sequence: generateRRIntervals(102, 16, 6),
      emotional_state: "Exhilarated",
      breathing_guide: { inhale_ms: 2500, hold_ms: 500, exhale_ms: 3000 },
      intensity: 0.9,
    },
  },
  {
    id: "m3",
    name: "Reading before sleep",
    date: "2026-01-25T22:30:00Z",
    average_bpm: 54,
    emotional_state: "Drowsy",
    duration_seconds: 900,
    pattern: DEMO_PATTERNS.sleeping,
  },
  {
    id: "m4",
    name: "First date jitters",
    date: "2026-01-20T19:00:00Z",
    average_bpm: 88,
    emotional_state: "Nervous excitement",
    duration_seconds: 300,
    pattern: {
      bpm: 88,
      rhythm_description: "A fluttering rhythm caught between excitement and anxiety, quickening and slowing unpredictably.",
      haptic_sequence: generateRRIntervals(88, 16, 7),
      emotional_state: "Nervous excitement",
      breathing_guide: { inhale_ms: 3500, hold_ms: 2000, exhale_ms: 4500 },
      intensity: 0.75,
    },
  },
  {
    id: "m5",
    name: "Sunset on the balcony",
    date: "2026-01-18T17:45:00Z",
    average_bpm: 68,
    emotional_state: "Contentment",
    duration_seconds: 420,
    pattern: DEMO_PATTERNS.in_love,
  },
];

// ---------------------------------------------------------------------------
// Example prompt chips
// ---------------------------------------------------------------------------

const EXAMPLE_CHIPS = [
  "Calm meditation",
  "First kiss nervousness",
  "Running a marathon",
  "Falling asleep",
  "Watching a sunset with someone you love",
];

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId = "sync" | "broadcast" | "archive";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "sync", label: "Sync", icon: <Radio className="w-4 h-4" /> },
  { id: "broadcast", label: "Broadcast", icon: <Zap className="w-4 h-4" /> },
  { id: "archive", label: "Archive", icon: <Archive className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function PulsePage() {
  // --- Generate section state ---
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPattern, setGeneratedPattern] = useState<PulsePattern | null>(null);
  const [generationSource, setGenerationSource] = useState<"ai" | "demo" | null>(null);

  // --- Live section state ---
  const [activeTab, setActiveTab] = useState<TabId>("sync");
  const [livePattern, setLivePattern] = useState<PulsePattern | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<"disconnected" | "bluetooth" | "tap" | "simulation">("disconnected");
  const [liveBpm, setLiveBpm] = useState(72);
  const [liveRR, setLiveRR] = useState<number[]>([]);

  // --- Session state ---
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionParticipants, setSessionParticipants] = useState<{ id: string; name: string }[]>([]);
  const [remotePattern, setRemotePattern] = useState<PulsePattern | null>(null);

  // --- Haptic state ---
  const [isPlayingHaptic, setIsPlayingHaptic] = useState(false);

  // --- Breathing state ---
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("rest");
  const [breathingScale, setBreathingScale] = useState(0.3);
  const [breathingLabel, setBreathingLabel] = useState("");

  // --- Archive state ---
  const [savedMoments, setSavedMoments] = useState<SavedMoment[]>(MOCK_SAVED_MOMENTS);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [playingMomentId, setPlayingMomentId] = useState<string | null>(null);

  // --- Engine refs ---
  const detectorRef = useRef<HeartbeatDetector | null>(null);
  const playerRef = useRef<HapticPulsePlayer | null>(null);
  const sessionRef = useRef<PulseSession | null>(null);
  const breathingRef = useRef<BreathingGuide | null>(null);
  const recordedBeatsRef = useRef<BeatEvent[]>([]);

  // Initialize engines
  useEffect(() => {
    detectorRef.current = new HeartbeatDetector();
    playerRef.current = new HapticPulsePlayer();
    sessionRef.current = new PulseSession();
    breathingRef.current = new BreathingGuide();

    // Set up beat handler
    detectorRef.current.onBeat((bpm, rr_interval) => {
      setLiveBpm(bpm);
      setLiveRR((prev) => [...prev.slice(-15), rr_interval]);

      // Update live pattern
      setLivePattern((prev) => ({
        bpm,
        rhythm_description: prev?.rhythm_description ?? "Live heartbeat rhythm",
        haptic_sequence: [...(prev?.haptic_sequence.slice(-15) ?? []), rr_interval],
        emotional_state: bpmToEmotion(bpm),
        breathing_guide: prev?.breathing_guide,
        intensity: bpmToIntensity(bpm),
      }));

      // Send to session if active
      if (sessionRef.current?.getSessionInfo()) {
        sessionRef.current.sendBeat(bpm, rr_interval);
      }

      // Record if recording
      if (recordedBeatsRef.current !== null && isRecording) {
        recordedBeatsRef.current.push({
          bpm,
          rr_interval,
          timestamp: Date.now(),
        });
      }
    });

    detectorRef.current.onConnect(() => {
      setIsLiveConnected(true);
    });

    detectorRef.current.onDisconnect(() => {
      setIsLiveConnected(false);
      setConnectionType("disconnected");
    });

    // Set up breathing guide
    breathingRef.current.onPhaseUpdate((phase, progress) => {
      setBreathingPhase(phase);
      if (breathingRef.current) {
        setBreathingScale(breathingRef.current.getScale());
        setBreathingLabel(breathingRef.current.getLabel());
      }
    });

    return () => {
      detectorRef.current?.disconnect();
      playerRef.current?.stop();
      sessionRef.current?.endSession();
      breathingRef.current?.stop();
    };
  }, []);

  // Track recording state in ref for the beat callback
  const isRecordingRef = useRef(isRecording);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // --- Generate handler ---
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedPattern(null);

    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (data.success && data.pattern) {
        setGeneratedPattern(data.pattern);
        setGenerationSource(data.source);

        // Start breathing guide if available
        if (data.pattern.breathing_guide && breathingRef.current) {
          breathingRef.current.start(
            data.pattern.bpm,
            data.pattern.breathing_guide.inhale_ms,
            data.pattern.breathing_guide.hold_ms,
            data.pattern.breathing_guide.exhale_ms
          );
        }
      }
    } catch (err) {
      console.error("Generate failed:", err);
      // Fallback to local demo pattern
      const fallback = matchLocalDemo(prompt);
      setGeneratedPattern(fallback);
      setGenerationSource("demo");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt]);

  // --- Bluetooth connect ---
  const handleBluetoothConnect = useCallback(async () => {
    if (!detectorRef.current) return;
    const success = await detectorRef.current.connectBluetooth();
    if (success) {
      setConnectionType("bluetooth");
    } else {
      // Fall back to simulation
      detectorRef.current.startSimulation(72);
      setConnectionType("simulation");
    }
  }, []);

  // --- Tap mode ---
  const handleStartTap = useCallback(() => {
    if (!detectorRef.current) return;
    detectorRef.current.startTapMode();
    setConnectionType("tap");
  }, []);

  const handleTap = useCallback(() => {
    if (!detectorRef.current) return;
    detectorRef.current.registerTap();
  }, []);

  // --- Haptic playback ---
  const handlePlayHaptic = useCallback((pattern: PulsePattern) => {
    if (!playerRef.current) return;
    playerRef.current.setIntensity(pattern.intensity);
    playerRef.current.loop(pattern.haptic_sequence);
    setIsPlayingHaptic(true);
  }, []);

  const handleStopHaptic = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.stop();
    setIsPlayingHaptic(false);
  }, []);

  // --- Session management ---
  const handleShareHeartbeat = useCallback(async () => {
    if (!sessionRef.current) return;

    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-session",
          mode: activeTab === "broadcast" ? "broadcast" : "sync",
          host_name: "You",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSessionCode(data.join_code);
        await sessionRef.current.createSession(
          activeTab === "broadcast" ? "broadcast" : "sync"
        );
      }
    } catch (err) {
      console.error("Create session failed:", err);
      // Fallback to local session
      const info = await sessionRef.current.createSession(
        activeTab === "broadcast" ? "broadcast" : "sync"
      );
      setSessionCode(info.join_code);
    }
  }, [activeTab]);

  const handleJoinSession = useCallback(async (code: string) => {
    if (!sessionRef.current) return;

    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join-session",
          code,
          user_name: "You",
        }),
      });

      const data = await res.json();
      if (data.success) {
        const info = await sessionRef.current.joinSession(code);
        if (info) {
          setSessionCode(code.toUpperCase());
          setSessionParticipants(
            sessionRef.current.getParticipants().map((p) => ({
              id: p.id,
              name: p.name,
            }))
          );

          // Listen for remote beats
          sessionRef.current.onReceiveBeat((event) => {
            setRemotePattern({
              bpm: event.bpm,
              rhythm_description: "Remote heartbeat -- you are feeling someone else's pulse in real-time.",
              haptic_sequence: [event.rr_interval],
              emotional_state: bpmToEmotion(event.bpm),
              intensity: bpmToIntensity(event.bpm),
            });

            // Play haptic for each received beat
            if (playerRef.current) {
              playerRef.current.playSingleBeat(
                Math.round(65 * bpmToIntensity(event.bpm))
              );
            }
          });
        }
      }
    } catch (err) {
      console.error("Join session failed:", err);
      // Fallback to local join
      const info = await sessionRef.current.joinSession(code);
      if (info) {
        setSessionCode(code.toUpperCase());
        sessionRef.current.onReceiveBeat((event) => {
          setRemotePattern({
            bpm: event.bpm,
            rhythm_description: "Remote heartbeat -- you are feeling someone else's pulse in real-time.",
            haptic_sequence: [event.rr_interval],
            emotional_state: bpmToEmotion(event.bpm),
            intensity: bpmToIntensity(event.bpm),
          });
        });
      }
    }
  }, []);

  // --- Recording ---
  const handleStartRecording = useCallback(() => {
    recordedBeatsRef.current = [];
    setIsRecording(true);
    setRecordingStart(Date.now());
  }, []);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    const beats = recordedBeatsRef.current;

    if (beats.length < 3) return;

    const avgBpm = Math.round(
      beats.reduce((s, b) => s + b.bpm, 0) / beats.length
    );
    const duration = recordingStart
      ? Math.round((Date.now() - recordingStart) / 1000)
      : 0;

    const moment: SavedMoment = {
      id: `m_${Date.now()}`,
      name: `Recording ${new Date().toLocaleTimeString()}`,
      date: new Date().toISOString(),
      average_bpm: avgBpm,
      emotional_state: bpmToEmotion(avgBpm),
      duration_seconds: duration,
      pattern: {
        bpm: avgBpm,
        rhythm_description: `Recorded live heartbeat averaging ${avgBpm} BPM over ${duration} seconds.`,
        haptic_sequence: beats.map((b) => b.rr_interval),
        emotional_state: bpmToEmotion(avgBpm),
        intensity: bpmToIntensity(avgBpm),
      },
    };

    setSavedMoments((prev) => [moment, ...prev]);
    setRecordingStart(null);
  }, [recordingStart]);

  const handlePlayMoment = useCallback(
    (moment: SavedMoment) => {
      if (playingMomentId === moment.id) {
        handleStopHaptic();
        setPlayingMomentId(null);
        setGeneratedPattern(null);
        return;
      }

      setGeneratedPattern(moment.pattern);
      setGenerationSource("demo");
      handlePlayHaptic(moment.pattern);
      setPlayingMomentId(moment.id);

      if (moment.pattern.breathing_guide && breathingRef.current) {
        breathingRef.current.start(
          moment.pattern.bpm,
          moment.pattern.breathing_guide.inhale_ms,
          moment.pattern.breathing_guide.hold_ms,
          moment.pattern.breathing_guide.exhale_ms
        );
      }
    },
    [playingMomentId, handlePlayHaptic, handleStopHaptic]
  );

  const handleDeleteMoment = useCallback((id: string) => {
    setSavedMoments((prev) => prev.filter((m) => m.id !== id));
    if (playingMomentId === id) {
      handleStopHaptic();
      setPlayingMomentId(null);
    }
  }, [playingMomentId, handleStopHaptic]);

  // --- Chip click handler ---
  const handleChipClick = useCallback((chip: string) => {
    setPrompt(chip);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <section className="relative overflow-hidden">
        {/* Background pulse glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-12 pb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-full px-4 py-1.5 mb-6">
              <Heart className="w-4 h-4 text-rose-400" fill="currentColor" />
              <span className="text-sm text-rose-300 font-medium tracking-wide">
                Synesthesia.ai
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                PULSE
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
              Share your heartbeat. Feel someone else&apos;s.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-12">
        {/* ================================================================ */}
        {/* SECTION: Generate a Pulse                                        */}
        {/* ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-1">
            Generate a Pulse
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Describe an emotional state or moment and feel its heartbeat.
          </p>

          {/* Prompt input */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerate();
              }}
              placeholder="Describe a heartbeat... e.g., 'calm meditation' or 'nervous before a speech'"
              className="flex-1 bg-surface-800/50 border border-surface-500/30 rounded-xl px-5 py-3.5 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 transition-all text-sm"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-medium rounded-xl hover:from-rose-500 hover:to-pink-500 transition-all duration-300 shadow-lg shadow-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  />
                  Generating...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {EXAMPLE_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-surface-800/40 border border-surface-600/20 text-gray-400 hover:text-rose-300 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all duration-200 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Generation source indicator */}
          {generationSource && generatedPattern && (
            <div className="mb-4">
              <span className="text-[10px] uppercase tracking-wider text-gray-600">
                Generated via{" "}
                <span className={generationSource === "ai" ? "text-violet-400" : "text-amber-400"}>
                  {generationSource === "ai" ? "Claude AI" : "Demo patterns"}
                </span>
              </span>
            </div>
          )}

          {/* Visualizer for generated pattern */}
          <AnimatePresence mode="wait">
            {generatedPattern && (
              <motion.div
                key="generated"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <PulseVisualizer
                  pulseData={generatedPattern}
                  isLive={false}
                  onPlayHaptic={() => handlePlayHaptic(generatedPattern)}
                  onStopHaptic={handleStopHaptic}
                  isPlayingHaptic={isPlayingHaptic && !playingMomentId}
                  breathingPhase={breathingPhase}
                  breathingScale={breathingScale}
                  breathingLabel={breathingLabel}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ================================================================ */}
        {/* SECTION: Live Sharing                                            */}
        {/* ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-1">Live Sharing</h2>
          <p className="text-sm text-gray-500 mb-5">
            Connect your heartbeat and share it in real-time.
          </p>

          {/* Mode tabs */}
          <div className="flex gap-1 bg-surface-800/40 border border-surface-600/20 rounded-xl p-1 mb-6 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/20"
                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sync / Broadcast content */}
          {(activeTab === "sync" || activeTab === "broadcast") && (
            <div className="space-y-6">
              {/* Connection buttons */}
              {!isLiveConnected && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleBluetoothConnect}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl border border-surface-600/20 bg-surface-800/30 hover:bg-surface-800/50 hover:border-blue-500/20 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bluetooth className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-200">
                        Connect Heart Rate Monitor
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        BLE Heart Rate Service (0x180D)
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={handleStartTap}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl border border-surface-600/20 bg-surface-800/30 hover:bg-surface-800/50 hover:border-rose-500/20 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Hand className="w-6 h-6 text-rose-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-200">
                        Tap Your Heartbeat
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tap rhythmically to input your pulse
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* Tap input area (when in tap mode) */}
              {connectionType === "tap" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <p className="text-sm text-gray-400">
                    Tap the button below to the rhythm of your heartbeat
                  </p>
                  <motion.button
                    onClick={handleTap}
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-xl shadow-rose-500/20 active:scale-95 transition-transform"
                    whileTap={{ scale: 0.9 }}
                  >
                    <Heart className="w-10 h-10" fill="white" />
                  </motion.button>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {liveBpm > 0 ? `${liveBpm} BPM` : "Tap..."}
                  </p>
                </motion.div>
              )}

              {/* Live visualizer */}
              {isLiveConnected && livePattern && (
                <PulseVisualizer
                  pulseData={livePattern}
                  isLive={true}
                  connectionStatus={connectionType}
                  sessionCode={sessionCode}
                  participants={sessionParticipants}
                  onShareHeartbeat={handleShareHeartbeat}
                  onJoinSession={handleJoinSession}
                  onPlayHaptic={() => handlePlayHaptic(livePattern)}
                  onStopHaptic={handleStopHaptic}
                  isPlayingHaptic={isPlayingHaptic}
                  breathingPhase={breathingPhase}
                  breathingScale={breathingScale}
                  breathingLabel={breathingLabel}
                />
              )}

              {/* Remote pulse (when joined a session) */}
              {remotePattern && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Radio className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Incoming Pulse
                    </span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <PulseVisualizer
                    pulseData={remotePattern}
                    isLive={true}
                    connectionStatus="simulation"
                  />
                </div>
              )}

              {/* Recording controls */}
              {isLiveConnected && (
                <div className="flex items-center gap-3 pt-2">
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-600/20 bg-surface-800/30 text-gray-400 hover:text-rose-300 hover:border-rose-500/20 transition-all text-sm"
                    >
                      <Disc className="w-4 h-4" />
                      Record this moment
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-all text-sm"
                    >
                      <motion.div
                        className="w-3 h-3 rounded-full bg-rose-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      />
                      Stop recording
                      {recordingStart && (
                        <RecordingTimer startTime={recordingStart} />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* Archive tab                                                    */}
          {/* ============================================================ */}
          {activeTab === "archive" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Saved Moments
              </h3>

              {savedMoments.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    No saved moments yet. Record a live heartbeat to save it here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedMoments.map((moment) => (
                    <motion.div
                      key={moment.id}
                      layout
                      className={`relative rounded-xl border bg-surface-800/30 p-4 transition-all duration-200 cursor-pointer group ${
                        playingMomentId === moment.id
                          ? "border-rose-500/30 bg-rose-500/5"
                          : "border-surface-600/20 hover:border-surface-500/30"
                      }`}
                      onClick={() => handlePlayMoment(moment)}
                    >
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMoment(moment.id);
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-surface-700/50 text-gray-600 hover:text-gray-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            playingMomentId === moment.id
                              ? "bg-rose-500/20"
                              : "bg-surface-700/40"
                          }`}
                        >
                          {playingMomentId === moment.id ? (
                            <Square className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Play className="w-4 h-4 text-gray-500 ml-0.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">
                            {moment.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(moment.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">
                            <span className="text-rose-400 font-bold text-sm tabular-nums">
                              {moment.average_bpm}
                            </span>{" "}
                            BPM
                          </span>
                          <span className="text-gray-600">
                            {formatDuration(moment.duration_seconds)}
                          </span>
                        </div>
                        <span className="text-gray-500 bg-surface-700/30 rounded-full px-2 py-0.5">
                          {moment.emotional_state}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recording timer sub-component
// ---------------------------------------------------------------------------

function RecordingTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <span className="font-mono tabular-nums text-xs ml-1">
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function bpmToEmotion(bpm: number): string {
  if (bpm < 55) return "Deep rest";
  if (bpm < 65) return "Relaxed";
  if (bpm < 75) return "Calm";
  if (bpm < 85) return "Neutral";
  if (bpm < 95) return "Alert";
  if (bpm < 110) return "Energetic";
  return "Intense";
}

function bpmToIntensity(bpm: number): number {
  // Map 40-160 BPM to 0.2-1.0 intensity
  return Math.max(0.2, Math.min(1.0, (bpm - 40) / 120));
}

function matchLocalDemo(prompt: string): PulsePattern {
  const lower = prompt.toLowerCase();
  if (/calm|meditat|peace/.test(lower)) return DEMO_PATTERNS.calm;
  if (/excit|run|marathon/.test(lower)) return DEMO_PATTERNS.excited;
  if (/sleep|rest|drift/.test(lower)) return DEMO_PATTERNS.sleeping;
  if (/anxi|nerv|stress/.test(lower)) return DEMO_PATTERNS.anxious;
  if (/love|kiss|sunset/.test(lower)) return DEMO_PATTERNS.in_love;
  return DEMO_PATTERNS.calm;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs > 0 ? secs + "s" : ""}`.trim();
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins > 0 ? remainMins + "m" : ""}`.trim();
}
