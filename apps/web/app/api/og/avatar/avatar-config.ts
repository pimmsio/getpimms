import { AvatarProps } from "./types";
import { getTheme } from "./utils";

// Default avatar configuration
export const DEFAULT_AVATAR_CONFIG: AvatarProps = {
  theme: { bg: "#DBEAFE", fg: "#2B7FFF" }, // Default blue theme
  size: { width: 128, height: 128 },
  head: { width: 51, height: 51, top: 28 },
  shoulders: { width: 102, height: 102, top: 90 },
};

// Create avatar props with theme based on seed
export function createAvatarProps(seed?: string | null): AvatarProps {
  const theme = getTheme(seed);
  return {
    ...DEFAULT_AVATAR_CONFIG,
    theme,
  };
}
