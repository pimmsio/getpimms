"use client";

import { OnboardingModalWrapper } from "@/ui/onboarding/onboarding-modal-wrapper";
import { TechStackForm } from "@/ui/onboarding/tech-stack-form";
import { TrackingFamiliarityForm } from "@/ui/onboarding/tracking-familiarity-form";
import { TrackingForm } from "@/ui/onboarding/tracking-form";
import { UtmForm } from "@/ui/onboarding/utm-form";
import { useSearchParams } from "next/navigation";

const TOTAL_STEPS = 4;

function StepLabel({ step }: { step: number }) {
  return (
    <div className="mb-2 text-xs font-medium text-neutral-500">
      Step {step} of {TOTAL_STEPS}
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  const pct = (step / TOTAL_STEPS) * 100;
  return (
    <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
      <div
        className="h-full rounded-full bg-neutral-900 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function OnboardingOverlay() {
  const searchParams = useSearchParams();
  const onboardingStep = searchParams.get("onboarding");

  if (!onboardingStep) {
    return null;
  }

  const renderStep = () => {
    switch (onboardingStep) {
      case "tracking-familiarity":
        return (
          <div className="flex w-full flex-col items-center">
            <ProgressBar step={1} />
            <StepLabel step={1} />
            <h1 className="mb-2 text-center text-2xl font-semibold text-neutral-900">
              What brings you to Pimms?
            </h1>
            <p className="mb-6 text-center text-sm text-neutral-600">
              Select all that apply — this helps us personalize your experience.
            </p>
            <TrackingFamiliarityForm />
          </div>
        );
      case "tracking":
        return (
          <div className="flex w-full flex-col items-center">
            <ProgressBar step={2} />
            <StepLabel step={2} />
            <div className="w-full">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-neutral-900">
                  What do you want to track?
                </h1>
                <div className="mt-2 text-sm text-neutral-600">
                  Pick the conversions that matter most to you.
                </div>
              </div>
              <TrackingForm />
            </div>
          </div>
        );
      case "tech-stack":
        return (
          <div className="flex w-full flex-col items-center">
            <ProgressBar step={3} />
            <StepLabel step={3} />
            <div className="w-full">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-neutral-900">
                  What's your tech stack?
                </h1>
                <div className="mt-2 text-sm text-neutral-600">
                  Select the tools and platforms you use — we'll show you
                  personalized setup guides.
                </div>
              </div>
              <TechStackForm />
            </div>
          </div>
        );
      case "campaign-tracking":
        return (
          <div className="flex w-full flex-col items-center">
            <ProgressBar step={4} />
            <StepLabel step={4} />
            <div className="w-full">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-neutral-900">
                  How do you track campaigns today?
                </h1>
                <div className="mt-2 text-sm text-neutral-600">
                  No wrong answer — this helps us suggest the right features for
                  you.
                </div>
              </div>
              <UtmForm />
            </div>
          </div>
        );
      // Legacy steps: redirect to the new flow start if somehow reached
      case "deeplinks":
      case "utm":
      case "utm-conversion":
      case "complete":
        return (
          <div className="flex w-full flex-col items-center">
            <ProgressBar step={1} />
            <StepLabel step={1} />
            <h1 className="mb-2 text-center text-2xl font-semibold text-neutral-900">
              What brings you to Pimms?
            </h1>
            <p className="mb-6 text-center text-sm text-neutral-600">
              Select all that apply — this helps us personalize your experience.
            </p>
            <TrackingFamiliarityForm />
          </div>
        );
      default:
        return null;
    }
  };

  const stepContent = renderStep();

  if (!stepContent) {
    return null;
  }

  return <OnboardingModalWrapper>{stepContent}</OnboardingModalWrapper>;
}
