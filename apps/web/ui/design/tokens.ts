import { cn } from "@dub/utils";

// Centralized design tokens for the web app. Keep this minimal and reuse everywhere.
//
// Minimalism guardrails (dashboard):
// - Prefer separation via `surface.*` + `spacing.*` over borders/shadows.
// - Avoid gradients and all shadows (no `bg-gradient-to-*`, no `shadow-*`).
// - Borders should be hairline dividers only (`border-neutral-100`-ish), mostly for tables.
// - Controls should use shared primitives (`AppButton`, `AppIconButton`, `AppInput`) to prevent style drift.

export const radius = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  full: "rounded-full",
} as const;

export const spacing = {
  // Page wrapper spacing (outside the white content panel)
  pageTop: "pt-3 md:pt-6",

  // Common content spacing
  sectionY: "py-4 md:py-5",
  sectionGap: "gap-3 md:gap-4",
  stackGap: "gap-2 md:gap-3",

  // Cards / panels
  cardPadding: "p-4 md:p-5",
  cardHeaderPadding: "px-4 py-3",
  cardBodyPadding: "px-4 py-3",
} as const;

export const text = {
  pageTitle: "text-xl md:text-2xl font-semibold leading-7 text-neutral-900",
  pageDescription: "text-sm md:text-base text-neutral-500",
  sectionTitle: "text-sm font-semibold text-neutral-900",
  muted: "text-xs text-neutral-500",
} as const;

export const surface = {
  // App shell (behind content)
  // Shell = very light neutral to let content surfaces read clearly.
  shell: "bg-neutral-50",

  // Main content panel
  content: "bg-white",

  // Sidebar/nav surface (kept white so it feels like a persistent panel)
  // Slight tint so it doesn't visually disappear next to the main white content panel.
  sidebar: "bg-neutral-50/80",

  // Light panels / headers inside cards
  // Use a slight tint so sections don't read like “cards on cards”.
  section: "bg-neutral-50/60",
} as const;

export const borders = {
  // Keep borders extremely subtle; rely on surface contrast instead.
  hairline: "border border-neutral-200/50",
  topHairline: "border-t border-neutral-200/50",
  divider: "border-neutral-200/50",
} as const;

export const card = {
  // Minimal: no shadows, no heavy borders. Cards stand out via white-on-neutral surface contrast.
  base: cn(radius.lg, surface.content),
  header: cn(
    "flex items-center justify-between",
    spacing.cardHeaderPadding,
    surface.section,
  ),
  body: spacing.cardBodyPadding,
} as const;

export const layout = {
  // Content wrapper used by PageContent.
  // Background is owned by the app shell (MainNav) to avoid “mixed” stacked backgrounds.
  contentPanel: cn("pt-2.5 max-md:mt-3", "max-md:rounded-t-[16px]"),
};

export const controls = {
  // Default control height used across toolbars (inputs, buttons, selects).
  height: "h-10",
  // Secondary button sizing used in page headers/toolbars.
  buttonSecondary: cn(
    "inline-flex items-center justify-center",
    radius.md,
    "bg-white",
    "text-neutral-800",
    "hover:bg-neutral-50",
  ),
} as const;
