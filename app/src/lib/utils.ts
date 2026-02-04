import { Ingredient, Accord, ScentCategory } from "./types";

const categoryColors: Record<ScentCategory, string> = {
  citrus: "#FFD93D",
  floral: "#FF6B9D",
  woody: "#8B6914",
  fresh: "#6EC6FF",
  oriental: "#FF6B35",
  musk: "#C9B1FF",
  green: "#7BC67E",
  fruity: "#FF8FA3",
  spicy: "#FF4444",
  aquatic: "#4ECDC4",
  gourmand: "#D4956A",
  leather: "#6B3A2A",
  aromatic: "#82C46C",
  amber: "#FFAA33",
  powdery: "#E8D5E0",
  earthy: "#8B7355",
  smoky: "#6B6B6B",
  herbal: "#A0C55F",
  animalic: "#7A5C3E",
  balsamic: "#CC8844",
};

export function getCategoryColor(category: string): string {
  return categoryColors[category as ScentCategory] || "#888888";
}

export function getCategoryColorWithOpacity(category: string, opacity: number): string {
  const hex = getCategoryColor(category);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function formatPercentage(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function generateScentId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const segments = [8, 4, 4, 4, 12];
  return segments
    .map((len) =>
      Array.from({ length: len }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join("")
    )
    .join("-");
}

export function sortByNoteType(ingredients: Ingredient[]): Ingredient[] {
  const order = { top: 0, middle: 1, base: 2 };
  return [...ingredients].sort((a, b) => order[a.note_type] - order[b.note_type]);
}

export function groupByNoteType(ingredients: Ingredient[]): {
  top: Ingredient[];
  middle: Ingredient[];
  base: Ingredient[];
} {
  return {
    top: ingredients.filter((i) => i.note_type === "top"),
    middle: ingredients.filter((i) => i.note_type === "middle"),
    base: ingredients.filter((i) => i.note_type === "base"),
  };
}

export function calculateAccords(ingredients: Ingredient[]): Accord[] {
  const accords: Accord[] = [];

  const categories = new Map<string, Ingredient[]>();
  for (const ing of ingredients) {
    if (!categories.has(ing.category)) {
      categories.set(ing.category, []);
    }
    categories.get(ing.category)!.push(ing);
  }

  // Floral accord
  const florals = categories.get("floral");
  if (florals && florals.length >= 2) {
    const strength = florals.reduce((sum, i) => sum + i.percentage, 0);
    accords.push({
      name: "Floral Bouquet",
      strength: Math.min(strength * 2, 100),
      ingredients: florals.map((i) => i.name),
    });
  }

  // Fresh accord
  const fresh = [
    ...(categories.get("citrus") || []),
    ...(categories.get("fresh") || []),
    ...(categories.get("aquatic") || []),
  ];
  if (fresh.length >= 2) {
    const strength = fresh.reduce((sum, i) => sum + i.percentage, 0);
    accords.push({
      name: "Fresh Breeze",
      strength: Math.min(strength * 1.5, 100),
      ingredients: fresh.map((i) => i.name),
    });
  }

  // Woody accord
  const woodys = categories.get("woody");
  if (woodys && woodys.length >= 2) {
    const strength = woodys.reduce((sum, i) => sum + i.percentage, 0);
    accords.push({
      name: "Woody Foundation",
      strength: Math.min(strength * 2, 100),
      ingredients: woodys.map((i) => i.name),
    });
  }

  // Oriental accord
  const orientals = [
    ...(categories.get("oriental") || []),
    ...(categories.get("spicy") || []),
    ...(categories.get("amber") || []),
  ];
  if (orientals.length >= 2) {
    const strength = orientals.reduce((sum, i) => sum + i.percentage, 0);
    accords.push({
      name: "Oriental Warmth",
      strength: Math.min(strength * 2, 100),
      ingredients: orientals.map((i) => i.name),
    });
  }

  // Gourmand accord
  const gourmands = categories.get("gourmand");
  if (gourmands && gourmands.length >= 1) {
    const strength = gourmands.reduce((sum, i) => sum + i.percentage, 0);
    accords.push({
      name: "Gourmand Sweetness",
      strength: Math.min(strength * 3, 100),
      ingredients: gourmands.map((i) => i.name),
    });
  }

  // Green accord
  const greens = [
    ...(categories.get("green") || []),
    ...(categories.get("herbal") || []),
    ...(categories.get("aromatic") || []),
  ];
  if (greens.length >= 2) {
    const strength = greens.reduce((sum, i) => sum + i.percentage, 0);
    accords.push({
      name: "Green Vitality",
      strength: Math.min(strength * 2, 100),
      ingredients: greens.map((i) => i.name),
    });
  }

  return accords.sort((a, b) => b.strength - a.strength);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
