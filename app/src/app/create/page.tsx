"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Sparkles,
  History,
  Cpu,
  Play,
  PenTool,
  Mic,
  ImageIcon,
  Eye,
  Wind,
  Sun,
  Hand,
  Droplets,
  Heart,
  Layers,
} from "lucide-react";
import PromptInput from "@/components/PromptInput";
import VoiceInput from "@/components/VoiceInput";
import ImageUpload from "@/components/ImageUpload";
import ScentWheel from "@/components/ScentWheel";
import NotePyramid from "@/components/NotePyramid";
import FormulaCard from "@/components/FormulaCard";
import IterationPanel from "@/components/IterationPanel";
import { communityScents } from "@/lib/mock-data";
import { OSCFormula, HistoryEntry } from "@/lib/types";
import { generateScentId } from "@/lib/utils";
import {
  ModuleKey,
  ALL_MODULE_KEYS,
  MODULE_META,
  SensoryExperience,
  AtmosphereProfile,
  TextureProfile,
  FlavorFormula,
  PulsePattern,
} from "@/lib/synesthesia/types";

// ---------------------------------------------------------------------------
// Dynamic imports for visualizer components (may not exist yet)
// ---------------------------------------------------------------------------

const AtmosphereVisualizer = dynamic<any>(
  () => import("@/components/AtmosphereVisualizer"),
  { ssr: false, loading: () => <ModuleLoadingSkeleton label="Atmosphere" /> }
);

const TextureVisualizer = dynamic<any>(
  () => import("@/components/TextureVisualizer"),
  { ssr: false, loading: () => <ModuleLoadingSkeleton label="Texture" /> }
);

const TasteVisualizer = dynamic<any>(
  () => import("@/components/TasteVisualizer"),
  { ssr: false, loading: () => <ModuleLoadingSkeleton label="Taste" /> }
);

const PulseVisualizer = dynamic<any>(
  () => import("@/components/PulseVisualizer"),
  { ssr: false, loading: () => <ModuleLoadingSkeleton label="Pulse" /> }
);

// ---------------------------------------------------------------------------
// Placeholder components for modules not yet built
// ---------------------------------------------------------------------------

function ModuleLoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-32 bg-surface-600/30 rounded" />
      <div className="h-40 bg-surface-600/20 rounded-xl" />
    </div>
  );
}

