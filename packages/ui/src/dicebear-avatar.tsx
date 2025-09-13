import { createAvatar } from "@dicebear/core";
import * as avataaars from "@dicebear/avataaars";

const svgCache = new Map<string, string>();

// =====================
// Helpers RNG stables
// =====================
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

// =====================
// Anti-SEO sanitize
// =====================
export function sanitizeSvg(svg: string): string {
  let s = svg;
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
  s = s.replace(/<title[\s\S]*?<\/title>/gi, "");
  s = s.replace(/<desc[\s\S]*?<\/desc>/gi, "");
  s = s.replace(/<rdf:RDF[\s\S]*?<\/rdf:RDF>/gi, "");
  return s.trim();
}

// =====================
// Pool de seeds partagé (nonce passé côté serveur pour varier à chaque reload)
// =====================
export function getSharedSeeds(size: number, seedNonce: string): string[] {
  const base = `pimms-avatar-seed-v3-${seedNonce}`;
  return Array.from({ length: size }, (_, i) => `visitor-${base}-${i}`);
}

// =====================
// Réglage des pourcentages par couleur
// (valeurs EXEMPLE à ajuster ; total 100)
// =====================
export const SKIN_WEIGHTS: Array<{ hex: string; pct: number }> = [
  { hex: "fdf4ee", pct: 40 },
  { hex: "ffd4b3", pct: 20 },
  { hex: "edb98a", pct: 10 },
  { hex: "f6e2ab", pct: 10 },
  { hex: "b26849", pct: 7 },
  { hex: "a36d4c", pct: 7 },
  { hex: "6b4311", pct: 10 },
  { hex: "301e10", pct: 6 }
];
// NB: ajuste ces pourcentages comme tu veux ; ils sont normalisés ci-dessous.
//     L'ordre n'a pas d'importance.

function pickSkinWeightedForSeed(seed: string): string {
  // RNG déterministe à partir du seed => SSR/CSR identique
  const rng = mulberry32(hashStringToInt(`skin::${seed}`));
  const r = rng(); // [0,1)

  // normalise au cas où la somme != 100
  const total = SKIN_WEIGHTS.reduce((acc, x) => acc + x.pct, 0) || 1;
  let cum = 0;
  for (const sw of SKIN_WEIGHTS) {
    cum += sw.pct / total;
    if (r < cum) return sw.hex;
  }
  // fallback (sécurité flottants)
  return SKIN_WEIGHTS[SKIN_WEIGHTS.length - 1].hex;
}

// =====================
// Générateur d'avatar (utilise la couleur pondérée)
// =====================
export function getAvatarSvgCached(seed: string): string {
  const cached = svgCache.get(seed);
  if (cached) return cached;

  const skinColor = pickSkinWeightedForSeed(seed); // <<— pondération appliquée
  
  // Détecter le genre à partir du seed
  const isFemale = seed.includes('-female');
  const baseSeed = seed.replace('-male', '').replace('-female', '');

  const avatar = createAvatar(avataaars, {
    seed: baseSeed,
    radius: 50,
    backgroundColor: ["ebfbfe", "eff6ff", "e6f4f1", "ffe6e6"],
    eyes: ["happy", "default"],
    eyebrows: ["default", "raisedExcited", "defaultNatural", "raisedExcitedNatural"],
    mouth: ["smile", "default", "serious"],
    style: ["default"],
    // on passe UNE seule couleur choisie
    skinColor: [skinColor],
    hairColor: isFemale 
      ? ["e8d1a9", "f25555", "241c11", "d2691e"] // Plus de variété pour les femmes
      : ["08272e", "e8d1a9", "241c11", "f25555"],
    facialHairColor: ["08272e"],
    // Probabilité de barbe/moustache selon le genre
    facialHairProbability: isFemale ? 0 : 30,
    accessoriesProbability: isFemale ? 15 : 5, // Plus d'accessoires pour les femmes
    hatColor: ["08272e"],
    clothesColor: isFemale 
      ? ["1d4ed8", "08272e", "e91e63", "9c27b0"] // Plus de couleurs pour les femmes
      : ["1d4ed8", "08272e"]
  });

  const sanitized = sanitizeSvg(avatar.toString());
  svgCache.set(seed, sanitized);
  return sanitized;
}

// =====================
// Utilitaire pour obtenir l'URL de l'avatar
// =====================
export function getDicebearAvatarUrl(seed: string): string {
  const svgString = getAvatarSvgCached(seed);
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
}

// =====================
// React component pour afficher l'avatar
// =====================
export function DicebearAvatar({
  seed,
  className = "size-10 rounded-full",
  alt = "Avatar"
}: {
  seed: string;
  className?: string;
  alt?: string;
}) {
  const dataUrl = getDicebearAvatarUrl(seed);
  
  return (
    <img
      src={dataUrl}
      alt={alt}
      className={className}
      draggable={false}
    />
  );
}
