// ---------------------------------------------------------------------------
// Ambient Sound Generator -- Browser-based Web Audio API sound generation
// ---------------------------------------------------------------------------
// Generates procedural ambient soundscapes using oscillators, noise buffers,
// and gain modulation. No external audio files required.
// ---------------------------------------------------------------------------

export type AmbientPreset =
  | "rain"
  | "fireplace"
  | "waves"
  | "wind"
  | "birds"
  | "thunder"
  | "cafe"
  | "forest"
  | "white_noise";

interface NoiseBuffers {
  white: AudioBuffer;
  pink: AudioBuffer;
  brown: AudioBuffer;
}

interface ActiveLayer {
  sources: (AudioBufferSourceNode | OscillatorNode)[];
  gains: GainNode[];
  intervals: ReturnType<typeof setInterval>[];
  timeouts: ReturnType<typeof setTimeout>[];
}

export class AmbientSoundGenerator {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffers: NoiseBuffers | null = null;
  private activeLayer: ActiveLayer | null = null;
  private currentPreset: AmbientPreset | null = null;
  private _volume: number = 0.5;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMasterGain(): GainNode {
    this.getContext();
    return this.masterGain!;
  }

  private generateNoiseBuffers(): NoiseBuffers {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const duration = 4;
    const length = sampleRate * duration;

    // White noise
    const whiteBuffer = ctx.createBuffer(1, length, sampleRate);
    const whiteData = whiteBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }

