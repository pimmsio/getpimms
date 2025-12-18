"use client";

import { useSearchParams } from "next/navigation";
import { OnboardingModalWrapper } from "@/ui/onboarding/onboarding-modal-wrapper";
import { TrackingFamiliarityForm } from "@/ui/onboarding/tracking-familiarity-form";
import { UtmConversionForm } from "@/ui/onboarding/utm-conversion-form";
import { CompleteForm } from "@/ui/onboarding/complete-form";

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
            <div className="mb-2 text-xs font-medium text-neutral-500">
              Step 1 of 3
            </div>
            <h1 className="mb-2 text-center text-2xl font-semibold text-neutral-900">
              How familiar are you with tracking? Have you used any other tools?
            </h1>
            <p className="mb-6 text-center text-sm text-neutral-600">
              This helps us understand where you're coming from so we can provide
              better support and make your transition to Pimms smooth.
            </p>
            <TrackingFamiliarityForm />
          </div>
        );
      case "utm-conversion":
        return (
          <div className="flex w-full flex-col items-center">
            <div className="mb-2 text-xs font-medium text-neutral-500">
              Step 2 of 3
            </div>
            <h1 className="mb-2 text-center text-2xl font-semibold text-neutral-900">
              What do you want to track with UTM and conversions?
            </h1>
            <p className="mb-6 text-center text-sm text-neutral-600">
              Help us understand your tracking needs so we can set up the right
              features for you.
            </p>
            <UtmConversionForm />
          </div>
        );
      case "complete":
        return (
          <div className="flex w-full flex-col items-center">
            <div className="mb-2 text-xs font-medium text-neutral-500">
              Step 3 of 3
            </div>
            <h1 className="mb-2 text-center text-2xl font-semibold text-neutral-900">
              You're all set to start with Pimms! 🚀
            </h1>
            <p className="mb-6 text-center text-sm text-neutral-600">
              Your free account starts now.
            </p>
            <CompleteForm />
          </div>
        );
      default:
        return null;
    }
  };

  const stepContent = renderStep();

  // Don't render modal if step content is null (unknown step)
  if (!stepContent) {
    return null;
  }

  return (
    <OnboardingModalWrapper>{stepContent}</OnboardingModalWrapper>
  );
}
