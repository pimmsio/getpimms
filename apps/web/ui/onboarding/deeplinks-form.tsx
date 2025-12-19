"use client";

import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton } from "@/ui/components/controls/app-button";
import { ChoiceButtons } from "@/ui/onboarding/choice-buttons";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type DeepLinksAnswer = {
  wantsDeepLinks: "yes" | "no" | "";
};

export function DeepLinksForm() {
  const { continueTo, isLoading } = useOnboardingProgress();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug } = useWorkspace();
  const slug = workspaceSlug || searchParams.get("workspace") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answer, setAnswer] = useState<DeepLinksAnswer>({
    wantsDeepLinks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.wantsDeepLinks) return;

    setIsSubmitting(true);
    try {
      await saveOnboardingAnswer("deepLinks", answer, slug);
      continueTo("tracking" as any);
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <div className="text-sm font-semibold text-neutral-900">
        Are you going to use mobile deep links?
      </div>

      <ChoiceButtons
        columns={2}
        value={answer.wantsDeepLinks || null}
        onChange={(v) =>
          setAnswer((prev) => ({
            ...prev,
            wantsDeepLinks: v as DeepLinksAnswer["wantsDeepLinks"],
          }))
        }
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "Not now" },
        ]}
      />

      <AppButton
        type="submit"
        variant="primary"
        loading={isSubmitting || isLoading}
        disabled={!answer.wantsDeepLinks}
        className="w-full"
      >
        Continue →
      </AppButton>
    </form>
  );
}
