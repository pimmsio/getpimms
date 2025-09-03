"use client";

import { OnboardingStep } from "@/lib/onboarding/types";
import { ExpandingArrow, LoadingSpinner } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { PropsWithChildren } from "react";
import { useOnboardingProgress } from "./use-onboarding-progress";

export function LaterButton({
  next,
  className,
  children,
}: PropsWithChildren<{ next: OnboardingStep | "finish"; className?: string }>) {
  const { continueTo, finish, isLoading, isSuccessful } =
    useOnboardingProgress();

  return (
    <button
      type="button"
      onClick={() => (next === "finish" ? finish() : continueTo(next))}
      className={cn(
        "mx-auto flex w-fit items-center gap-2 text-center text-sm font-bold transition-colors enabled:hover:text-neutral-700",
        className,
      )}
      disabled={isLoading || isSuccessful}
    >
      <LoadingSpinner
        className={cn(
          "size-3 transition-opacity",
          !(isLoading || isSuccessful) && "opacity-0",
        )}
      />
      {children || "Skip this step, I'll do this later"}
      <ExpandingArrow className="size-3" />{" "}
    </button>
  );
}
