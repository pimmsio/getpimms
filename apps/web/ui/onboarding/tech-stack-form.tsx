"use client";

import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { useOnboardingPreferences } from "@/lib/swr/use-onboarding-preferences";
import { AppButton } from "@/ui/components/controls/app-button";
import { TechStackSelector } from "@/ui/onboarding/tech-stack-selector-modal";
import { useState } from "react";

export function TechStackForm() {
  const { continueTo, isLoading } = useOnboardingProgress();
  const { providerIds } = useOnboardingPreferences();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasSelections = providerIds.length > 0;

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      continueTo("campaign-tracking");
    } catch (error) {
      console.error("Failed to continue:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <TechStackSelector
        active={true}
        chrome="none"
        showCloseButton={false}
        showHeading={false}
        onSavingChange={setIsSaving}
        scrollClassName="max-h-[40vh]"
      />

      <AppButton
        type="button"
        onClick={handleContinue}
        loading={isSubmitting || isLoading}
        disabled={isSaving}
        className="w-full"
        variant="primary"
      >
        {isSaving ? "Saving..." : hasSelections ? "Continue" : "Skip"}
      </AppButton>
    </div>
  );
}
