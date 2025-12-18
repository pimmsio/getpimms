export const ONBOARDING_STEPS = [
  "tracking-familiarity",
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
