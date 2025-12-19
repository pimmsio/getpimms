import { setOnboardingProgress } from "@/lib/actions/set-onboarding-progress";
import { OnboardingStep } from "@/lib/onboarding/types";
import useWorkspace from "@/lib/swr/use-workspace";
import { useAction } from "next-safe-action/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

const PRE_WORKSPACE_STEPS: OnboardingStep[] = [];
// UI can navigate to any onboarding step string (we validate server-side).
type UIOnboardingStep = OnboardingStep | (string & {});

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
    async (step: string, { slug: providedSlug }: { slug?: string } = {}) => {
      const workspaceSlug = providedSlug || slug;
      if (!workspaceSlug) {
        console.error("No workspace slug available for navigation - this should not happen");
        toast.error("Unable to navigate: workspace not found. Please refresh the page.");
        return;
      }

      const targetUrl = `/${workspaceSlug}/today?onboarding=${step}`;
      console.log("[Onboarding] Navigating to:", targetUrl);

      try {
        // Wait for the onboarding step to be saved to Redis before navigating
        // This ensures the middleware can read the updated step on Vercel
        await executeAsync({
          // NOTE: keep UI steps flexible; backend validates via z.enum(ONBOARDING_STEPS)
          onboardingStep: step as any,
        });
        console.log("[Onboarding] Step saved successfully");
      } catch (error) {
        console.error("[Onboarding] Failed to save step:", error);
        toast.error("Failed to save progress. Navigating anyway...");
        // Continue with navigation even if save fails (user can reload to fix)
      }

      // Use window.location.replace for a full page reload to ensure middleware runs with fresh Redis data
      // This is especially important on Vercel where edge caching might cause stale reads
      // Using replace instead of href prevents back button issues
      console.log("[Onboarding] Executing navigation...");
      try {
        window.location.replace(targetUrl);
      } catch (navError) {
        console.error("[Onboarding] Navigation failed, trying href:", navError);
        // Fallback to href if replace fails for any reason
        window.location.href = targetUrl;
      }
    },
    [executeAsync, slug],
  );

  const finish = useCallback(async () => {
    if (!slug) {
      console.error("[Onboarding] No workspace slug for finish - this should not happen");
      toast.error("Unable to complete onboarding: workspace not found. Please refresh the page.");
      return;
    }

    const targetUrl = `/${slug}/today?onboarded=true`;
    console.log("[Onboarding] Finishing onboarding, navigating to:", targetUrl);

    try {
      // Wait for the onboarding step to be saved to Redis before navigating
      await executeAsync({
        onboardingStep: "completed",
      });
      console.log("[Onboarding] Onboarding marked as completed");
    } catch (error) {
      console.error("[Onboarding] Failed to mark onboarding as completed:", error);
      toast.error("Failed to save completion. Navigating anyway...");
      // Continue with navigation even if save fails
    }

    // Use window.location.replace for a full page reload to ensure middleware runs with fresh Redis data
    console.log("[Onboarding] Executing navigation...");
    try {
      window.location.replace(targetUrl);
    } catch (navError) {
      console.error("[Onboarding] Navigation failed, trying href:", navError);
      // Fallback to href if replace fails for any reason
      window.location.href = targetUrl;
    }
  }, [executeAsync, slug]);

  return {
    continueTo,
    finish,
    isLoading: isPending,
    isSuccessful: hasSucceeded,
  };
}