    // Pink noise (Paul Kellet's algorithm)
    const pinkBuffer = ctx.createBuffer(1, length, sampleRate);
    const pinkData = pinkBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    // Brown noise (integration of white noise)
    const brownBuffer = ctx.createBuffer(1, length, sampleRate);
    const brownData = brownBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      brownData[i] = lastOut * 3.5;
    }

    return { white: whiteBuffer, pink: pinkBuffer, brown: brownBuffer };
  }

  private getNoiseBuffers(): NoiseBuffers {
    if (!this.noiseBuffers) {
      this.noiseBuffers = this.generateNoiseBuffers();
    }
    return this.noiseBuffers;
  }

  private createNoiseSource(type: "white" | "pink" | "brown"): AudioBufferSourceNode {
    const ctx = this.getContext();
    const buffers = this.getNoiseBuffers();
    const source = ctx.createBufferSource();
    source.buffer = buffers[type];
    source.loop = true;
    return source;
  }

  private clearActiveLayer(): void {
    if (this.activeLayer) {
      for (const interval of this.activeLayer.intervals) {
        clearInterval(interval);
      }
      for (const timeout of this.activeLayer.timeouts) {
        clearTimeout(timeout);
      }
      for (const source of this.activeLayer.sources) {
        try {
          source.stop();
        } catch {
          // source may already be stopped
        }
        source.disconnect();
      }
      for (const gain of this.activeLayer.gains) {
        gain.disconnect();
      }
      this.activeLayer = null;
    }
  }

  private createActiveLayer(): ActiveLayer {
    return { sources: [], gains: [], intervals: [], timeouts: [] };
  }

  // --- Preset implementations ---

  private playRain(): void {
    const ctx = this.getContext();
    const master = this.getMasterGain();
    const layer = this.createActiveLayer();

    // Base rain: pink noise
    const rainSource = this.createNoiseSource("pink");
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.6;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = "lowpass";
    rainFilter.frequency.value = 8000;
    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(master);
    rainSource.start();
    layer.sources.push(rainSource);
    layer.gains.push(rainGain);

    // Droplet layer: random gain modulation
    const dropSource = this.createNoiseSource("white");
    const dropGain = ctx.createGain();
    dropGain.gain.value = 0;
    const dropFilter = ctx.createBiquadFilter();
    dropFilter.type = "bandpass";
    dropFilter.frequency.value = 4000;
    dropFilter.Q.value = 2;
    dropSource.connect(dropFilter);
    dropFilter.connect(dropGain);
    dropGain.connect(master);
    dropSource.start();
    layer.sources.push(dropSource);
    layer.gains.push(dropGain);

    // Random droplet bursts
    const dropInterval = setInterval(() => {
      const now = ctx.currentTime;
      const intensity = 0.1 + Math.random() * 0.3;
      dropGain.gain.setValueAtTime(0, now);
      dropGain.gain.linearRampToValueAtTime(intensity, now + 0.01);
      dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05 + Math.random() * 0.1);
    }, 50 + Math.random() * 100);
    layer.intervals.push(dropInterval);

    this.activeLayer = layer;
  }

  private playFireplace(): void {
    const ctx = this.getContext();
    const master = this.getMasterGain();
    const layer = this.createActiveLayer();

    // Base crackle: brown noise
    const baseSource = this.createNoiseSource("brown");
    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.4;
    const baseLPF = ctx.createBiquadFilter();
    baseLPF.type = "lowpass";
    baseLPF.frequency.value = 600;
    baseSource.connect(baseLPF);
    baseLPF.connect(baseGain);
    baseGain.connect(master);
    baseSource.start();
    layer.sources.push(baseSource);
    layer.gains.push(baseGain);

    // Crackle layer: white noise bursts with bandpass
    const crackleSource = this.createNoiseSource("white");
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0;
    const crackleBPF = ctx.createBiquadFilter();
    crackleBPF.type = "bandpass";
    crackleBPF.frequency.value = 3000;
    crackleBPF.Q.value = 3;
    crackleSource.connect(crackleBPF);
    crackleBPF.connect(crackleGain);
    crackleGain.connect(master);
    crackleSource.start();
    layer.sources.push(crackleSource);
    layer.gains.push(crackleGain);

    // Random crackle pops
    const crackleInterval = setInterval(() => {
      const now = ctx.currentTime;
      const pop = 0.15 + Math.random() * 0.35;
      crackleGain.gain.setValueAtTime(0, now);
      crackleGain.gain.linearRampToValueAtTime(pop, now + 0.005);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02 + Math.random() * 0.08);
    }, 80 + Math.random() * 250);
    layer.intervals.push(crackleInterval);

    // Occasional louder pops
    const popInterval = setInterval(() => {
      const now = ctx.currentTime;
      crackleGain.gain.setValueAtTime(0, now);
      crackleGain.gain.linearRampToValueAtTime(0.5 + Math.random() * 0.3, now + 0.003);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05 + Math.random() * 0.1);
    }, 2000 + Math.random() * 5000);
    layer.intervals.push(popInterval);

    this.activeLayer = layer;
  }

  private playWaves(): void {
    const ctx = this.getContext();
    const master = this.getMasterGain();
    const layer = this.createActiveLayer();

    // Ocean base: pink noise with LPF
    const oceanSource = this.createNoiseSource("pink");
    const oceanGain = ctx.createGain();
    oceanGain.gain.value = 0.5;
    const oceanLPF = ctx.createBiquadFilter();
    oceanLPF.type = "lowpass";
    oceanLPF.frequency.value = 1200;
    oceanSource.connect(oceanLPF);
    oceanLPF.connect(oceanGain);
    oceanGain.connect(master);
    oceanSource.start();
    layer.sources.push(oceanSource);
    layer.gains.push(oceanGain);

    // Wave rhythm: slow sine modulation on gain
    const modulateWave = () => {
      const now = ctx.currentTime;
      const cycleDuration = 6 + Math.random() * 4; // 6-10 sec wave cycle
      const peakGain = 0.4 + Math.random() * 0.3;
      const troughGain = 0.1 + Math.random() * 0.1;

      // Swell
      oceanGain.gain.setValueAtTime(troughGain, now);
      oceanGain.gain.linearRampToValueAtTime(peakGain, now + cycleDuration * 0.4);
      oceanLPF.frequency.setValueAtTime(800, now);
      oceanLPF.frequency.linearRampToValueAtTime(2000, now + cycleDuration * 0.4);

      // Crash and retreat
      oceanGain.gain.linearRampToValueAtTime(peakGain * 0.7, now + cycleDuration * 0.5);
      oceanGain.gain.linearRampToValueAtTime(troughGain, now + cycleDuration);
      oceanLPF.frequency.linearRampToValueAtTime(600, now + cycleDuration);

      const timeout = setTimeout(modulateWave, cycleDuration * 1000);
      layer.timeouts.push(timeout);
    };
    modulateWave();

    // Foam layer: higher frequency noise for wave crash
    const foamSource = this.createNoiseSource("white");
    const foamGain = ctx.createGain();
    foamGain.gain.value = 0;
    const foamHPF = ctx.createBiquadFilter();
    foamHPF.type = "highpass";
    foamHPF.frequency.value = 3000;
    foamSource.connect(foamHPF);
    foamHPF.connect(foamGain);
    foamGain.connect(master);
    foamSource.start();
    layer.sources.push(foamSource);
    layer.gains.push(foamGain);

    // Foam bursts aligned with waves
    const foamInterval = setInterval(() => {
      const now = ctx.currentTime;
      foamGain.gain.setValueAtTime(0, now);
      foamGain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.1, now + 0.5);
      foamGain.gain.linearRampToValueAtTime(0, now + 2 + Math.random() * 2);
    }, 6000 + Math.random() * 4000);
    layer.intervals.push(foamInterval);

    this.activeLayer = layer;
  }

  private playWind(): void {
    const ctx = this.getContext();
    const master = this.getMasterGain();
    const layer = this.createActiveLayer();

    // Wind base: pink noise with slow modulation
    const windSource = this.createNoiseSource("pink");
    const windGain = ctx.createGain();
    windGain.gain.value = 0.3;
    const windBPF = ctx.createBiquadFilter();
    windBPF.type = "bandpass";
    windBPF.frequency.value = 800;
    windBPF.Q.value = 0.5;
    windSource.connect(windBPF);
    windBPF.connect(windGain);
    windGain.connect(master);
    windSource.start();
    layer.sources.push(windSource);
    layer.gains.push(windGain);

    // Very slow gain and frequency modulation
    const modulateWind = () => {
      const now = ctx.currentTime;
      const duration = 4 + Math.random() * 8;
      const targetGain = 0.15 + Math.random() * 0.45;
      const targetFreq = 400 + Math.random() * 1200;

      windGain.gain.linearRampToValueAtTime(targetGain, now + duration);
      windBPF.frequency.linearRampToValueAtTime(targetFreq, now + duration);

      const timeout = setTimeout(modulateWind, duration * 1000);
      layer.timeouts.push(timeout);
    };
    modulateWind();

    // Gust layer: occasional louder whooshes
    const gustSource = this.createNoiseSource("brown");
    const gustGain = ctx.createGain();
    gustGain.gain.value = 0;
    const gustLPF = ctx.createBiquadFilter();
    gustLPF.type = "lowpass";
    gustLPF.frequency.value = 500;
    gustSource.connect(gustLPF);
    gustLPF.connect(gustGain);
    gustGain.connect(master);
    gustSource.start();
    layer.sources.push(gustSource);
    layer.gains.push(gustGain);

    const gustInterval = setInterval(() => {
      const now = ctx.currentTime;
      const gustDuration = 1 + Math.random() * 3;
      gustGain.gain.setValueAtTime(0, now);
      gustGain.gain.linearRampToValueAtTime(0.2 + Math.random() * 0.2, now + gustDuration * 0.3);
      gustGain.gain.linearRampToValueAtTime(0, now + gustDuration);
    }, 5000 + Math.random() * 10000);
    layer.intervals.push(gustInterval);

    this.activeLayer = layer;
  }

  private playBirds(): void {
    const ctx = this.getContext();
    const master = this.getMasterGain();
    const layer = this.createActiveLayer();

    // Bird chirps at random intervals using oscillators
    const scheduleChirp = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;

      // Randomized bird call: frequency sweeps
      const baseFreq = 2000 + Math.random() * 3000;
      osc.type = "sine";
      osc.frequency.value = baseFreq;

      osc.connect(gain);
      gain.connect(master);

      // Create a chirp pattern (2-5 notes)
      const noteCount = 2 + Math.floor(Math.random() * 4);
      let offset = 0;
      for (let n = 0; n < noteCount; n++) {
        const noteStart = now + offset;
        const noteDur = 0.04 + Math.random() * 0.08;
        const noteFreq = baseFreq + (Math.random() - 0.5) * 1500;
        const noteVol = 0.08 + Math.random() * 0.12;

        osc.frequency.setValueAtTime(noteFreq, noteStart);
        osc.frequency.linearRampToValueAtTime(
          noteFreq + (Math.random() - 0.5) * 800,
          noteStart + noteDur
        );
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(noteVol, noteStart + 0.005);
        gain.gain.linearRampToValueAtTime(0, noteStart + noteDur);

        offset += noteDur + 0.02 + Math.random() * 0.06;
      }

      osc.start(now);
      osc.stop(now + offset + 0.1);
      layer.sources.push(osc);
      layer.gains.push(gain);

      // Schedule next chirp
      const nextDelay = 800 + Math.random() * 3000;
      const timeout = setTimeout(scheduleChirp, nextDelay);
      layer.timeouts.push(timeout);
    };

    // Start multiple bird "voices"
    for (let i = 0; i < 3; i++) {
      const initTimeout = setTimeout(scheduleChirp, i * 500 + Math.random() * 1000);
      layer.timeouts.push(initTimeout);
    }

    this.activeLayer = layer;
  }

  private playThunder(): void {
    const ctx = this.getContext();
    const master = this.getMasterGain();
    const layer = this.createActiveLayer();

    // Base rain (lighter)
    const rainSource = this.createNoiseSource("pink");
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.35;
    const rainLPF = ctx.createBiquadFilter();
    rainLPF.type = "lowpass";
    rainLPF.frequency.value = 6000;
    rainSource.connect(rainLPF);
    rainLPF.connect(rainGain);
    rainGain.connect(master);
    rainSource.start();
    layer.sources.push(rainSource);
    layer.gains.push(rainGain);

    // Thunder: brown noise bursts with exponential decay
    const thunderSource = this.createNoiseSource("brown");
    const thunderGain = ctx.createGain();
    thunderGain.gain.value = 0;
    const thunderLPF = ctx.createBiquadFilter();
    thunderLPF.type = "lowpass";
    thunderLPF.frequency.value = 200;
    thunderSource.connect(thunderLPF);
    thunderLPF.connect(thunderGain);
    thunderGain.connect(master);
    thunderSource.start();
    layer.sources.push(thunderSource);
    layer.gains.push(thunderGain);

    // Random thunder rumbles
    const scheduleThunder = () => {
      const now = ctx.currentTime;
      const rumbleDuration = 2 + Math.random() * 4;
      const intensity = 0.4 + Math.random() * 0.5;

      // Initial crack
      thunderLPF.frequency.setValueAtTime(400, now);
      thunderGain.gain.setValueAtTime(0, now);
      thunderGain.gain.linearRampToValueAtTime(intensity, now + 0.05);
      thunderGain.gain.linearRampToValueAtTime(intensity * 0.6, now + 0.3);

      // Rumble
      thunderLPF.frequency.linearRampToValueAtTime(100, now + rumbleDuration * 0.5);
      thunderGain.gain.linearRampToValueAtTime(intensity * 0.3, now + rumbleDuration * 0.5);
      thunderGain.gain.exponentialRampToValueAtTime(0.001, now + rumbleDuration);

      // Intensify rain briefly
      rainGain.gain.setValueAtTime(rainGain.gain.value, now);
      rainGain.gain.linearRampToValueAtTime(0.6, now + 0.5);
      rainGain.gain.linearRampToValueAtTime(0.35, now + rumbleDuration + 2);

      const nextDelay = 8000 + Math.random() * 20000;
      const timeout = setTimeout(scheduleThunder, nextDelay);
      layer.timeouts.push(timeout);
    };

    // First thunder after a short delay
    const initTimeout = setTimeout(scheduleThunder, 2000 + Math.random() * 3000);
    layer.timeouts.push(initTimeout);

    this.activeLayer = layer;
  }

  private playCafe(): void {
    const ctx = this.getContext();
    const master = this.getMasterGain();
    const layer = this.createActiveLayer();

    // Background chatter: pink noise at low volume
    const chatterSource = this.createNoiseSource("pink");
    const chatterGain = ctx.createGain();
    chatterGain.gain.value = 0.15;
    const chatterBPF = ctx.createBiquadFilter();
    chatterBPF.type = "bandpass";
    chatterBPF.frequency.value = 1500;
    chatterBPF.Q.value = 0.8;
    chatterSource.connect(chatterBPF);
    chatterBPF.connect(chatterGain);
    chatterGain.connect(master);
    chatterSource.start();
    layer.sources.push(chatterSource);
    layer.gains.push(chatterGain);

    // Slow murmur modulation
    const murmurInterval = setInterval(() => {
      const now = ctx.currentTime;
      const targetGain = 0.1 + Math.random() * 0.12;
      chatterGain.gain.linearRampToValueAtTime(targetGain, now + 2 + Math.random() * 3);
    }, 3000 + Math.random() * 4000);
    layer.intervals.push(murmurInterval);

    // Occasional clinking/transient sounds
    const clinkSource = this.createNoiseSource("white");
    const clinkGain = ctx.createGain();
    clinkGain.gain.value = 0;
    const clinkHPF = ctx.createBiquadFilter();
    clinkHPF.type = "highpass";
    clinkHPF.frequency.value = 5000;
    clinkSource.connect(clinkHPF);
    clinkHPF.connect(clinkGain);
    clinkGain.connect(master);
    clinkSource.start();
    layer.sources.push(clinkSource);
    layer.gains.push(clinkGain);

    const clinkInterval = setInterval(() => {
      const now = ctx.currentTime;
      clinkGain.gain.setValueAtTime(0, now);
      clinkGain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.08, now + 0.002);
      clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05 + Math.random() * 0.1);
    }, 3000 + Math.random() * 8000);
    layer.intervals.push(clinkInterval);

    this.activeLayer = layer;
  }

  private playForest(): void {
    const ctx = this.getContext();
    const master = this.getMasterGain();
    const layer = this.createActiveLayer();

    // Wind base (gentle)
    const windSource = this.createNoiseSource("pink");
    const windGain = ctx.createGain();
    windGain.gain.value = 0.12;
    const windBPF = ctx.createBiquadFilter();
    windBPF.type = "bandpass";
    windBPF.frequency.value = 600;
    windBPF.Q.value = 0.4;
    windSource.connect(windBPF);
    windBPF.connect(windGain);
    windGain.connect(master);
    windSource.start();
    layer.sources.push(windSource);
    layer.gains.push(windGain);

    // Slow wind modulation
    const windModInterval = setInterval(() => {
      const now = ctx.currentTime;
      windGain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.12, now + 3 + Math.random() * 4);
      windBPF.frequency.linearRampToValueAtTime(400 + Math.random() * 600, now + 3);
    }, 4000 + Math.random() * 5000);
    layer.intervals.push(windModInterval);

    // Bird chirps (occasional)
    const scheduleForestBird = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;

      const baseFreq = 2500 + Math.random() * 2500;
      osc.type = "sine";
      osc.frequency.value = baseFreq;
      osc.connect(gain);
      gain.connect(master);

      const noteCount = 2 + Math.floor(Math.random() * 3);
      let offset = 0;
      for (let n = 0; n < noteCount; n++) {
        const noteStart = now + offset;
        const noteDur = 0.05 + Math.random() * 0.1;
        const noteFreq = baseFreq + (Math.random() - 0.5) * 1200;
        const noteVol = 0.05 + Math.random() * 0.08;

        osc.frequency.setValueAtTime(noteFreq, noteStart);
        osc.frequency.linearRampToValueAtTime(
          noteFreq + (Math.random() - 0.5) * 600,
          noteStart + noteDur
        );
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(noteVol, noteStart + 0.005);
        gain.gain.linearRampToValueAtTime(0, noteStart + noteDur);

        offset += noteDur + 0.03 + Math.random() * 0.08;
      }

      osc.start(now);
      osc.stop(now + offset + 0.1);
      layer.sources.push(osc);
      layer.gains.push(gain);

      const nextDelay = 2000 + Math.random() * 6000;
      const timeout = setTimeout(scheduleForestBird, nextDelay);
      layer.timeouts.push(timeout);
    };

    // Start a couple of bird voices
    for (let i = 0; i < 2; i++) {
      const initTimeout = setTimeout(scheduleForestBird, 1000 + Math.random() * 3000);
      layer.timeouts.push(initTimeout);
    }

    this.activeLayer = layer;
  }

  private playWhiteNoise(): void {
    const ctx = this.getContext();
    const master = this.getMasterGain();
    const layer = this.createActiveLayer();

    const source = this.createNoiseSource("white");
    const gain = ctx.createGain();
    gain.gain.value = 0.4;
    source.connect(gain);
    gain.connect(master);
    source.start();
    layer.sources.push(source);
    layer.gains.push(gain);

    this.activeLayer = layer;
  }

  // --- Public API ---

  play(preset: AmbientPreset, volume?: number): void {
    this.stop();

    if (volume !== undefined) {
      this._volume = Math.max(0, Math.min(1, volume));
    }

    const master = this.getMasterGain();
    master.gain.value = this._volume;
    this.currentPreset = preset;

    switch (preset) {
      case "rain":
        this.playRain();
        break;
      case "fireplace":
        this.playFireplace();
        break;
      case "waves":
        this.playWaves();
        break;
      case "wind":
        this.playWind();
        break;
      case "birds":
        this.playBirds();
        break;
      case "thunder":
        this.playThunder();
        break;
      case "cafe":
        this.playCafe();
        break;
      case "forest":
        this.playForest();
        break;
      case "white_noise":
        this.playWhiteNoise();
        break;
    }
  }

  stop(): void {
    this.clearActiveLayer();
    this.currentPreset = null;
    if (this.ctx && this.ctx.state === "running") {
      this.ctx.suspend();
    }
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      const ctx = this.getContext();
      this.masterGain.gain.linearRampToValueAtTime(this._volume, ctx.currentTime + 0.05);
    }
  }

  getVolume(): number {
    return this._volume;
  }

  getCurrentPreset(): AmbientPreset | null {
    return this.currentPreset;
  }

  isPlaying(): boolean {
    return this.currentPreset !== null && this.activeLayer !== null;
  }

  crossfade(newPreset: AmbientPreset, durationMs: number = 2000): void {
    if (!this.masterGain || !this.ctx) {
      this.play(newPreset);
      return;
    }

    const ctx = this.ctx;
    const currentVolume = this._volume;

    // Fade out current
    this.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 2000);

    const halfTimeout = setTimeout(() => {
      this.stop();
      this._volume = 0;
      this.play(newPreset, 0);

      // Fade in new
      const master = this.getMasterGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(currentVolume, ctx.currentTime + durationMs / 2000);
      this._volume = currentVolume;
    }, durationMs / 2);

    // Store timeout for cleanup if stop() is called during crossfade
    if (this.activeLayer) {
      this.activeLayer.timeouts.push(halfTimeout);
    }
  }

  destroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
      this.noiseBuffers = null;
    }
  }
}
