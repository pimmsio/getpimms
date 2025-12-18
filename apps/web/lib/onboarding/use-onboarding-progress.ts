import { setOnboardingProgress } from "@/lib/actions/set-onboarding-progress";
import { OnboardingStep } from "@/lib/onboarding/types";
import useWorkspace from "@/lib/swr/use-workspace";
import { useAction } from "next-safe-action/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

const PRE_WORKSPACE_STEPS: OnboardingStep[] = [];

export function useOnboardingProgress() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug } = useWorkspace();
  const slug = workspaceSlug || searchParams.get("workspace");

  const { execute, executeAsync, isPending, hasSucceeded } = useAction(
    setOnboardingProgress,
    {
      onSuccess: () => {
        console.log("Onboarding progress updated");
      },
      onError: ({ error }) => {
        toast.error("Failed to update onboarding progress. Please try again.");
        console.error("Failed to update onboarding progress", error);
      },
    },
  );

  const continueTo = useCallback(
    async (
      step: OnboardingStep,
      { slug: providedSlug }: { slug?: string } = {},
    ) => {
      execute({
        onboardingStep: step,
      });

      const workspaceSlug = providedSlug || slug;
      if (workspaceSlug) {
        // Navigate to /today with onboarding step in query
        router.push(`/${workspaceSlug}/today?onboarding=${step}`);
      }
    },
    [execute, router, slug],
  );

  const finish = useCallback(async () => {
    await executeAsync({
      onboardingStep: "completed",
    });

    // Redirect to today page after onboarding completion
    if (slug) {
      router.push(`/${slug}/today?onboarded=true`);
    } else {
      router.push("/");
    }
  }, [executeAsync, router, slug]);

  return {
    continueTo,
    finish,
    isLoading: isPending,
    isSuccessful: hasSucceeded,
  };
}