function AtmospherePlaceholder({ data }: { data: AtmosphereProfile }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="text-xs font-bold text-amber-400 tracking-wider mb-2">LIGHTING</div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded-lg border border-surface-500/30"
              style={{ backgroundColor: data.lighting.color_hex }}
            />
            <div className="text-sm text-gray-300">
              {data.lighting.color_hex} -- {data.lighting.temperature_kelvin}K
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Brightness: {data.lighting.brightness}% | Animation: {data.lighting.animation} | Speed: {data.lighting.speed}%
          </div>
        </div>
        <div className="rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="text-xs font-bold text-amber-400 tracking-wider mb-2">SOUND</div>
          <div className="text-sm text-gray-300 mb-1">
            {data.sound.genre} -- {data.sound.mood}
          </div>
          <div className="text-xs text-gray-500">
            BPM: {data.sound.bpm_range[0]}-{data.sound.bpm_range[1]} | Volume: {data.sound.volume}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Ambient: {data.sound.ambient_layer} ({data.sound.ambient_volume}%)
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="text-xs font-bold text-amber-400 tracking-wider mb-2">TEMPERATURE</div>
          <div className="text-sm text-gray-300">
            {data.temperature.target_f}F -- {data.temperature.change_direction}
          </div>
        </div>
        <div className="rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="text-xs font-bold text-amber-400 tracking-wider mb-2">VISUAL</div>
          <div className="text-sm text-gray-300 mb-1">{data.visual.animation_style}</div>
          <div className="flex gap-1 mt-2">
            {data.visual.color_palette.map((c, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-md border border-surface-500/30"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>
      {data.visual.scene_description && (
        <p className="text-xs text-gray-500 italic leading-relaxed">
          {data.visual.scene_description}
        </p>
      )}
    </div>
  );
}

function TexturePlaceholder({ data }: { data: TextureProfile }) {
  const props = data.physical_properties;
  const propEntries = [
    { label: "Friction", value: props.friction },
    { label: "Grain", value: props.grain },
    { label: "Temperature", value: props.temperature },
    { label: "Resistance", value: props.resistance },
    { label: "Elasticity", value: props.elasticity },
    { label: "Moisture", value: props.moisture },
    { label: "Roughness", value: props.roughness },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400 italic">{data.description}</p>
      <div className="text-xs text-gray-500 mb-2">
        Material reference: {data.material_reference}
      </div>
      <div className="space-y-2">
        {propEntries.map((p) => (
          <div key={p.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-24">{p.label}</span>
            <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500/60"
                style={{ width: `${p.value}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{p.value}</span>
          </div>
        ))}
      </div>
      {data.haptic_pattern.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-bold text-blue-400 tracking-wider mb-2">
            HAPTIC PATTERN ({data.haptic_pattern.length} steps)
          </div>
          <div className="flex gap-1">
            {data.haptic_pattern.slice(0, 20).map((step, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  width: Math.max(4, step.duration_ms / 10),
                  height: step.type === "vibrate" ? 8 + step.intensity * 2 : 4,
                  backgroundColor: step.type === "vibrate" ? "#3B82F680" : "#374151",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TastePlaceholder({ data }: { data: FlavorFormula }) {
  const tasteEntries = [
    { label: "Sweet", value: data.taste_profile.sweet, color: "#EC4899" },
    { label: "Sour", value: data.taste_profile.sour, color: "#FBBF24" },
    { label: "Salty", value: data.taste_profile.salty, color: "#60A5FA" },
    { label: "Bitter", value: data.taste_profile.bitter, color: "#A78BFA" },
    { label: "Umami", value: data.taste_profile.umami, color: "#F87171" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400 italic">{data.description}</p>

      {/* Taste radar */}
      <div className="space-y-2">
        {tasteEntries.map((t) => (
          <div key={t.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16">{t.label}</span>
            <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${t.value}%`, backgroundColor: `${t.color}80` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{t.value}</span>
          </div>
        ))}
      </div>

      {/* Mouthfeel */}
      <div className="rounded-xl p-4 border border-pink-500/20 bg-pink-500/5">
        <div className="text-xs font-bold text-pink-400 tracking-wider mb-2">MOUTHFEEL</div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <span>Temperature: {data.mouthfeel.temperature}</span>
          <span>Viscosity: {data.mouthfeel.viscosity}</span>
          <span>Carbonation: {data.mouthfeel.carbonation}%</span>
          <span>Spiciness: {data.mouthfeel.spiciness}%</span>
        </div>
      </div>

      {/* Home recipe summary */}
      {data.home_recipe && (
        <div className="rounded-xl p-4 border border-pink-500/20 bg-pink-500/5">
          <div className="text-xs font-bold text-pink-400 tracking-wider mb-2">
            HOME RECIPE -- {data.home_recipe.difficulty} -- {data.home_recipe.time_minutes} min
          </div>
          <div className="text-xs text-gray-400">
            {data.home_recipe.ingredients.length} ingredients | Yield: {data.home_recipe.yield}
          </div>
          <ol className="mt-2 space-y-1 text-xs text-gray-500 list-decimal list-inside">
            {data.home_recipe.instructions.slice(0, 4).map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
            {data.home_recipe.instructions.length > 4 && (
              <li className="text-gray-600">... and {data.home_recipe.instructions.length - 4} more steps</li>
            )}
          </ol>
        </div>
      )}

      {/* Pairing suggestions */}
      {data.pairing_suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.pairing_suggestions.map((s) => (
            <span
              key={s}
              className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PulsePlaceholder({ data }: { data: PulsePattern }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-red-400">{data.bpm}</div>
          <div className="text-xs text-gray-500">BPM</div>
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-300 mb-1">{data.rhythm_description}</div>
          <div className="text-xs text-gray-500">
            Mode: {data.mode} | State: {data.emotional_state}
          </div>
        </div>
      </div>

      {/* Haptic sequence visualization */}
      {data.haptic_sequence.length > 0 && (
        <div>
          <div className="text-xs font-bold text-red-400 tracking-wider mb-2">
            HAPTIC SEQUENCE
          </div>
          <div className="flex items-end gap-0.5 h-12">
            {data.haptic_sequence.slice(0, 30).map((beat, i) => (
              <div
                key={i}
                className="rounded-t-sm bg-red-500/50 flex-shrink-0"
                style={{
                  width: Math.max(3, beat.duration_ms / 15),
                  height: `${Math.max(10, beat.intensity * 100)}%`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Breathing guide */}
      {data.breathing_guide && (
        <div className="rounded-xl p-4 border border-red-500/20 bg-red-500/5">
          <div className="text-xs font-bold text-red-400 tracking-wider mb-2">
            BREATHING GUIDE
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Inhale: {(data.breathing_guide.inhale_ms / 1000).toFixed(1)}s</span>
            <span>Hold: {(data.breathing_guide.hold_ms / 1000).toFixed(1)}s</span>
            <span>Exhale: {(data.breathing_guide.exhale_ms / 1000).toFixed(1)}s</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Module icon map
// ---------------------------------------------------------------------------

const moduleIcons: Record<ModuleKey, React.ElementType> = {
  atmosphere: Sun,
  scent: Wind,
  texture: Hand,
  taste: Droplets,
  pulse: Heart,
};

// ---------------------------------------------------------------------------
// Mock data generator for the unified experience
// ---------------------------------------------------------------------------

function generateMockExperience(
  prompt: string,
  activeModules: ModuleKey[]
): SensoryExperience {
  const id = generateScentId();

  const atmosphere: AtmosphereProfile = {
    lighting: {
      color_hex: "#2D1B4E",
      brightness: 45,
      temperature_kelvin: 3200,
      animation: "aurora",
      speed: 30,
    },
    sound: {
      genre: "Ambient",
      mood: "Contemplative",
      bpm_range: [60, 80],
      volume: 55,
      ambient_layer: "Wind and distant water",
      ambient_volume: 30,
    },
    temperature: {
      target_f: 62,
      change_direction: "cooler",
    },
    visual: {
      scene_description: `A visual atmosphere generated from: "${prompt}". Soft, layered lighting shifts through cool and warm tones, painting the space in an immersive glow.`,
      color_palette: ["#2D1B4E", "#1A3A5C", "#0D4B3C", "#5C3D1A", "#4B1A2D"],
      animation_style: "Slow cross-fade between palette colors",
    },
    evolution: {
      phases: [
        { name: "Opening", duration_minutes: 5, lighting: { brightness: 30, animation: "breathe" } },
        { name: "Immersion", duration_minutes: 15, lighting: { brightness: 50, animation: "aurora" } },
        { name: "Resolution", duration_minutes: 10, lighting: { brightness: 20, animation: "candle" } },
      ],
    },
  };

  const texture: TextureProfile = {
    name: "Generated Texture",
    description: `A tactile experience inspired by: "${prompt}". Cool, slightly rough surfaces give way to unexpected smoothness.`,
    physical_properties: {
      friction: 45,
      grain: 60,
      temperature: 35,
      resistance: 50,
      elasticity: 25,
      moisture: 40,
      roughness: 55,
    },
    haptic_pattern: [
      { type: "vibrate", duration_ms: 200, intensity: 0.3, frequency_hz: 150 },
      { type: "pause", duration_ms: 100, intensity: 0 },
      { type: "vibrate", duration_ms: 150, intensity: 0.6, frequency_hz: 200 },
      { type: "pause", duration_ms: 80, intensity: 0 },
      { type: "vibrate", duration_ms: 300, intensity: 0.8, frequency_hz: 120 },
      { type: "pause", duration_ms: 150, intensity: 0 },
      { type: "vibrate", duration_ms: 100, intensity: 0.4, frequency_hz: 180 },
      { type: "pause", duration_ms: 200, intensity: 0 },
    ],
    waveform: [0, 0.3, 0.6, 0.8, 0.5, 0.2, 0.7, 0.9, 0.4, 0.1],
    material_reference: "Cool stone with moss overlay",
  };

  const taste: FlavorFormula = {
    name: "Experience Elixir",
    description: `A flavor inspired by: "${prompt}". A complex, layered drink that captures the essence of the scene.`,
    taste_profile: {
      sweet: 35,
      sour: 20,
      salty: 15,
      bitter: 25,
      umami: 10,
    },
    mouthfeel: {
      temperature: "warm",
      viscosity: "medium",
      carbonation: 10,
      astringency: 20,
      spiciness: 15,
    },
    aroma_contribution: ["Bergamot", "Vanilla", "Cedarwood", "Sage"],
    home_recipe: {
      ingredients: [
        { name: "Black tea", amount: "2", unit: "tsp", notes: "Loose leaf, smoky variety" },
        { name: "Honey", amount: "1", unit: "tbsp", notes: "Wildflower preferred" },
        { name: "Lemon zest", amount: "1", unit: "strip", notes: "Fresh, no pith" },
        { name: "Fresh sage", amount: "2", unit: "leaves", notes: "Bruised" },
        { name: "Cardamom pod", amount: "1", unit: "pod", notes: "Cracked open" },
        { name: "Hot water", amount: "250", unit: "ml", notes: "Just off boil" },
      ],
      instructions: [
        "Heat water to 95C (just below boiling)",
        "Place tea, cardamom, and sage in a preheated vessel",
        "Pour water and steep for 4 minutes",
        "Strain into a warmed cup",
        "Add honey and stir until dissolved",
        "Express lemon zest over the surface and drop in",
      ],
      yield: "1 serving (250ml)",
      difficulty: "easy",
      time_minutes: 8,
    },
    molecular_formula: {
      compounds: [
        { name: "Linalool", cas_number: "78-70-6", concentration_ppm: 45, function: "Floral, calming aroma", food_grade: true },
        { name: "Vanillin", cas_number: "121-33-5", concentration_ppm: 30, function: "Sweet, warm base", food_grade: true },
        { name: "Citral", cas_number: "5392-40-5", concentration_ppm: 25, function: "Citrus brightness", food_grade: true },
      ],
      solvent: "Water with ethanol trace",
      preparation: [
        "Dissolve compounds in warm water",
        "Add food-grade ethanol as carrier",
        "Mix thoroughly and cool",
      ],
    },
    food_safety: {
      allergens: [],
      dietary: ["Vegan", "Gluten-free"],
      shelf_life: "Consume immediately when prepared fresh",
    },
    pairing_suggestions: [
      "Dark chocolate",
      "Shortbread",
      "Aged cheese",
      "Dried apricots",
    ],
  };

  const pulse: PulsePattern = {
    bpm: 64,
    rhythm_description: "A slow, contemplative rhythm that mirrors the ebb and flow of the experience. Deep, steady beats with gentle swells.",
    haptic_sequence: [
      { delay_ms: 0, intensity: 0.8, duration_ms: 150 },
      { delay_ms: 400, intensity: 0.3, duration_ms: 80 },
      { delay_ms: 700, intensity: 0.6, duration_ms: 120 },
      { delay_ms: 1100, intensity: 0.2, duration_ms: 60 },
      { delay_ms: 1500, intensity: 0.9, duration_ms: 180 },
      { delay_ms: 1900, intensity: 0.4, duration_ms: 100 },
      { delay_ms: 2300, intensity: 0.7, duration_ms: 140 },
      { delay_ms: 2700, intensity: 0.3, duration_ms: 70 },
    ],
    mode: "sync",
    emotional_state: "Contemplative awe",
    breathing_guide: {
      inhale_ms: 4000,
      hold_ms: 2000,
      exhale_ms: 6000,
    },
  };

  // Generate scent from existing mock data
  const baseScent = communityScents[Math.floor(Math.random() * communityScents.length)];
  const scentFormula: OSCFormula = {
    ...baseScent,
    id: generateScentId(),
    name: prompt.split(" ").slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description: `A scent inspired by: "${prompt}"`,
    prompt,
    creator: "You",
    created_at: new Date().toISOString(),
  };

  const experience: SensoryExperience = {
    id,
    prompt,
    scene_analysis: `Analyzing "${prompt}" across all sensory dimensions. The scene evokes a multi-layered experience that touches atmosphere, olfactory memory, tactile sensation, gustatory imagination, and emotional rhythm.`,
    modules: {},
    unified_narrative: `This experience brings "${prompt}" to life through every sense. The atmosphere shifts to match the mood, wrapping you in light and sound. The scent grounds you in the memory, while texture and taste add physical dimension. Your pulse synchronizes with the emotional rhythm of the moment, creating a fully embodied experience that transcends any single sense.`,
    mood: ["Contemplative", "Immersive", "Serene"],
    intensity: 7,
    created_at: new Date().toISOString(),
    creator: "You",
  };

  if (activeModules.includes("atmosphere")) experience.modules.atmosphere = atmosphere;
  if (activeModules.includes("scent")) experience.modules.scent = scentFormula;
  if (activeModules.includes("texture")) experience.modules.texture = texture;
  if (activeModules.includes("taste")) experience.modules.taste = taste;
  if (activeModules.includes("pulse")) experience.modules.pulse = pulse;

  return experience;
}

// Also keep the old mock formula generator for the scent iteration flow
function generateMockFormula(prompt: string): OSCFormula {
  const base = communityScents[Math.floor(Math.random() * communityScents.length)];
  const shuffledIngredients = [...base.ingredients]
    .sort(() => Math.random() - 0.5)
    .slice(0, 8 + Math.floor(Math.random() * 4));
  const rawTotal = shuffledIngredients.reduce((s, i) => s + i.percentage, 0);
  const normalizedIngredients = shuffledIngredients.map((ing, idx) => ({
    ...ing,
    percentage:
      idx === shuffledIngredients.length - 1
        ? Math.round(
            (100 -
              shuffledIngredients
                .slice(0, -1)
                .reduce(
                  (s, i) =>
                    s + Math.round((i.percentage / rawTotal) * 100 * 10) / 10,
                  0
                )) *
              10
          ) / 10
        : Math.round((ing.percentage / rawTotal) * 100 * 10) / 10,
  }));
  const checkTotal = normalizedIngredients.reduce((s, i) => s + i.percentage, 0);
  if (Math.abs(checkTotal - 100) > 0.2) {
    normalizedIngredients[0].percentage += 100 - checkTotal;
    normalizedIngredients[0].percentage = Math.round(normalizedIngredients[0].percentage * 10) / 10;
  }
  const scentName = prompt.split(" ").slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    ...base,
    id: generateScentId(),
    name: scentName,
    description: `A scent inspired by: "${prompt}"`,
    prompt,
    creator: "You",
    created_at: new Date().toISOString(),
    ingredients: normalizedIngredients,
    evolution: {
      opening: normalizedIngredients.filter((i) => i.note_type === "top").slice(0, 3).map((i) => i.name),
      heart: normalizedIngredients.filter((i) => i.note_type === "middle").slice(0, 3).map((i) => i.name),
      drydown: normalizedIngredients.filter((i) => i.note_type === "base").slice(0, 4).map((i) => i.name),
    },
  };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <CreatePageInner />
    </Suspense>
  );
}

function CreatePageInner() {
  const searchParams = useSearchParams();

  // Active modules
  const [activeModules, setActiveModules] = useState<Set<ModuleKey>>(
    new Set<ModuleKey>(["atmosphere", "scent"])
  );

  // Experience state
  const [experience, setExperience] = useState<SensoryExperience | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIterating, setIsIterating] = useState(false);
  const [generationMode, setGenerationMode] = useState<"ai" | "demo" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "voice" | "image">("text");
  const [imageMetadata, setImageMetadata] = useState<{
    scene_description: string;
    scent_narrative: string;
  } | null>(null);

  // History for the iteration flow (uses scent formula as anchor)
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  // Handle pre-filled prompt from URL
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt) {
      handleGenerate(prompt);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Toggle a module
  const toggleModule = useCallback((key: ModuleKey) => {
    setActiveModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Enable all modules
  const enableAll = useCallback(() => {
    setActiveModules(new Set(ALL_MODULE_KEYS));
  }, []);

  // ---------------------------------------------------------------------------
  // Generate
  // ---------------------------------------------------------------------------

  const handleGenerate = useCallback(
    async (prompt: string) => {
      setIsLoading(true);

      const modulesArray = Array.from(activeModules);
      let newExperience: SensoryExperience | null = null;
      let mode: "ai" | "demo" = "demo";

      try {
        const res = await fetch("/api/decompose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, modules: modulesArray }),
        });
        const data = await res.json();

        if (res.ok && data.experience) {
          newExperience = data.experience as SensoryExperience;
          mode = "ai";
        } else if (data.demo) {
          showToast("API not configured -- using demo mode");
          newExperience = generateMockExperience(prompt, modulesArray);
          mode = "demo";
        } else {
          throw new Error(data.error || "API request failed");
        }
      } catch {
        showToast("Could not reach API -- falling back to demo mode");
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 500));
        newExperience = generateMockExperience(prompt, modulesArray);
        mode = "demo";
      }

      setGenerationMode(mode);
      setExperience(newExperience);

      // Build a history entry anchored on scent (if present)
      const scentFormula = newExperience.modules.scent as OSCFormula | undefined;
      if (scentFormula) {
        setHistory([
          {
            id: scentFormula.id,
            prompt,
            formula: scentFormula,
            timestamp: new Date().toISOString(),
            type: "initial",
          },
        ]);
      }

      setIsLoading(false);
    },
    [activeModules, showToast]
  );

  // ---------------------------------------------------------------------------
  // Iterate (refine)
  // ---------------------------------------------------------------------------

  const handleIterate = useCallback(
    async (modification: string) => {
      if (!experience) return;
      setIsIterating(true);

      const modulesArray = Array.from(activeModules);

      // For now, re-generate the full experience with the refined prompt
      let newExperience: SensoryExperience | null = null;
      let mode: "ai" | "demo" = "demo";
      const combinedPrompt = `${experience.prompt} -- ${modification}`;

      try {
        const res = await fetch("/api/decompose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: combinedPrompt,
            modules: modulesArray,
            refine: true,
            original_experience_id: experience.id,
          }),
        });
        const data = await res.json();

        if (res.ok && data.experience) {
          newExperience = data.experience as SensoryExperience;
          mode = "ai";
        } else if (data.demo) {
          showToast("API not configured -- using demo mode");
          newExperience = generateMockExperience(combinedPrompt, modulesArray);
          mode = "demo";
        } else {
          throw new Error(data.error || "API request failed");
        }
      } catch {
        showToast("Could not reach API -- falling back to demo mode");
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
        newExperience = generateMockExperience(combinedPrompt, modulesArray);
        mode = "demo";
      }

      setGenerationMode(mode);
      setExperience(newExperience);

      const scentFormula = newExperience.modules.scent as OSCFormula | undefined;
      if (scentFormula) {
        setHistory((prev) => [
          ...prev,
          {
            id: scentFormula.id,
            prompt: modification,
            formula: scentFormula,
            timestamp: new Date().toISOString(),
            type: "iteration",
          },
        ]);
      }

      setIsIterating(false);
    },
    [experience, activeModules, showToast]
  );

  // ---------------------------------------------------------------------------
  // Restore from history
  // ---------------------------------------------------------------------------

  const handleRestore = useCallback(
    (entry: HistoryEntry) => {
      if (!experience) return;
      // Update scent module in current experience
      setExperience({
        ...experience,
        modules: {
          ...experience.modules,
          scent: entry.formula,
        },
      });
    },
    [experience]
  );

  // ---------------------------------------------------------------------------
  // Image upload handler
  // ---------------------------------------------------------------------------

  const handleImageFormula = useCallback(
    (
      newFormula: OSCFormula,
      metadata: { scene_description: string; scent_narrative: string }
    ) => {
      setImageMetadata(metadata);

      // Build an experience around the image-generated formula
      const modulesArray = Array.from(activeModules);
      const newExperience = generateMockExperience(
        newFormula.prompt || "(generated from image)",
        modulesArray
      );
      newExperience.modules.scent = newFormula;

      setGenerationMode("ai");
      setExperience(newExperience);
      setHistory([
        {
          id: newFormula.id,
          prompt: newFormula.prompt || "(generated from image)",
          formula: newFormula,
          timestamp: new Date().toISOString(),
          type: "initial",
        },
      ]);
    },
    [activeModules]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const scentFormula = experience?.modules.scent as OSCFormula | undefined;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Create an Experience
        </h1>
        <p className="text-gray-500">
          Describe a memory, a place, or a feeling. We will bring it to life
          across every sense.
        </p>
      </motion.div>

      {/* Input area (shown when no experience generated yet) */}
      {!experience && (
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Input mode tabs */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface-800/40 border border-surface-500/20">
              {([
                { key: "text" as const, label: "Text", icon: PenTool },
                { key: "voice" as const, label: "Voice", icon: Mic },
                { key: "image" as const, label: "Image", icon: ImageIcon },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setInputMode(key)}
                  className={`
                    inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm
                    font-medium transition-all duration-200
                    ${
                      inputMode === key
                        ? "bg-primary-400/15 text-primary-300 border border-primary-400/25"
                        : "text-gray-500 hover:text-gray-300 border border-transparent"
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Module selector */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
              Active Modules
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {/* All button */}
              <button
                type="button"
                onClick={enableAll}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                  tracking-wider transition-all duration-200 border
                  ${
                    activeModules.size === ALL_MODULE_KEYS.length
                      ? "bg-primary-400/15 text-primary-300 border-primary-400/30"
                      : "text-gray-500 hover:text-gray-300 border-surface-500/30 hover:border-surface-400/40"
                  }
                `}
              >
                <Layers className="w-3.5 h-3.5" />
                ALL
              </button>

              {/* Individual module toggles */}
              {ALL_MODULE_KEYS.map((key) => {
                const meta = MODULE_META[key];
                const active = activeModules.has(key);
                const Icon = moduleIcons[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleModule(key)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                      tracking-wider transition-all duration-200 border
                    `}
                    style={{
                      backgroundColor: active ? `${meta.color}15` : "transparent",
                      color: active ? meta.color : "#6B7280",
                      borderColor: active ? `${meta.color}40` : "#374151",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text input */}
          {inputMode === "text" && (
            <PromptInput
              onSubmit={handleGenerate}
              isLoading={isLoading}
              mode="create"
            />
          )}

          {/* Voice input */}
          {inputMode === "voice" && (
            <VoiceInput onSubmit={handleGenerate} isLoading={isLoading} />
          )}

          {/* Image input */}
          {inputMode === "image" && (
            <ImageUpload
              onFormulaGenerated={handleImageFormula}
              isLoading={isLoading}
            />
          )}
        </motion.div>
      )}

      {/* Loading state */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-16 h-16 mb-6">
              {ALL_MODULE_KEYS.map((key, i) => {
                const meta = MODULE_META[key];
                const angle = (i / ALL_MODULE_KEYS.length) * Math.PI * 2 - Math.PI / 2;
                const radius = 24;
                return (
                  <motion.div
                    key={key}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: activeModules.has(key) ? meta.color : "#374151",
                      left: 32 + Math.cos(angle) * radius - 6,
                      top: 32 + Math.sin(angle) * radius - 6,
                    }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.2,
                      repeat: Infinity,
                    }}
                  />
                );
              })}
            </div>
            <div className="text-sm text-gray-400">
              Decomposing experience across {activeModules.size} senses...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {experience && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex gap-6">
              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-8">
                {/* Image analysis results */}
                {imageMetadata && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="card">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-4 h-4 text-primary-400" />
                        <span className="text-xs font-semibold text-primary-400 uppercase tracking-wide">
                          Scene
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {imageMetadata.scene_description}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Unified narrative card */}
                <div className="card border-primary-400/20">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-primary-400" />
                        <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">
                          Unified Narrative
                        </span>
                        {generationMode && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              generationMode === "ai"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                            }`}
                          >
                            {generationMode === "ai" ? (
                              <>
                                <Cpu className="w-3 h-3" /> AI
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" /> Demo
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 italic">
                        &quot;{experience.prompt}&quot;
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {experience.unified_narrative}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {experience.mood.map((m) => (
                      <span
                        key={m}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary-400/10 text-primary-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Iteration input */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    Refine Your Experience
                  </h3>
                  <PromptInput
                    onSubmit={handleIterate}
                    isLoading={isIterating}
                    mode="iterate"
                    placeholder="Make it warmer, add rain sounds, less bitter taste..."
                  />
                </div>

                {/* ============================================================= */}
                {/* MODULE RESULTS */}
                {/* ============================================================= */}

                {/* ATMOSPHERE */}
                {experience.modules.atmosphere && (
                  <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: MODULE_META.atmosphere.color }}
                      />
                      <h3
                        className="text-sm font-bold tracking-wider"
                        style={{ color: MODULE_META.atmosphere.color }}
                      >
                        ATMOSPHERE
                      </h3>
                    </div>
                    <AtmosphereVisualizer atmosphere={{ id: "gen", name: "Generated", prompt: "", description: "", profile: experience.modules.atmosphere, evolution: [], tags: [] }} />
                  </motion.div>
                )}

                {/* SCENT */}
                {scentFormula && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="card">
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: MODULE_META.scent.color }}
                        />
                        <h3
                          className="text-sm font-bold tracking-wider"
                          style={{ color: MODULE_META.scent.color }}
                        >
                          SCENT
                        </h3>
                      </div>

                      {/* Scent header */}
                      <div className="mb-4">
                        <h4 className="text-xl font-bold text-gray-100">
                          {scentFormula.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {scentFormula.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                          <span className="capitalize">
                            {scentFormula.sillage} sillage
                          </span>
                          <span className="text-surface-600">|</span>
                          <span>{scentFormula.longevity_hours}h longevity</span>
                        </div>
                      </div>

                      {/* Scent visualizations */}
                      <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div className="flex flex-col items-center">
                          <h4 className="text-xs font-semibold text-gray-400 mb-3 self-start">
                            Scent Wheel
                          </h4>
                          <ScentWheel
                            ingredients={scentFormula.ingredients}
                            name={scentFormula.name}
                            size={260}
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-3">
                            Note Pyramid
                          </h4>
                          <NotePyramid ingredients={scentFormula.ingredients} />
                        </div>
                      </div>
                    </div>

                    {/* Formula card */}
                    <div className="card">
                      <h4 className="text-xs font-semibold text-gray-400 mb-3">
                        Complete Formula
                      </h4>
                      <FormulaCard formula={scentFormula} showOSC={true} />
                    </div>
                  </motion.div>
                )}

                {/* TEXTURE */}
                {experience.modules.texture && (
                  <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: MODULE_META.texture.color }}
                      />
                      <h3
                        className="text-sm font-bold tracking-wider"
                        style={{ color: MODULE_META.texture.color }}
                      >
                        TEXTURE
                      </h3>
                    </div>
                    <TextureVisualizer texture={experience.modules.texture} />
                  </motion.div>
                )}

                {/* TASTE */}
                {experience.modules.taste && (
                  <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: MODULE_META.taste.color }}
                      />
                      <h3
                        className="text-sm font-bold tracking-wider"
                        style={{ color: MODULE_META.taste.color }}
                      >
                        TASTE
                      </h3>
                    </div>
                    <TasteVisualizer flavor={experience.modules.taste} />
                  </motion.div>
                )}

                {/* PULSE */}
                {experience.modules.pulse && (
                  <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: MODULE_META.pulse.color }}
                      />
                      <h3
                        className="text-sm font-bold tracking-wider"
                        style={{ color: MODULE_META.pulse.color }}
                      >
                        PULSE
                      </h3>
                    </div>
                    <PulseVisualizer pulseData={experience.modules.pulse} />
                  </motion.div>
                )}

                {/* Start over */}
                <div className="text-center pt-4">
                  <button
                    onClick={() => {
                      setExperience(null);
                      setHistory([]);
                      setGenerationMode(null);
                      setImageMetadata(null);
                    }}
                    className="btn-secondary text-sm"
                  >
                    Start Over With New Prompt
                  </button>
                </div>
              </div>

              {/* History sidebar */}
              {history.length > 0 && (
                <div className="hidden lg:block w-72 flex-shrink-0">
                  <div className="sticky top-24">
                    <div className="card">
                      <IterationPanel
                        history={history}
                        currentId={scentFormula?.id || history[0]?.id || ""}
                        onRestore={handleRestore}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile history toggle */}
            {history.length > 0 && (
              <div className="lg:hidden mt-6">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <History className="w-4 h-4" />
                  {showHistory ? "Hide" : "Show"} History ({history.length})
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      className="mt-4 card"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <IterationPanel
                        history={history}
                        currentId={scentFormula?.id || history[0]?.id || ""}
                        onRestore={handleRestore}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-700 border border-surface-500 text-gray-300 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
