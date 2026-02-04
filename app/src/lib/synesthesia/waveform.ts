// ============================================================================
// Synesthesia.ai -- PULSE Waveform Generator
// Generates realistic ECG-style PQRST waveforms for visualization
// ============================================================================

/**
 * Generates a single PQRST complex as an array of {x, y} points.
 * The waveform is normalized to a 0..1 x-range and roughly -0.3..1.0 y-range.
 *
 * Anatomy of one cardiac cycle (PQRST):
 *   P wave  -- small atrial depolarization bump
 *   Q dip   -- small downward deflection before the main spike
 *   R peak  -- large upward spike (ventricular depolarization)
 *   S dip   -- downward deflection after R
 *   T wave  -- broader repolarization bump
 */
function generateSinglePQRST(numPoints: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1); // 0..1
    let y = 0;

    // Baseline at 0

    // P wave: small Gaussian bump centered around t=0.12, width ~0.04
    y += 0.12 * Math.exp(-Math.pow((t - 0.12) / 0.04, 2));

    // PR segment: flat (baseline)

    // Q dip: small negative dip at t=0.28
    y -= 0.08 * Math.exp(-Math.pow((t - 0.28) / 0.012, 2));

    // R peak: tall sharp spike at t=0.32
    y += 1.0 * Math.exp(-Math.pow((t - 0.32) / 0.018, 2));

    // S dip: moderate negative dip at t=0.36
    y -= 0.2 * Math.exp(-Math.pow((t - 0.36) / 0.015, 2));

    // ST segment: slight elevation returning to baseline

    // T wave: broader Gaussian bump centered around t=0.55
    y += 0.22 * Math.exp(-Math.pow((t - 0.55) / 0.06, 2));

    // U wave (very subtle, sometimes present): tiny bump at t=0.72
    y += 0.03 * Math.exp(-Math.pow((t - 0.72) / 0.04, 2));

    points.push({ x: t, y });
  }

  return points;
}

/**
 * Generates an SVG path string for a realistic ECG waveform.
 *
 * @param bpm - Beats per minute (determines spacing between cycles)
 * @param width - SVG viewport width in px
 * @param height - SVG viewport height in px
 * @param cycles - Number of complete heartbeat cycles to render
 * @returns SVG path `d` attribute string
 */
