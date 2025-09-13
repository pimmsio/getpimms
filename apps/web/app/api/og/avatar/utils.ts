import { THEMES } from "./themes";
import { Theme } from "./types";

// Simple but effective hash function for strings
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get theme based on seed with proper error handling
export function getTheme(seed?: string | null): Theme {
  try {
    if (!seed || seed.trim() === "") {
      // If no seed provided, return first theme as default (consistent fallback)
      return THEMES[0];
    }
    
    // Use hash function to get deterministic index
    const index = hashCode(seed) % THEMES.length;
    return THEMES[index];
  } catch (error) {
    console.error("Error getting theme for seed:", seed, error);
    // Return default theme on error
    return THEMES[0];
  }
}
