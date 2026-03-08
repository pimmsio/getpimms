export const ONBOARDING_STEPS = [
  "tracking-familiarity",
  "tracking",
  "tech-stack",
  "campaign-tracking",
  // Legacy steps kept for backward compatibility with existing users mid-onboarding
  "deeplinks",
  "utm",
  "utm-conversion",
  "complete",
  "domain",
  "domain/custom",
  "domain/register",
  "invite",
  "support",
  "completed",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
