"use client";

import { AppButton } from "@/ui/components/controls/app-button";
import { useWorkspaceSlug } from "@/lib/hooks/use-workspace-slug";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { useState } from "react";
import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";
import { MultiChoiceButtons } from "@/ui/onboarding/choice-buttons";
import { toast } from "sonner";

const USE_CASE_OPTIONS = [
  { value: "track-leads", label: "Track where my leads come from" },
  { value: "shorten-brand", label: "Shorten and brand my links" },
  { value: "replace-tool", label: "Replace Bitly / Rebrandly" },
  { value: "deep-links", label: "Deep link to mobile apps" },
  { value: "exploring", label: "Just exploring" },
] as const;

type UseCase = (typeof USE_CASE_OPTIONS)[number]["value"];

export function TrackingFamiliarityForm() {
  const { continueTo, isLoading } = useOnboardingProgress();
  const slug = useWorkspaceSlug() || "";
  const [selected, setSelected] = useState<UseCase[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = (value: string) => {
    const v = value as UseCase;
    setSelected((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;

    setIsSubmitting(true);
    try {
      await saveOnboardingAnswer(
        "trackingFamiliarity",
        { useCases: selected },
        slug,
      );
      continueTo("tracking");
    } catch (error) {
      console.error("Failed to save answer:", error);
      toast.error("Failed to save your answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <MultiChoiceButtons
        columns={1}
        values={selected}
        onToggle={toggle}
        options={[...USE_CASE_OPTIONS]}
      />
      <AppButton
        type="submit"
        loading={isSubmitting || isLoading}
        disabled={selected.length === 0}
        className="w-full"
        variant="primary"
      >
        Continue →
      </AppButton>
    </form>
  );
}
