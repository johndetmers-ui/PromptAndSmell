// ============================================================================
// Synesthesia.ai -- PULSE Engine
// Client-side heartbeat detection, haptic playback, session management,
// and breathing synchronization.
// ============================================================================

import {
  generateRRIntervals,
  addVariability,
  rrIntervalsToVibratePattern,
} from "./waveform";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PulsePattern {
  bpm: number;
  rhythm_description: string;
  haptic_sequence: number[]; // RR intervals in ms
  emotional_state: string;
  breathing_guide?: {
    inhale_ms: number;
    hold_ms: number;
    exhale_ms: number;
  };
  intensity: number; // 0..1
}

export interface BeatEvent {
  bpm: number;
  rr_interval: number; // ms since previous beat
  timestamp: number;
}

export interface SessionParticipant {
  id: string;
  name: string;
  joined_at: number;
  last_beat?: BeatEvent;
}

export interface PulseSessionInfo {
  session_id: string;
  join_code: string;
  mode: "sync" | "broadcast";
  host: SessionParticipant;
  participants: SessionParticipant[];
  created_at: number;
}

export interface SavedMoment {
  id: string;
  name: string;
  date: string;
  average_bpm: number;
  emotional_state: string;
  duration_seconds: number;
  pattern: PulsePattern;
}

// ---------------------------------------------------------------------------
// Demo Preset Patterns
// ---------------------------------------------------------------------------

export const DEMO_PATTERNS: Record<string, PulsePattern> = {
  calm: {
    bpm: 60,
    rhythm_description: "Steady and even, like gentle waves lapping at the shore",
    haptic_sequence: generateRRIntervals(60, 16, 2),
    emotional_state: "Relaxed",
    breathing_guide: { inhale_ms: 4000, hold_ms: 2000, exhale_ms: 6000 },
    intensity: 0.5,
  },
  excited: {
    bpm: 90,
    rhythm_description: "Quick and slightly irregular, pulsing with anticipation",
    haptic_sequence: generateRRIntervals(90, 16, 5),
    emotional_state: "Energetic",
    breathing_guide: { inhale_ms: 3000, hold_ms: 1000, exhale_ms: 3000 },
    intensity: 0.8,
  },
  sleeping: {
    bpm: 52,
    rhythm_description: "Very slow and deeply regular, the rhythm of deep rest",
    haptic_sequence: generateRRIntervals(52, 12, 1.5),
    emotional_state: "Deep rest",
    breathing_guide: { inhale_ms: 5000, hold_ms: 3000, exhale_ms: 7000 },
    intensity: 0.3,
  },
  anxious: {
    bpm: 85,
    rhythm_description: "Somewhat fast and noticeably irregular, with occasional skips",
    haptic_sequence: generateRRIntervals(85, 16, 8),
    emotional_state: "Tense",
    breathing_guide: { inhale_ms: 4000, hold_ms: 4000, exhale_ms: 6000 },
    intensity: 0.7,
  },
  in_love: {
    bpm: 75,
    rhythm_description: "Warm and slightly elevated, a gentle flutter of connection",
    haptic_sequence: generateRRIntervals(75, 16, 4),
    emotional_state: "Warm affection",
    breathing_guide: { inhale_ms: 4000, hold_ms: 2000, exhale_ms: 5000 },
    intensity: 0.65,
  },
};

// ---------------------------------------------------------------------------
// HeartbeatDetector
// ---------------------------------------------------------------------------

type BeatCallback = (bpm: number, rr_interval: number) => void;
type ConnectionCallback = () => void;

export class HeartbeatDetector {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onBeatCallbacks: BeatCallback[] = [];
  private onConnectCallbacks: ConnectionCallback[] = [];
  private onDisconnectCallbacks: ConnectionCallback[] = [];
  private connected = false;

  // Manual tap detection state
  private tapTimestamps: number[] = [];
  private tapMode = false;

  // Simulation state
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private simulationBpm = 72;

  /**
   * Register a callback for each detected heartbeat.
   */
  onBeat(callback: BeatCallback): void {
    this.onBeatCallbacks.push(callback);
  }

  /**
   * Register a callback for connection events.
   */
  onConnect(callback: ConnectionCallback): void {
    this.onConnectCallbacks.push(callback);
  }

