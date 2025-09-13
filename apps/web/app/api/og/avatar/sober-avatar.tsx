import { ImageResponse } from "next/og";
import { SoberAvatarComponentProps } from "./types";
import { createAvatarProps } from "./avatar-config";

// Sober Avatar Component
export function SoberAvatarComponent({ avatarProps }: SoberAvatarComponentProps) {
  const { theme, head, shoulders } = avatarProps;
  
  return (
    <div
      tw="flex items-center justify-center w-full h-full relative"
      style={{
        background: theme.bg,
        display: "flex",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Head */}
      <div
        tw="absolute rounded-full"
        style={{
          background: theme.fg,
          display: "flex",
          width: `${head.width}px`,
          height: `${head.height}px`,
          top: `${head.top}px`,
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.2) 100%)",
          boxShadow:
            "inset 6px -5px 11px rgba(0,0,0,0.13), inset -18px -12px 19px rgba(255,255,255,0.4)",
        }}
      />
      {/* Shoulders */}
      <div
        tw="absolute rounded-full"
        style={{
          background: theme.fg,
          display: "flex",
          width: `${shoulders.width}px`,
          height: `${shoulders.height}px`,
          top: `${shoulders.top}px`,
          clipPath: "inset(0 0 50% 0)",
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.2) 100%)",
          boxShadow:
            "inset 10px -12px 19px rgba(0,0,0,0.4), inset -18px -12px 19px rgba(255,255,255,0.4), inset 2px -1px 11px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
}

// Generate sober avatar response with error handling
export function getSoberAvatarResponse(seed: string, corsHeaders: Record<string, string>) {
  try {
    const avatarProps = createAvatarProps(seed);
    
    return new ImageResponse(
      <SoberAvatarComponent avatarProps={avatarProps} />,
      {
        width: avatarProps.size.width,
        height: avatarProps.size.height,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Error generating sober avatar:", error);
    // Return fallback avatar
    const fallbackProps = createAvatarProps(null);
    return new ImageResponse(
      <SoberAvatarComponent avatarProps={fallbackProps} />,
      {
        width: fallbackProps.size.width,
        height: fallbackProps.size.height,
        headers: corsHeaders,
      },
    );
  }
}
