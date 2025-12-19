"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useWorkspace from "@/lib/swr/use-workspace";
import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { AppButton } from "@/ui/components/controls/app-button";

type TrackingBenefitsAnswer = {
  interest: "yes" | "maybe" | "no" | "";
};

export function TrackingBenefitsForm() {
  const { continueTo, isLoading } = useOnboardingProgress();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug } = useWorkspace();
  const slug = workspaceSlug || searchParams.get("workspace") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answer, setAnswer] = useState<TrackingBenefitsAnswer>({ interest: "" });

  const handleSubmit = async () => {
    if (!answer.interest) return;
    setIsSubmitting(true);
    try {
      await saveOnboardingAnswer("trackingBenefits", answer, slug);
      continueTo("utm");
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { value: "yes", label: "Yes, I want this" },
          { value: "maybe", label: "Maybe later" },
          { value: "no", label: "Not for me" },
        ].map(({ value, label }) => {
          const selected = answer.interest === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() =>
                setAnswer({ interest: value as TrackingBenefitsAnswer["interest"] })
              }
              className={[
                "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                selected
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white hover:border-neutral-300",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      <AppButton
        type="button"
        onClick={handleSubmit}
        loading={isSubmitting || isLoading}
        disabled={!answer.interest}
        className="w-full"
        variant="primary"
      >
        Continue →
      </AppButton>
    </div>
  );
}