  /**
   * Register a callback for disconnection events.
   */
  onDisconnect(callback: ConnectionCallback): void {
    this.onDisconnectCallbacks.push(callback);
  }

  /**
   * Attempt to connect to a BLE Heart Rate Monitor.
   * Uses the standard Heart Rate Service (0x180D) and Heart Rate Measurement
   * characteristic (0x2A37).
   */
  async connectBluetooth(): Promise<boolean> {
    try {
      if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
        console.warn("Web Bluetooth not available. Use tap mode or simulation instead.");
        return false;
      }

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["heart_rate"] }],
        optionalServices: ["heart_rate"],
      });

      if (!this.device) return false;

      this.device.addEventListener("gattserverdisconnected", () => {
        this.connected = false;
        this.onDisconnectCallbacks.forEach((cb) => cb());
      });

      const server = await this.device.gatt!.connect();
      const service = await server.getPrimaryService("heart_rate");
      this.characteristic = await service.getCharacteristic("heart_rate_measurement");

      await this.characteristic.startNotifications();
      this.characteristic.addEventListener(
        "characteristicvaluechanged",
        this.handleHeartRateNotification.bind(this)
      );

      this.connected = true;
      this.onConnectCallbacks.forEach((cb) => cb());
      return true;
    } catch (err) {
      console.error("Bluetooth connection failed:", err);
      return false;
    }
  }

  /**
   * Parse the Heart Rate Measurement characteristic value.
   * Byte 0, bit 0: 0 = BPM is uint8 in byte 1; 1 = BPM is uint16 in bytes 1-2.
   * If RR-interval data is present (bit 4 of flags), it follows the BPM field.
   */
  private handleHeartRateNotification(event: Event): void {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const flags = value.getUint8(0);
    const is16Bit = flags & 0x01;
    let bpm: number;
    let offset: number;

    if (is16Bit) {
      bpm = value.getUint16(1, true);
      offset = 3;
    } else {
      bpm = value.getUint8(1);
      offset = 2;
    }

    // Check for RR-interval presence (bit 4)
    const hasRR = (flags >> 4) & 0x01;
    let rrInterval = Math.round(60000 / bpm); // default from BPM

    if (hasRR && offset + 1 < value.byteLength) {
      // RR-interval is in 1/1024 second units
      const rrRaw = value.getUint16(offset, true);
      rrInterval = Math.round((rrRaw / 1024) * 1000);
    }

    this.emitBeat(bpm, rrInterval);
  }

  /**
   * Start manual tap mode. Call registerTap() each time the user taps.
   */
  startTapMode(): void {
    this.tapMode = true;
    this.tapTimestamps = [];
    this.connected = true;
    this.onConnectCallbacks.forEach((cb) => cb());
  }

  /**
   * Register a single tap (user tapping to their heartbeat).
   */
  registerTap(): void {
    if (!this.tapMode) return;

    const now = Date.now();
    this.tapTimestamps.push(now);

    // Keep only last 10 taps for moving average
    if (this.tapTimestamps.length > 10) {
      this.tapTimestamps.shift();
    }

    if (this.tapTimestamps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < this.tapTimestamps.length; i++) {
        intervals.push(this.tapTimestamps[i] - this.tapTimestamps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avgInterval);
      const lastInterval = intervals[intervals.length - 1];
      this.emitBeat(bpm, lastInterval);
    }
  }

  /**
   * Start a simulation that generates realistic heartbeat events.
   * @param baseBpm - The target BPM to simulate around
   */
  startSimulation(baseBpm: number = 72): void {
    this.stopSimulation();
    this.simulationBpm = baseBpm;
    this.connected = true;
    this.onConnectCallbacks.forEach((cb) => cb());

    let time = 0;
    const tick = () => {
      const currentBpm = addVariability(this.simulationBpm, 3, time);
      const interval = Math.round(60000 / currentBpm);
      this.emitBeat(Math.round(currentBpm), interval);
      time += interval;
      this.simulationInterval = setTimeout(tick, interval);
    };

    // First beat immediately
    const firstBpm = addVariability(this.simulationBpm, 3, 0);
    const firstInterval = Math.round(60000 / firstBpm);
    this.emitBeat(Math.round(firstBpm), firstInterval);
    time += firstInterval;
    this.simulationInterval = setTimeout(tick, firstInterval);
  }

  /**
   * Update the simulation BPM (for live adjustment).
   */
  setSimulationBpm(bpm: number): void {
    this.simulationBpm = bpm;
  }

  /**
   * Stop the simulation.
   */
  stopSimulation(): void {
    if (this.simulationInterval) {
      clearTimeout(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Disconnect from all sources.
   */
  disconnect(): void {
    this.stopSimulation();
    this.tapMode = false;
    this.tapTimestamps = [];

    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.connected = false;
    this.onDisconnectCallbacks.forEach((cb) => cb());
  }

  isConnected(): boolean {
    return this.connected;
  }

  isTapMode(): boolean {
    return this.tapMode;
  }

  private emitBeat(bpm: number, rr_interval: number): void {
    this.onBeatCallbacks.forEach((cb) => cb(bpm, rr_interval));
  }
}

// ---------------------------------------------------------------------------
// HapticPulsePlayer
// ---------------------------------------------------------------------------

export class HapticPulsePlayer {
  private playing = false;
  private loopTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentPattern: number[] = [];
  private intensity: number = 1.0;

  /**
   * Check if haptic vibration is available.
   */
  static isAvailable(): boolean {
    return typeof navigator !== "undefined" && "vibrate" in navigator;
  }

  /**
   * Set global intensity (0..1). Affects pulse duration.
   */
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Play a rhythm pattern once.
   * @param rrIntervals - Array of inter-beat intervals in ms
   * @param pulseDuration - Base pulse vibration length in ms
   */
  playOnce(rrIntervals: number[], pulseDuration: number = 65): void {
    if (!HapticPulsePlayer.isAvailable()) return;

    this.stop();
    this.playing = true;
    this.currentPattern = rrIntervals;

    const vibratePattern = rrIntervalsToVibratePattern(
      rrIntervals,
      pulseDuration,
      this.intensity
    );

    navigator.vibrate(vibratePattern);

    // Auto-stop after pattern completes
    const totalDuration = vibratePattern.reduce((a, b) => a + b, 0);
    this.loopTimeout = setTimeout(() => {
      this.playing = false;
    }, totalDuration);
  }

  /**
   * Loop a rhythm pattern continuously.
   * @param rrIntervals - Array of inter-beat intervals in ms
   * @param pulseDuration - Base pulse vibration length in ms
   */
  loop(rrIntervals: number[], pulseDuration: number = 65): void {
    if (!HapticPulsePlayer.isAvailable()) return;

    this.stop();
    this.playing = true;
    this.currentPattern = rrIntervals;

    const playAndRepeat = () => {
      if (!this.playing) return;

      const vibratePattern = rrIntervalsToVibratePattern(
        this.currentPattern,
        pulseDuration,
        this.intensity
      );

      navigator.vibrate(vibratePattern);

      const totalDuration = vibratePattern.reduce((a, b) => a + b, 0);
      this.loopTimeout = setTimeout(playAndRepeat, totalDuration);
    };

    playAndRepeat();
  }

  /**
   * Play a single beat pulse (for real-time beat-by-beat playback).
   * @param durationMs - Pulse duration in ms
   */
  playSingleBeat(durationMs: number = 65): void {
    if (!HapticPulsePlayer.isAvailable()) return;
    const effectiveDuration = Math.round(
      durationMs * Math.max(0.3, this.intensity)
    );
    navigator.vibrate(effectiveDuration);
  }

  /**
   * Stop all haptic playback.
   */
  stop(): void {
    this.playing = false;
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
    if (HapticPulsePlayer.isAvailable()) {
      navigator.vibrate(0); // cancel any ongoing vibration
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getCurrentPattern(): number[] {
    return [...this.currentPattern];
  }
}

// ---------------------------------------------------------------------------
// PulseSession (demo-mode local simulation)
// ---------------------------------------------------------------------------

export class PulseSession {
  private sessionInfo: PulseSessionInfo | null = null;
  private beatCallbacks: ((event: BeatEvent, participant: SessionParticipant) => void)[] = [];
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private localParticipantId: string;
  private simulatedRemoteBpm = 72;

  constructor() {
    this.localParticipantId = this.generateId();
  }

  /**
   * Create a new sharing session.
   */
  async createSession(
    mode: "sync" | "broadcast" = "sync",
    hostName: string = "You"
  ): Promise<PulseSessionInfo> {
    const sessionId = this.generateId();
    const joinCode = this.generateJoinCode();

    this.sessionInfo = {
      session_id: sessionId,
      join_code: joinCode,
      mode,
      host: {
        id: this.localParticipantId,
        name: hostName,
        joined_at: Date.now(),
      },
      participants: [],
      created_at: Date.now(),
    };

    return this.sessionInfo;
  }

  /**
   * Join an existing session by code.
   * In demo mode this simulates a successful join and starts receiving
   * simulated heartbeat data from the "host".
   */
  async joinSession(
    code: string,
    userName: string = "Guest"
  ): Promise<PulseSessionInfo | null> {
    // In demo mode, any 6-character code is accepted
    if (!code || code.length !== 6) {
      return null;
    }

    const hostId = this.generateId();
    this.sessionInfo = {
      session_id: this.generateId(),
      join_code: code.toUpperCase(),
      mode: "sync",
      host: {
        id: hostId,
        name: "Remote User",
        joined_at: Date.now() - 30000,
      },
      participants: [
        {
          id: this.localParticipantId,
          name: userName,
          joined_at: Date.now(),
        },
      ],
      created_at: Date.now() - 30000,
    };

    // Start simulating remote heartbeat data
    this.startRemoteSimulation();

    return this.sessionInfo;
  }

  /**
   * Send a beat event to the session (would go over WebSocket in production).
   * In demo mode this is a no-op since we simulate both sides locally.
   */
  sendBeat(bpm: number, rr_interval: number): void {
    if (!this.sessionInfo) return;

    const event: BeatEvent = {
      bpm,
      rr_interval,
      timestamp: Date.now(),
    };

    // In a real implementation this would transmit over WebSocket/SSE
    // For demo, we just update the local host's last beat
    this.sessionInfo.host.last_beat = event;
  }

  /**
   * Register a handler for incoming beat events from remote participants.
   */
  onReceiveBeat(
    callback: (event: BeatEvent, participant: SessionParticipant) => void
  ): void {
    this.beatCallbacks.push(callback);
  }

  /**
   * Get all participants in the session.
   */
  getParticipants(): SessionParticipant[] {
    if (!this.sessionInfo) return [];
    return [this.sessionInfo.host, ...this.sessionInfo.participants];
  }

  /**
   * Get session info.
   */
  getSessionInfo(): PulseSessionInfo | null {
    return this.sessionInfo;
  }

  /**
   * Set the simulated remote BPM (for demo adjustment).
   */
  setSimulatedRemoteBpm(bpm: number): void {
    this.simulatedRemoteBpm = bpm;
  }

  /**
   * End the session and clean up.
   */
  endSession(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.sessionInfo = null;
    this.beatCallbacks = [];
  }

  /**
   * Simulate receiving heartbeat data from a remote participant.
   */
  private startRemoteSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    let time = 0;

    const tick = () => {
      if (!this.sessionInfo) return;

      const bpm = addVariability(this.simulatedRemoteBpm, 4, time);
      const interval = Math.round(60000 / bpm);
      const event: BeatEvent = {
        bpm: Math.round(bpm),
        rr_interval: interval,
        timestamp: Date.now(),
      };

      // Update the host's last beat
      this.sessionInfo.host.last_beat = event;

      // Notify all callbacks
      this.beatCallbacks.forEach((cb) =>
        cb(event, this.sessionInfo!.host)
      );

      time += interval;

      // Schedule next beat based on the actual interval
      if (this.simulationInterval) {
        clearTimeout(this.simulationInterval);
      }
      this.simulationInterval = setTimeout(tick, interval);
    };

    // Start with a slight delay
    this.simulationInterval = setTimeout(tick, 500);
  }

  private generateId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 12 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  }

  private generateJoinCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  }
}

// ---------------------------------------------------------------------------
// BreathingGuide
// ---------------------------------------------------------------------------

export type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

export class BreathingGuide {
  private running = false;
  private phase: BreathingPhase = "rest";
  private phaseStartTime = 0;
  private cycleDuration = 0;
  private inhaleMs = 4000;
  private holdMs = 2000;
  private exhaleMs = 6000;
  private animationFrame: number | null = null;
  private phaseCallbacks: ((phase: BreathingPhase, progress: number) => void)[] = [];

  /**
   * Start the breathing guide.
   * @param bpm - Target heart rate (used to calibrate breathing cycle)
   * @param inhale_ms - Inhale duration
   * @param hold_ms - Hold duration
   * @param exhale_ms - Exhale duration
   */
  start(
    bpm: number = 60,
    inhale_ms: number = 4000,
    hold_ms: number = 2000,
    exhale_ms: number = 6000
  ): void {
    this.stop();

    // Optionally scale breathing to heart rate for coherence
    // A coherence ratio of ~5-6 breaths/min works well with most HRs
    const breathsPerMinute = Math.max(4, Math.min(8, bpm / 12));
    const idealCycleMs = 60000 / breathsPerMinute;

    // Scale provided durations to match the ideal cycle length
    const providedTotal = inhale_ms + hold_ms + exhale_ms;
    const scale = idealCycleMs / providedTotal;

    this.inhaleMs = Math.round(inhale_ms * scale);
    this.holdMs = Math.round(hold_ms * scale);
    this.exhaleMs = Math.round(exhale_ms * scale);
    this.cycleDuration = this.inhaleMs + this.holdMs + this.exhaleMs;

    this.running = true;
    this.phaseStartTime = Date.now();
    this.phase = "inhale";

    this.tick();
  }

  /**
   * Stop the breathing guide.
   */
  stop(): void {
    this.running = false;
    this.phase = "rest";
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Register a callback that fires on each animation frame with current phase and progress.
   */
  onPhaseUpdate(callback: (phase: BreathingPhase, progress: number) => void): void {
    this.phaseCallbacks.push(callback);
  }

  /**
   * Get current phase.
   */
  getPhase(): BreathingPhase {
    return this.phase;
  }

  /**
   * Get the current breathing circle scale (0..1 where 1 = fully expanded).
   */
  getScale(): number {
    if (!this.running) return 0.3;

    const elapsed = (Date.now() - this.phaseStartTime) % this.cycleDuration;

    if (elapsed < this.inhaleMs) {
      // Inhale: 0.3 -> 1.0
      const progress = elapsed / this.inhaleMs;
      return 0.3 + 0.7 * this.easeInOutSine(progress);
    } else if (elapsed < this.inhaleMs + this.holdMs) {
      // Hold: stay at 1.0
      return 1.0;
    } else {
      // Exhale: 1.0 -> 0.3
      const progress = (elapsed - this.inhaleMs - this.holdMs) / this.exhaleMs;
      return 1.0 - 0.7 * this.easeInOutSine(progress);
    }
  }

  /**
   * Get the label text for the current phase.
   */
  getLabel(): string {
    switch (this.phase) {
      case "inhale":
        return "Breathe in...";
      case "hold":
        return "Hold...";
      case "exhale":
        return "Breathe out...";
      case "rest":
        return "";
    }
  }

  /**
   * Get timing info.
   */
  getTiming(): { inhaleMs: number; holdMs: number; exhaleMs: number } {
    return {
      inhaleMs: this.inhaleMs,
      holdMs: this.holdMs,
      exhaleMs: this.exhaleMs,
    };
  }

  private tick(): void {
    if (!this.running) return;

    const elapsed = (Date.now() - this.phaseStartTime) % this.cycleDuration;

    let newPhase: BreathingPhase;
    let progress: number;

    if (elapsed < this.inhaleMs) {
      newPhase = "inhale";
      progress = elapsed / this.inhaleMs;
    } else if (elapsed < this.inhaleMs + this.holdMs) {
      newPhase = "hold";
      progress = (elapsed - this.inhaleMs) / this.holdMs;
    } else {
      newPhase = "exhale";
      progress = (elapsed - this.inhaleMs - this.holdMs) / this.exhaleMs;
    }

    this.phase = newPhase;
    this.phaseCallbacks.forEach((cb) => cb(newPhase, progress));

    this.animationFrame = requestAnimationFrame(() => this.tick());
  }

  private easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }
}
