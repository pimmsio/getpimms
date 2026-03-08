"use client";

import { useState } from "react";
import { useWorkspaceSlug } from "@/lib/hooks/use-workspace-slug";
import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { AppButton } from "@/ui/components/controls/app-button";
import { MultiChoiceButtons } from "@/ui/onboarding/choice-buttons";
import { toast } from "sonner";

const TRACKING_OPTIONS = [
  { value: "forms", label: "Lead forms (contact info)" },
  { value: "bookings", label: "Bookings (Calendly, Cal.com...)" },
  { value: "payments", label: "Payments (Stripe, checkout...)" },
  { value: "signups", label: "Sign-ups (free trial, accounts)" },
  { value: "downloads", label: "Downloads / digital products" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

type TrackingGoal = (typeof TRACKING_OPTIONS)[number]["value"];

export function TrackingForm() {
  const { continueTo, isLoading } = useOnboardingProgress();
  const slug = useWorkspaceSlug() || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<TrackingGoal[]>([]);

  const toggle = (value: string) => {
    const v = value as TrackingGoal;
    setSelected((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    try {
      await saveOnboardingAnswer(
        "trackingSetup",
        { firstGoals: selected },
        slug,
      );
      continueTo("tech-stack");
    } catch (error) {
      console.error("Failed to save answer:", error);
      toast.error("Failed to save your answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <MultiChoiceButtons
        columns={2}
        values={selected}
        onToggle={toggle}
        options={[...TRACKING_OPTIONS]}
      />

      <AppButton
        type="button"
        onClick={handleContinue}
        loading={isSubmitting || isLoading}
        disabled={selected.length === 0}
        className="w-full"
        variant="primary"
      >
        Continue →
      </AppButton>
    </div>
  );
}
