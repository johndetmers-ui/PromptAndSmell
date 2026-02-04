import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Ingredient {
  name: string;
  cas_number: string;
  category: string;
  note_type: string;
  percentage: number;
  intensity: number;
}

interface OSCFormulaInput {
  id: string;
  version: string;
  name: string;
  description: string;
  prompt: string;
  creator: string;
  created_at: string;
  ingredients: Ingredient[];
  [key: string]: unknown;
}

interface DispenseStep {
  channel: number;
  ingredient: string;
  volume_ml: number;
  duration_ms: number;
}

interface DispenseRequest {
  formula: OSCFormulaInput;
  volume_ml: number;
  simulate: boolean;
}

// ---------------------------------------------------------------------------
// Channel Mapping
// ---------------------------------------------------------------------------
// Must stay in sync with hardware/ingredient_map.json and the firmware pin
// assignments (D22-D37 = channels 0-15).

const CHANNEL_MAP: Record<
  number,
  { ingredient: string; flow_rate_ml_per_min: number; max_volume_ml: number }
> = {
  0:  { ingredient: "Ethanol (denatured)",    flow_rate_ml_per_min: 5.0, max_volume_ml: 50.0 },
  1:  { ingredient: "Dipropylene Glycol (DPG)", flow_rate_ml_per_min: 3.0, max_volume_ml: 30.0 },
  2:  { ingredient: "Isopropyl Myristate (IPM)", flow_rate_ml_per_min: 2.5, max_volume_ml: 10.0 },
  3:  { ingredient: "Bergamot Oil",           flow_rate_ml_per_min: 2.5, max_volume_ml: 5.0 },
  4:  { ingredient: "Linalool",               flow_rate_ml_per_min: 2.5, max_volume_ml: 5.0 },
  5:  { ingredient: "Hedione",                flow_rate_ml_per_min: 2.5, max_volume_ml: 10.0 },
  6:  { ingredient: "Rose Absolute",          flow_rate_ml_per_min: 2.0, max_volume_ml: 3.0 },
  7:  { ingredient: "Jasmine Absolute",       flow_rate_ml_per_min: 2.0, max_volume_ml: 3.0 },
  8:  { ingredient: "Iso E Super",            flow_rate_ml_per_min: 2.5, max_volume_ml: 10.0 },
  9:  { ingredient: "Cedarwood Oil (Atlas)",  flow_rate_ml_per_min: 2.5, max_volume_ml: 8.0 },
  10: { ingredient: "Sandalwood Oil",         flow_rate_ml_per_min: 2.0, max_volume_ml: 5.0 },
  11: { ingredient: "Vanillin",               flow_rate_ml_per_min: 2.0, max_volume_ml: 5.0 },
  12: { ingredient: "Ambroxan",               flow_rate_ml_per_min: 2.5, max_volume_ml: 8.0 },
  13: { ingredient: "Galaxolide",             flow_rate_ml_per_min: 2.5, max_volume_ml: 8.0 },
  14: { ingredient: "Patchouli Oil",          flow_rate_ml_per_min: 2.0, max_volume_ml: 5.0 },
  15: { ingredient: "Dihydromyrcenol",        flow_rate_ml_per_min: 2.5, max_volume_ml: 8.0 },
};

// ---------------------------------------------------------------------------
// Ingredient-to-Channel Lookup
// ---------------------------------------------------------------------------

