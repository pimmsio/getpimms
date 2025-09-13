import { SkinWeight, Gender } from "./types";
import { detectGender } from "./gender-detector";

// SVG cache for Edge Runtime
const svgCache = new Map<string, string>();

// Skin color weights for DiceBear avatars (matches UI package)
export const SKIN_WEIGHTS: SkinWeight[] = [
  { hex: "fdf4ee", pct: 40 },
  { hex: "ffd4b3", pct: 20 },
  { hex: "edb98a", pct: 10 },
  { hex: "f6e2ab", pct: 10 },
  { hex: "b26849", pct: 7 },
  { hex: "a36d4c", pct: 7 },
  { hex: "6b4311", pct: 10 },
  { hex: "301e10", pct: 6 }
];

// Hash function for deterministic random number generation
export function hashStringToInt(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

// Pseudo-random number generator
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// SVG sanitization for SEO
export function sanitizeSvg(svg: string): string {
  let s = svg;
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
  s = s.replace(/<title[\s\S]*?<\/title>/gi, "");
  s = s.replace(/<desc[\s\S]*?<\/desc>/gi, "");
  s = s.replace(/<rdf:RDF[\s\S]*?<\/rdf:RDF>/gi, "");
  return s.trim();
}

// Pick skin color based on weighted distribution
export function pickSkinWeightedForSeed(seed: string): string {
  const rng = mulberry32(hashStringToInt(`skin::${seed}`));
  const r = rng();
  const total = SKIN_WEIGHTS.reduce((acc, x) => acc + x.pct, 0) || 1;
  let cum = 0;
  for (const sw of SKIN_WEIGHTS) {
    cum += sw.pct / total;
    if (r < cum) return sw.hex;
  }
  return SKIN_WEIGHTS[SKIN_WEIGHTS.length - 1].hex;
}

// Generate DiceBear avatar with proper error handling
export async function getAvatarSvgCached(seed: string): Promise<string> {
  try {
    // Check cache first
    const cached = svgCache.get(seed);
    if (cached) return cached;

    // Validate seed
    if (!seed || seed.trim() === "") {
      throw new Error("Invalid seed provided");
    }

    const skinColor = pickSkinWeightedForSeed(seed);
    const isFemale = seed.includes('-female');
    const baseSeed = seed.replace('-male', '').replace('-female', '');

    // Validate baseSeed after processing
    if (!baseSeed || baseSeed.trim() === "") {
      throw new Error("Invalid base seed after processing");
    }

    // Dynamic import for Edge Runtime
    const { createAvatar } = await import("@dicebear/core");
    const avataaars = await import("@dicebear/avataaars");

    if (!createAvatar || !avataaars) {
      throw new Error("Failed to import DiceBear modules");
    }

    const avatar = createAvatar(avataaars, {
      seed: baseSeed,
      radius: 50,
      backgroundColor: ["ebfbfe", "eff6ff", "e6f4f1", "ffe6e6"],
      eyes: ["happy", "default"],
      eyebrows: ["default", "raisedExcited", "defaultNatural", "raisedExcitedNatural"],
      mouth: ["smile", "default", "serious"],
      style: ["default"],
      skinColor: [skinColor],
      hairColor: isFemale 
        ? ["e8d1a9", "f25555", "241c11", "d2691e"]
        : ["08272e", "e8d1a9", "241c11", "f25555"],
      facialHairColor: ["08272e"],
      facialHairProbability: isFemale ? 0 : 30,
      accessoriesProbability: isFemale ? 15 : 5,
      hatColor: ["08272e"],
      clothesColor: isFemale 
        ? ["1d4ed8", "08272e", "e91e63", "9c27b0"]
        : ["1d4ed8", "08272e"]
    });

    if (!avatar) {
      throw new Error("Failed to create avatar");
    }

    const avatarString = avatar.toString();
    if (!avatarString || avatarString.trim() === "") {
      throw new Error("Avatar generated empty string");
    }

    const sanitized = sanitizeSvg(avatarString);
    if (!sanitized || !sanitized.includes("<svg")) {
      throw new Error("Invalid SVG after sanitization");
    }

    // Cache the result
    svgCache.set(seed, sanitized);
    return sanitized;
  } catch (error) {
    console.error(`Error generating avatar for seed "${seed}":`, error);
    throw error; // Re-throw to be handled by caller
  }
}

// Generate avatar seed with gender detection
export function generateAvatarSeed(baseSeed: string, name?: string): string {
  const gender: Gender = name ? detectGender(name) : 'male';
  return `${baseSeed}-${gender}`;
}
