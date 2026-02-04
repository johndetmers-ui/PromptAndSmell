// ---------------------------------------------------------------------------
// Synesthesia.ai -- Haptic Engine
// ---------------------------------------------------------------------------
// Browser haptic controller using Web Vibration API and Gamepad Haptics API.
// Translates TextureProfile physical properties into vibration patterns.
// ---------------------------------------------------------------------------

import { TextureProfile, HapticEvent } from "./mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GamepadHapticActuator {
  playEffect: (type: string, params: {
    duration: number;
    startDelay?: number;
    strongMagnitude?: number;
    weakMagnitude?: number;
  }) => Promise<string>;
  reset: () => Promise<string>;
}

interface HapticGamepad extends Omit<Gamepad, 'vibrationActuator'> {
  vibrationActuator?: GamepadHapticActuator;
  hapticActuators?: GamepadHapticActuator[];
}

// ---------------------------------------------------------------------------
// HapticEngine
// ---------------------------------------------------------------------------

export class HapticEngine {
  private currentTimeout: ReturnType<typeof setTimeout> | null = null;
  private isPlaying = false;
  private loopCancelled = false;

  // -----------------------------------------------------------------------
  // Capability detection
  // -----------------------------------------------------------------------

  /**
   * Returns true if the Web Vibration API is available on this device.
   */
  isSupported(): boolean {
    if (typeof navigator === "undefined") return false;
    return "vibrate" in navigator;
  }

