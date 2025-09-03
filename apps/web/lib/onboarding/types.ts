export const ONBOARDING_STEPS = [
  "workspace",
  "link",
  "domain",
  "domain/custom",
  "domain/register",
  "invite",
  "plan",
  "support",
  "completed",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
