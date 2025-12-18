"use client";

import { Button } from "@dub/ui";
import { useMediaQuery } from "@dub/ui";
import useWorkspace from "@/lib/swr/use-workspace";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";

export function TrackingFamiliarityForm() {
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
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="e.g., I've used Google Analytics, I'm new to tracking, I've used UTM parameters before..."
        autoFocus={!isMobile}
        className="block w-full rounded-lg border border-blue-200 bg-white px-4 py-4 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        rows={6}
        required
      />
      <Button
        type="submit"
        text="Continue →"
        loading={isSubmitting || isLoading}
        disabled={!answer.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700"
      />
    </form>
  );
}
