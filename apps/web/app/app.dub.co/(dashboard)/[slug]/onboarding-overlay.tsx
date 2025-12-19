"use client";

import { CompleteForm } from "@/ui/onboarding/complete-form";
import { DeepLinksForm } from "@/ui/onboarding/deeplinks-form";
import { OnboardingModalWrapper } from "@/ui/onboarding/onboarding-modal-wrapper";
import { TrackingFamiliarityForm } from "@/ui/onboarding/tracking-familiarity-form";
import { TrackingForm } from "@/ui/onboarding/tracking-form";
import { UtmForm } from "@/ui/onboarding/utm-form";
import { useSearchParams } from "next/navigation";

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
              Step 1 of 5
            </div>
            <h1 className="mb-2 text-center text-2xl font-semibold text-neutral-900">
              Quick vibe check: how “tracking-y” are you?
            </h1>
            <div className="mb-6" />
            <TrackingFamiliarityForm />
          </div>
        );
      case "deeplinks":
        return (
          <div className="flex w-full flex-col items-center">
            <div className="mb-2 text-xs font-medium text-neutral-500">
              Step 2 of 5
            </div>
            <div className="w-full">
              <div className="mb-6">
                <div className="text-sm font-medium text-neutral-600">
                  Mobile Deep Links
                </div>
                <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
                  Opens the official app
                </h1>
                <div className="mt-2 text-sm text-neutral-600">
                  On mobile, your Pimms link opens the right app (ex: YouTube →
                  YouTube app) — fewer drop‑offs.
                </div>
              </div>
              <DeepLinksForm />
            </div>
          </div>
        );
      case "tracking":
        return (
          <div className="flex w-full flex-col items-center">
            <div className="mb-2 text-xs font-medium text-neutral-500">
              Step 3 of 5
            </div>
            <div className="w-full">
              <div className="mb-6">
                <div className="text-sm font-medium text-neutral-600">
                  Tracking
                </div>
                <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
                  Capture leads & conversion paths
                </h1>
                <div className="mt-3 space-y-1 text-sm text-neutral-600">
                  <div>Collect leads from forms, bookings, payments.</div>
                  <div>
                    Understand the path to conversion: content consumed, clicks,
                    opt-in, payments.
                  </div>
                  <div>
                    Lead Signals show live activity + scoring so you focus on
                    prospects most likely to convert.
                  </div>
                </div>
              </div>
              <TrackingForm />
            </div>
          </div>
        );
      case "utm":
      case "utm-conversion":
        return (
          <div className="flex w-full flex-col items-center">
            <div className="mb-2 text-xs font-medium text-neutral-500">
              Step 4 of 5
            </div>
            <div className="w-full">
              <div className="mb-6">
                <div className="text-sm font-medium text-neutral-600">UTM</div>
                <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
                  Split traffic. Organize links. Learn faster.
                </h1>
                <div className="mt-3 space-y-1 text-sm text-neutral-600">
                  <div>
                    UTMs help you compare campaigns fast—and Pimms makes them
                    easy to create consistently.
                  </div>
                </div>
              </div>
              <UtmForm />
            </div>
          </div>
        );
      case "complete":
        return (
          <div className="flex w-full flex-col items-center">
            <div className="mb-2 text-xs font-medium text-neutral-500">
              Step 5 of 5
            </div>
            <h1 className="mb-2 text-center text-2xl font-semibold text-neutral-900">
              You’re in. Let’s ship links.
            </h1>
            <div className="mb-6" />
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

  return <OnboardingModalWrapper>{stepContent}</OnboardingModalWrapper>;
}
