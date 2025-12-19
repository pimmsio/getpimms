"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useWorkspace from "@/lib/swr/use-workspace";
import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { AppButton } from "@/ui/components/controls/app-button";
import { MultiChoiceButtons } from "@/ui/onboarding/choice-buttons";

type TrackingSetupAnswer = {
  firstGoals: Array<"forms" | "bookings" | "payments">;
};

export function TrackingForm() {
  const { continueTo, isLoading } = useOnboardingProgress();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug } = useWorkspace();
  const slug = workspaceSlug || searchParams.get("workspace") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answer, setAnswer] = useState<TrackingSetupAnswer>({ firstGoals: [] });

  const toggleGoal = (goal: TrackingSetupAnswer["firstGoals"][number]) => {
    setAnswer((prev) => ({
      ...prev,
      firstGoals: prev.firstGoals.includes(goal)
        ? prev.firstGoals.filter((g) => g !== goal)
        : [...prev.firstGoals, goal],
    }));
  };

  const handleContinue = async () => {
    if (answer.firstGoals.length === 0) return;
    setIsSubmitting(true);
    try {
      await saveOnboardingAnswer("trackingSetup", answer, slug);
      continueTo("utm");
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="text-sm font-semibold text-neutral-900">
        What do you want to capture first?
      </div>
      <MultiChoiceButtons
        columns={2}
        values={answer.firstGoals}
        onToggle={(v) => toggleGoal(v)}
        options={[
          { value: "forms", label: "Forms (leads)" },
          { value: "bookings", label: "Bookings (Calendly, etc.)" },
          { value: "payments", label: "Payments (sales)" },
        ]}
      />

      <AppButton
        type="button"
        onClick={handleContinue}
        loading={isSubmitting || isLoading}
        disabled={answer.firstGoals.length === 0}
        className="w-full"
        variant="primary"
      >
        Continue →
      </AppButton>
    </div>
  );
}


