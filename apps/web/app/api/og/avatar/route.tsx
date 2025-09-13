import { NextRequest, NextResponse } from "next/server";
import { detectGender } from "./gender-detector";

// Copie du code Dicebear pour Edge Runtime
const svgCache = new Map<string, string>();

function hashStringToInt(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sanitizeSvg(svg: string): string {
  let s = svg;
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
  s = s.replace(/<title[\s\S]*?<\/title>/gi, "");
  s = s.replace(/<desc[\s\S]*?<\/desc>/gi, "");
  s = s.replace(/<rdf:RDF[\s\S]*?<\/rdf:RDF>/gi, "");
  return s.trim();
}

const SKIN_WEIGHTS: Array<{ hex: string; pct: number }> = [
  { hex: "fdf4ee", pct: 40 },
  { hex: "ffd4b3", pct: 20 },
  { hex: "edb98a", pct: 10 },
  { hex: "f6e2ab", pct: 10 },
  { hex: "b26849", pct: 7 },
  { hex: "a36d4c", pct: 7 },
  { hex: "6b4311", pct: 10 },
  { hex: "301e10", pct: 6 }
];

function pickSkinWeightedForSeed(seed: string): string {
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

async function getAvatarSvgCached(seed: string): Promise<string> {
  const cached = svgCache.get(seed);
  if (cached) return cached;

  const skinColor = pickSkinWeightedForSeed(seed);
  const isFemale = seed.includes('-female');
  const baseSeed = seed.replace('-male', '').replace('-female', '');

  // Import dynamique pour Edge Runtime
  const { createAvatar } = await import("@dicebear/core");
  const avataaars = await import("@dicebear/avataaars");

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

  const sanitized = sanitizeSvg(avatar.toString());
  svgCache.set(seed, sanitized);
  return sanitized;
}

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  // Validate the origin header and set CORS headers accordingly
  const corsHeaders = {
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "image/svg+xml",
  };

  if (origin && origin.endsWith(".dub.co")) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
  }

  const { searchParams } = new URL(req.url);
  const seed = searchParams.get("seed");
  const name = searchParams.get("name");
  
  if (!seed) {
    return new NextResponse("Missing seed parameter", { status: 400 });
  }

  // Détecter le genre basé sur le nom si fourni
  const gender = name ? detectGender(name) : 'male';
  
  // Générer l'avatar Dicebear avec le genre détecté
  const avatarSeed = `${seed}-${gender}`;
  const svgString = await getAvatarSvgCached(avatarSeed);

  return new NextResponse(svgString, {
    headers: corsHeaders,
  });
}
