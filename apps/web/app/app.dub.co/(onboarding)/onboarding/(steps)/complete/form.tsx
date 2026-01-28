"use client";

import { AppButton } from "@/ui/components/controls/app-button";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { useState } from "react";

// Placeholder YouTube video ID - replace with actual tutorial video
const YOUTUBE_VIDEO_ID = "__TEbK4zonc"; // Replace with actual video ID

export function Form() {
  const { finish, isLoading } = useOnboardingProgress();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await finish();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="text-center">
        <p className="text-base text-neutral-600">
          Watch this 1-minute video to learn how to get started 👇
        </p>
      </div>

      {/* YouTube Embed */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute left-0 top-0 h-full w-full rounded-lg"
          src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
          title="Pimms Getting Started"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="text-center">
        <p className="text-sm text-neutral-500">
          Pro tip: Start with a small test campaign to get familiar with the
          platform.
        </p>
      </div>

      <AppButton
        type="button"
        onClick={handleFinish}
        loading={isSubmitting || isLoading}
        className="w-full"
        variant="primary"
      >
        Finish
      </AppButton>
    </div>
  );
}