export function generateECGPath(
  bpm: number,
  width: number,
  height: number,
  cycles: number
): string {
  const pointsPerCycle = 120;
  const singleCycle = generateSinglePQRST(pointsPerCycle);

  // Map the waveform into the SVG coordinate space.
  // Y is inverted in SVG (0 = top).
  const baselineY = height * 0.55; // baseline slightly below center
  const amplitudeY = height * 0.4; // peak-to-peak amplitude
  const cycleWidth = width / cycles;

  const allPoints: { x: number; y: number }[] = [];

  for (let c = 0; c < cycles; c++) {
    const offsetX = c * cycleWidth;
    for (const pt of singleCycle) {
      allPoints.push({
        x: offsetX + pt.x * cycleWidth,
        y: baselineY - pt.y * amplitudeY,
      });
    }
  }

  if (allPoints.length === 0) return "";

  // Build SVG path using smooth curve segments
  let d = `M ${allPoints[0].x.toFixed(2)} ${allPoints[0].y.toFixed(2)}`;

  for (let i = 1; i < allPoints.length; i++) {
    const prev = allPoints[i - 1];
    const curr = allPoints[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` Q ${cpx.toFixed(2)} ${prev.y.toFixed(2)} ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
  }

  return d;
}

/**
 * Generates keyframe data for animating an ECG waveform.
 *
 * @param bpm - Beats per minute
 * @param containerWidth - Width of the container in px
 * @returns Object with paths for animation frames and timing info
 */
export function generateAnimatedECG(
  bpm: number,
  containerWidth: number
): {
  paths: string[];
  msPerCycle: number;
  totalFrames: number;
} {
  const msPerCycle = 60000 / bpm;
  const framesPerCycle = 30; // 30 frames per heartbeat cycle for smooth animation
  const totalFrames = framesPerCycle;
  const height = 120;
  const visibleCycles = 3;
  const totalCycles = visibleCycles + 1; // extra cycle for scrolling

  const paths: string[] = [];

  for (let frame = 0; frame < totalFrames; frame++) {
    const scrollOffset = (frame / totalFrames) * (containerWidth / visibleCycles);
    const shiftedWidth = containerWidth + containerWidth / visibleCycles;

    const pointsPerCycle = 100;
    const singleCycle = generateSinglePQRST(pointsPerCycle);
    const cycleWidth = shiftedWidth / totalCycles;
    const baselineY = height * 0.55;
    const amplitudeY = height * 0.4;

    const allPoints: { x: number; y: number }[] = [];

    for (let c = 0; c < totalCycles; c++) {
      const offsetX = c * cycleWidth - scrollOffset;
      for (const pt of singleCycle) {
        const x = offsetX + pt.x * cycleWidth;
        if (x >= -10 && x <= containerWidth + 10) {
          allPoints.push({
            x,
            y: baselineY - pt.y * amplitudeY,
          });
        }
      }
    }

    if (allPoints.length < 2) {
      paths.push("");
      continue;
    }

    allPoints.sort((a, b) => a.x - b.x);

    let d = `M ${allPoints[0].x.toFixed(1)} ${allPoints[0].y.toFixed(1)}`;
    for (let i = 1; i < allPoints.length; i++) {
      d += ` L ${allPoints[i].x.toFixed(1)} ${allPoints[i].y.toFixed(1)}`;
    }

    paths.push(d);
  }

  return { paths, msPerCycle, totalFrames };
}

/**
 * Adds natural heart rate variability to a base BPM value.
 * Uses a combination of sinusoidal variation (respiratory sinus arrhythmia)
 * and random perturbation to simulate realistic HRV.
 *
 * @param baseBpm - The average BPM
 * @param variance - Maximum deviation in BPM (e.g., 5 means +/-5 BPM)
 * @param time - Current time in ms (for deterministic variation)
 * @returns Adjusted BPM with natural variability
 */
export function addVariability(baseBpm: number, variance: number, time?: number): number {
  const t = time ?? Date.now();

  // Respiratory sinus arrhythmia: ~0.15-0.4 Hz (roughly one breath cycle every 3-6s)
  const respiratoryComponent = Math.sin((2 * Math.PI * t) / 4000) * variance * 0.6;

  // Low-frequency component: ~0.04-0.15 Hz (baroreceptor activity)
  const lowFreqComponent = Math.sin((2 * Math.PI * t) / 10000) * variance * 0.3;

  // Very low frequency drift
  const vlfComponent = Math.sin((2 * Math.PI * t) / 30000) * variance * 0.15;

  // Small random jitter using a seeded-ish approach
  const jitterSeed = Math.sin(t * 0.001) * 10000;
  const jitter = (jitterSeed - Math.floor(jitterSeed) - 0.5) * variance * 0.2;

  const adjustedBpm = baseBpm + respiratoryComponent + lowFreqComponent + vlfComponent + jitter;

  // Clamp to reasonable range
  return Math.max(30, Math.min(220, Math.round(adjustedBpm * 10) / 10));
}

/**
 * Generates an array of RR intervals (in ms) from a base BPM with natural variability.
 *
 * @param baseBpm - Average heart rate
 * @param count - Number of intervals to generate
 * @param varianceBpm - BPM variance for HRV simulation
 * @returns Array of RR intervals in milliseconds
 */
export function generateRRIntervals(
  baseBpm: number,
  count: number,
  varianceBpm: number = 3
): number[] {
  const intervals: number[] = [];
  let currentTime = 0;

  for (let i = 0; i < count; i++) {
    const currentBpm = addVariability(baseBpm, varianceBpm, currentTime);
    const interval = Math.round(60000 / currentBpm);
    intervals.push(interval);
    currentTime += interval;
  }

  return intervals;
}

/**
 * Converts an array of RR intervals to a vibration pattern for navigator.vibrate().
 * Pattern is [vibrate, pause, vibrate, pause, ...].
 *
 * @param rrIntervals - Array of inter-beat intervals in ms
 * @param pulseDuration - Duration of each vibration pulse in ms (50-80ms typical)
 * @param intensity - Intensity multiplier 0..1 (affects pulse duration)
 * @returns Array suitable for navigator.vibrate()
 */
export function rrIntervalsToVibratePattern(
  rrIntervals: number[],
  pulseDuration: number = 65,
  intensity: number = 1.0
): number[] {
  const pattern: number[] = [];
  const effectivePulse = Math.round(pulseDuration * Math.max(0.3, Math.min(1, intensity)));

  for (let i = 0; i < rrIntervals.length; i++) {
    pattern.push(effectivePulse);
    if (i < rrIntervals.length - 1) {
      const pause = Math.max(10, rrIntervals[i] - effectivePulse);
      pattern.push(pause);
    }
  }

  return pattern;
}
