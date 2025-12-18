"use client";

import { AppButton } from "@/ui/components/controls/app-button";
import { AppTextarea } from "@/ui/components/controls/app-textarea";
import { useMediaQuery } from "@dub/ui";
import useWorkspace from "@/lib/swr/use-workspace";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";

export function Form() {
  const { continueTo, isLoading } = useOnboardingProgress();
  const { isMobile } = useMediaQuery();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug } = useWorkspace();
  const slug = workspaceSlug || searchParams.get("workspace") || "";
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setIsSubmitting(true);
    try {
      await saveOnboardingAnswer("trackingFamiliarity", answer, slug);
      continueTo("utm-conversion");
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <AppTextarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="e.g., I've used Google Analytics, I'm new to tracking, I've used UTM parameters before..."
        autoFocus={!isMobile}
        className="min-h-[140px]"
        rows={6}
        required
      />
      <AppButton
        type="submit"
        loading={isSubmitting || isLoading}
        disabled={!answer.trim()}
        className="w-full"
        variant="primary"
      >
        Continue →
      </AppButton>
    </form>
  );
}