  /**
   * Returns true if a gamepad with haptic actuators is connected.
   */
  isGamepadHapticSupported(): boolean {
    if (typeof navigator === "undefined") return false;
    if (!("getGamepads" in navigator)) return false;
    try {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (!gp) continue;
        const hgp = gp as unknown as HapticGamepad;
        if (hgp.vibrationActuator || (hgp.hapticActuators && hgp.hapticActuators.length > 0)) {
          return true;
        }
      }
    } catch {
      // getGamepads can throw in some environments
    }
    return false;
  }

  /**
   * Returns information about available haptic hardware.
   */
  getCapabilities(): {
    vibrationApi: boolean;
    gamepadHaptics: boolean;
    anySupported: boolean;
  } {
    const vibrationApi = this.isSupported();
    const gamepadHaptics = this.isGamepadHapticSupported();
    return {
      vibrationApi,
      gamepadHaptics,
      anySupported: vibrationApi || gamepadHaptics,
    };
  }

  // -----------------------------------------------------------------------
  // Core playback
  // -----------------------------------------------------------------------

  /**
   * Play a sequence of haptic events (vibrate/pause) using the Vibration API.
   * Returns the pattern data array even if no hardware is available
   * (for visualization-only fallback).
   */
  async playPattern(pattern: HapticEvent[]): Promise<number[]> {
    this.stop();
    this.isPlaying = true;
    this.loopCancelled = false;

    // Build a vibration API pattern: alternating vibrate/pause durations
    const vibrationPattern: number[] = [];
    for (const event of pattern) {
      if (event.type === "vibrate") {
        // The Web Vibration API only supports on/off with duration.
        // We approximate intensity by shortening the vibrate duration
        // relative to the original and inserting micro-pauses.
        const effectiveDuration = Math.round(event.duration_ms * event.intensity);
        const remainder = event.duration_ms - effectiveDuration;
        vibrationPattern.push(effectiveDuration);
        if (remainder > 0) {
          vibrationPattern.push(remainder);
        }
      } else {
        // Pause
        vibrationPattern.push(0); // zero vibration
        vibrationPattern.push(event.duration_ms);
      }
    }

    // Try Vibration API
    if (this.isSupported()) {
      try {
        navigator.vibrate(vibrationPattern);
      } catch {
        // Vibration may fail silently on some devices
      }
    }

    // Try Gamepad Haptics API for richer feedback
    this.tryGamepadHaptics(pattern);

    // Calculate total duration for timeout cleanup
    const totalDuration = pattern.reduce((sum, e) => sum + e.duration_ms, 0);
    this.currentTimeout = setTimeout(() => {
      this.isPlaying = false;
    }, totalDuration);

    return vibrationPattern;
  }

  /**
   * Map a 256-value waveform array to a vibration pattern and play it.
   */
  async playWaveform(waveform: number[], duration_ms: number = 2000): Promise<number[]> {
    this.stop();
    this.isPlaying = true;

    const sampleDuration = duration_ms / waveform.length;
    const vibrationPattern: number[] = [];

    for (let i = 0; i < waveform.length; i++) {
      const amplitude = Math.max(0, Math.min(1, waveform[i]));
      // Convert amplitude to vibrate/pause ratio within each sample
      const vibrateTime = Math.round(sampleDuration * amplitude);
      const pauseTime = Math.round(sampleDuration * (1 - amplitude));

      if (vibrateTime > 0) {
        vibrationPattern.push(vibrateTime);
      }
      if (pauseTime > 0 && i < waveform.length - 1) {
        vibrationPattern.push(pauseTime);
      }
    }

    if (this.isSupported()) {
      try {
        navigator.vibrate(vibrationPattern);
      } catch {
        // Vibration may fail silently
      }
    }

    this.currentTimeout = setTimeout(() => {
      this.isPlaying = false;
    }, duration_ms);

    return vibrationPattern;
  }

  /**
   * Convert a TextureProfile into a repeating haptic loop and play it.
   * Physical properties influence the pattern:
   *   - Higher friction  = more frequent vibrations
   *   - Higher grain     = irregular spacing between pulses
   *   - Higher roughness = stronger intensity
   *   - Temperature      = vibration frequency (cold=high-freq short, warm=low-freq long)
   *   - Elasticity       = bounce-like pattern modulation
   *   - Moisture         = smoother transitions between pulses
   *   - Resistance       = longer sustained vibrations
   */
  async playTexture(texture: TextureProfile, loops: number = 3): Promise<HapticEvent[]> {
    this.stop();
    this.isPlaying = true;
    this.loopCancelled = false;

    const props = texture.physical_properties;
    const pattern = this.textureToHapticPattern(props);

    // Play the pattern in a loop
    const playLoop = async (remaining: number) => {
      if (remaining <= 0 || this.loopCancelled) {
        this.isPlaying = false;
        return;
      }
      await this.playPattern(pattern);
      const duration = pattern.reduce((sum, e) => sum + e.duration_ms, 0);
      this.currentTimeout = setTimeout(() => {
        playLoop(remaining - 1);
      }, duration);
    };

    playLoop(loops);
    return pattern;
  }

  /**
   * Stop any currently playing haptic feedback.
   */
  stop(): void {
    this.loopCancelled = true;
    this.isPlaying = false;

    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    // Cancel vibration
    if (this.isSupported()) {
      try {
        navigator.vibrate(0);
      } catch {
        // Ignore
      }
    }

    // Cancel gamepad haptics
    this.stopGamepadHaptics();
  }

  /**
   * Whether haptic playback is currently active.
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // -----------------------------------------------------------------------
  // Texture-to-pattern conversion
  // -----------------------------------------------------------------------

  /**
   * Converts physical properties to a HapticEvent[] pattern.
   * Exported for visualization even when no haptic hardware is available.
   */
  textureToHapticPattern(props: {
    friction: number;
    grain: number;
    temperature: number;
    resistance: number;
    elasticity: number;
    moisture: number;
    roughness: number;
  }): HapticEvent[] {
    const pattern: HapticEvent[] = [];
    const numPulses = 4 + Math.round(props.friction * 8); // 4-12 pulses

    // Base frequency: cold = high freq (250-350Hz), warm = low freq (30-80Hz)
    // temperature ranges from -1 (cold) to 1 (hot)
    const normalizedTemp = (props.temperature + 1) / 2; // 0 (cold) to 1 (hot)
    const baseFrequency = 350 - normalizedTemp * 300; // 350Hz (cold) to 50Hz (hot)

    // Base duration: cold = short (20-50ms), warm = long (150-400ms)
    const baseDuration = 20 + normalizedTemp * 280;

    // Intensity from roughness
    const baseIntensity = 0.15 + props.roughness * 0.75;

    // Seeded pseudo-random for grain irregularity
    let seed = Math.round(
      props.friction * 100 + props.grain * 200 + props.roughness * 300
    );
    const seededRandom = () => {
      seed = (seed * 16807 + 1) % 2147483647;
      return (seed % 1000) / 1000;
    };

    for (let i = 0; i < numPulses; i++) {
      // Grain adds irregularity to timing and intensity
      const grainVariation = props.grain * (seededRandom() - 0.5);
      const moistureSmooth = 1 - props.moisture * 0.5; // moisture makes transitions smoother

      // Vibrate event
      const vibDuration = Math.max(
        10,
        Math.round(baseDuration * (1 + grainVariation) * (0.5 + props.resistance * 0.8))
      );
      const vibIntensity = Math.max(
        0.05,
        Math.min(1, baseIntensity + grainVariation * 0.3)
      );
      const vibFrequency = Math.max(
        20,
        Math.round(baseFrequency * (1 + grainVariation * 0.3))
      );

      pattern.push({
        type: "vibrate",
        duration_ms: vibDuration,
        intensity: vibIntensity,
        frequency_hz: vibFrequency,
      });

      // Pause event (shorter for high friction, longer for low friction)
      const basePause = 150 - props.friction * 120; // 30ms (high friction) to 150ms (low friction)
      const pauseVariation = props.grain * seededRandom() * 80;
      const pauseDuration = Math.max(
        5,
        Math.round((basePause + pauseVariation) * moistureSmooth)
      );

      // Elasticity adds a "bounce" -- extra short vibrate after pause
      if (props.elasticity > 0.5 && i < numPulses - 1) {
        const bounceDuration = Math.round(vibDuration * 0.3 * props.elasticity);
        const bounceIntensity = vibIntensity * 0.5 * props.elasticity;

        pattern.push({
          type: "pause",
          duration_ms: Math.round(pauseDuration * 0.4),
          intensity: 0,
        });

        pattern.push({
          type: "vibrate",
          duration_ms: Math.max(5, bounceDuration),
          intensity: Math.max(0.05, bounceIntensity),
          frequency_hz: Math.round(vibFrequency * 1.2),
        });

        pattern.push({
          type: "pause",
          duration_ms: Math.round(pauseDuration * 0.6),
          intensity: 0,
        });
      } else {
        pattern.push({
          type: "pause",
          duration_ms: pauseDuration,
          intensity: 0,
        });
      }
    }

    return pattern;
  }

  // -----------------------------------------------------------------------
  // Gamepad Haptics API (DualSense, Xbox controllers)
  // -----------------------------------------------------------------------

  private tryGamepadHaptics(pattern: HapticEvent[]): void {
    if (typeof navigator === "undefined" || !("getGamepads" in navigator)) return;

    try {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (!gp) continue;
        const hgp = gp as unknown as HapticGamepad;

        // Try vibrationActuator (standard)
        if (hgp.vibrationActuator) {
          let delay = 0;
          for (const event of pattern) {
            if (event.type === "vibrate") {
              hgp.vibrationActuator.playEffect("dual-rumble", {
                duration: event.duration_ms,
                startDelay: delay,
                strongMagnitude: event.intensity * 0.8,
                weakMagnitude: event.intensity * 0.4,
              }).catch(() => {
                // Silently ignore gamepad haptic errors
              });
            }
            delay += event.duration_ms;
          }
          return; // Use first available gamepad
        }

        // Try hapticActuators array (older spec)
        if (hgp.hapticActuators && hgp.hapticActuators.length > 0) {
          let delay = 0;
          for (const event of pattern) {
            if (event.type === "vibrate") {
              for (const actuator of hgp.hapticActuators) {
                actuator.playEffect("dual-rumble", {
                  duration: event.duration_ms,
                  startDelay: delay,
                  strongMagnitude: event.intensity,
                  weakMagnitude: event.intensity * 0.5,
                }).catch(() => {
                  // Silently ignore
                });
              }
            }
            delay += event.duration_ms;
          }
          return;
        }
      }
    } catch {
      // Gamepad API not available or permission denied
    }
  }

  private stopGamepadHaptics(): void {
    if (typeof navigator === "undefined" || !("getGamepads" in navigator)) return;

    try {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (!gp) continue;
        const hgp = gp as unknown as HapticGamepad;
        if (hgp.vibrationActuator) {
          hgp.vibrationActuator.reset().catch(() => {});
        }
        if (hgp.hapticActuators) {
          for (const actuator of hgp.hapticActuators) {
            actuator.reset().catch(() => {});
          }
        }
      }
    } catch {
      // Ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

let _instance: HapticEngine | null = null;

export function getHapticEngine(): HapticEngine {
  if (!_instance) {
    _instance = new HapticEngine();
  }
  return _instance;
}

export default HapticEngine;
