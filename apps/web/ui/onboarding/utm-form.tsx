"use client";

import { useState } from "react";
import { useWorkspaceSlug } from "@/lib/hooks/use-workspace-slug";
import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { AppButton } from "@/ui/components/controls/app-button";
import { ChoiceButtons } from "@/ui/onboarding/choice-buttons";
import { toast } from "sonner";

const TRACKING_HABIT_OPTIONS = [
  { value: "none", label: "I don't track yet" },
  { value: "spreadsheets", label: "Spreadsheets / manually" },
  { value: "analytics-utm", label: "Google Analytics / UTMs" },
  { value: "marketing-platform", label: "A marketing platform (HubSpot, etc.)" },
] as const;

type TrackingHabit = (typeof TRACKING_HABIT_OPTIONS)[number]["value"];

export function UtmForm() {
  const { finish, isLoading } = useOnboardingProgress();
  const slug = useWorkspaceSlug() || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<TrackingHabit | "">("");

  const handleFinish = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await saveOnboardingAnswer(
        "campaignTracking",
        { currentMethod: selected },
        slug,
      );
      await finish();
    } catch (error) {
      console.error("Failed to save answer:", error);
      toast.error("Failed to save your answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <ChoiceButtons
        columns={1}
        value={selected || null}
        onChange={(v) => setSelected(v as TrackingHabit)}
        options={[...TRACKING_HABIT_OPTIONS]}
      />

      <AppButton
        type="button"
        onClick={handleFinish}
        loading={isSubmitting || isLoading}
        disabled={!selected}
        className="w-full"
        variant="primary"
      >
        Let's go →
      </AppButton>
    </div>
  );
}