function findChannel(ingredientName: string): number | null {
  const nameLower = ingredientName.toLowerCase();

  // Exact match first
  for (const [ch, info] of Object.entries(CHANNEL_MAP)) {
    if (info.ingredient.toLowerCase() === nameLower) {
      return parseInt(ch, 10);
    }
  }

  // Partial / substring match fallback
  for (const [ch, info] of Object.entries(CHANNEL_MAP)) {
    const mapLower = info.ingredient.toLowerCase();
    if (nameLower.includes(mapLower) || mapLower.includes(nameLower)) {
      return parseInt(ch, 10);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Plan Builder
// ---------------------------------------------------------------------------

const MIN_DISPENSE_VOLUME_ML = 0.01;
const MIN_PUMP_DURATION_MS = 50;
const MAX_PUMP_DURATION_MS = 30000;

function buildDispensePlan(
  formula: OSCFormulaInput,
  totalVolumeMl: number
): { steps: DispenseStep[]; skipped: { ingredient: string; reason: string }[] } {
  const steps: DispenseStep[] = [];
  const skipped: { ingredient: string; reason: string }[] = [];

  for (const ing of formula.ingredients) {
    if (ing.percentage <= 0) continue;

    const volumeMl = (ing.percentage / 100) * totalVolumeMl;

    if (volumeMl < MIN_DISPENSE_VOLUME_ML) {
      skipped.push({
        ingredient: ing.name,
        reason: `Volume too small (${volumeMl.toFixed(4)} ml)`,
      });
      continue;
    }

    const channel = findChannel(ing.name);
    if (channel === null) {
      skipped.push({
        ingredient: ing.name,
        reason: "No pump channel assigned",
      });
      continue;
    }

    const chInfo = CHANNEL_MAP[channel];

    if (volumeMl > chInfo.max_volume_ml) {
      skipped.push({
        ingredient: ing.name,
        reason: `Exceeds channel max (${volumeMl.toFixed(2)} > ${chInfo.max_volume_ml} ml)`,
      });
      continue;
    }

    let durationMs = Math.round((volumeMl / chInfo.flow_rate_ml_per_min) * 60 * 1000);
    if (durationMs < MIN_PUMP_DURATION_MS) durationMs = MIN_PUMP_DURATION_MS;
    if (durationMs > MAX_PUMP_DURATION_MS) durationMs = MAX_PUMP_DURATION_MS;

    steps.push({
      channel,
      ingredient: ing.name,
      volume_ml: Math.round(volumeMl * 1000) / 1000,
      duration_ms: durationMs,
    });
  }

  // Sort: carriers first, then by duration descending
  const carrierChannels = new Set([0, 1, 2]);
  steps.sort((a, b) => {
    const aCarrier = carrierChannels.has(a.channel) ? 0 : 1;
    const bCarrier = carrierChannels.has(b.channel) ? 0 : 1;
    if (aCarrier !== bCarrier) return aCarrier - bCarrier;
    return b.duration_ms - a.duration_ms;
  });

  return { steps, skipped };
}

// ---------------------------------------------------------------------------
// Python Controller Spawner
// ---------------------------------------------------------------------------

function runPythonController(
  formula: OSCFormulaInput,
  volumeMl: number
): Promise<{ success: boolean; output: string; error: string }> {
  return new Promise((resolve) => {
    const controllerPath = path.resolve(
      process.cwd(),
      "..",
      "hardware",
      "controller.py"
    );

    const child = spawn("python", [
      controllerPath,
      "--stdin",
      "--volume",
      volumeMl.toString(),
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code: number | null) => {
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr,
      });
    });

    child.on("error", (err: Error) => {
      resolve({
        success: false,
        output: "",
        error: `Failed to spawn Python controller: ${err.message}`,
      });
    });

    // Pipe the formula JSON to the controller via stdin
    const formulaJson = JSON.stringify({
      name: formula.name,
      ingredients: formula.ingredients.map((ing) => ({
        name: ing.name,
        cas: ing.cas_number,
        percentage: ing.percentage,
        noteType: ing.note_type,
        category: ing.category,
        intensity: ing.intensity,
      })),
    });

    child.stdin.write(formulaJson);
    child.stdin.end();

    // Timeout: kill after 120 seconds
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({
        success: false,
        output: stdout,
        error: "Controller process timed out after 120 seconds",
      });
    }, 120000);

    child.on("close", () => clearTimeout(timeout));
  });
}

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body: DispenseRequest = await request.json();
    const { formula, volume_ml, simulate } = body;

    // ---- Validation ----

    if (!formula || !formula.ingredients || !Array.isArray(formula.ingredients)) {
      return NextResponse.json(
        { error: "A valid formula with an ingredients array is required." },
        { status: 400 }
      );
    }

    if (formula.ingredients.length === 0) {
      return NextResponse.json(
        { error: "Formula must contain at least one ingredient." },
        { status: 400 }
      );
    }

    const volumeMl = typeof volume_ml === "number" && volume_ml > 0 ? volume_ml : 5;

    if (volumeMl > 50) {
      return NextResponse.json(
        { error: "Maximum dispense volume is 50 ml." },
        { status: 400 }
      );
    }

    if (volumeMl < 0.1) {
      return NextResponse.json(
        { error: "Minimum dispense volume is 0.1 ml." },
        { status: 400 }
      );
    }

    // Default to simulate mode for safety
    const mode = simulate === false ? "real" : "simulate";

    // ---- Build the dispense plan ----

    const { steps, skipped } = buildDispensePlan(formula, volumeMl);

    if (steps.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No ingredients could be mapped to pump channels.",
          plan: { steps: [], skipped },
          mode,
        },
        { status: 422 }
      );
    }

    const estimatedTimeMs =
      steps.reduce((sum, s) => sum + s.duration_ms, 0) +
      200 * Math.max(0, steps.length - 1); // 200ms inter-pump delay

    // ---- Simulate mode ----

    if (mode === "simulate") {
      return NextResponse.json({
        success: true,
        plan: {
          steps,
          skipped,
          estimated_time_ms: estimatedTimeMs,
          total_volume_ml: volumeMl,
          formula_name: formula.name,
        },
        mode: "simulate",
      });
    }

    // ---- Real mode: spawn the Python controller ----

    const result = await runPythonController(formula, volumeMl);

    return NextResponse.json({
      success: result.success,
      plan: {
        steps,
        skipped,
        estimated_time_ms: estimatedTimeMs,
        total_volume_ml: volumeMl,
        formula_name: formula.name,
      },
      mode: "real",
      controller_output: result.output,
      controller_error: result.error || undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Dispense request failed: ${message}` },
      { status: 500 }
    );
  }
}
