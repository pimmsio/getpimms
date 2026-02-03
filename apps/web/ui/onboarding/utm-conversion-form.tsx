"use client";

import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton } from "@/ui/components/controls/app-button";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type UtmConversionData = {
  trackingGoal: "clicks" | "conversions" | "sales" | "not-sure" | "";
  conversionTypes: string[];
  linkVolume: "<25" | "25-100" | "100-500" | "500+" | "not-sure" | "";
};

export function UtmConversionForm() {
  const { continueTo, isLoading } = useOnboardingProgress();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug } = useWorkspace();
  const slug = workspaceSlug || searchParams.get("workspace") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState<UtmConversionData>({
    trackingGoal: "",
    conversionTypes: [],
    linkVolume: "",
  });

  const toggleArrayValue = <T extends string>(
    key: keyof UtmConversionData,
    value: T,
  ) => {
    setData((prev) => {
      const current = prev[key];
      if (!Array.isArray(current)) return prev;
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next } as UtmConversionData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.trackingGoal || !data.linkVolume) return;

    setIsSubmitting(true);
    try {
      await saveOnboardingAnswer("utmConversion", data, slug);
      continueTo("complete");
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900">
          What do you want to track?
        </h3>
        <div className="space-y-2">
          {[
            { value: "clicks", label: "Clicks (keep it simple)" },
            {
              value: "conversions",
              label: "Clicks + conversions (leads, sign-ups, bookings…)",
            },
            { value: "sales", label: "Clicks + conversions + sales" },
            { value: "not-sure", label: "Not sure yet" },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3">
              <input
                type="radio"
                name="trackingGoal"
                value={value}
                checked={data.trackingGoal === value}
                onChange={() =>
                  setData((prev) => ({
                    ...prev,
                    trackingGoal: value as UtmConversionData["trackingGoal"],
                  }))
                }
                className="text-brand-primary h-4 w-4 border-neutral-300 focus:ring-2 focus:ring-neutral-300"
              />
              <span className="text-sm text-neutral-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {data.trackingGoal && data.trackingGoal !== "clicks" ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-neutral-900">
            If you track conversions, which ones matter?
          </h3>
          <div className="space-y-2">
            {["Contacts", "Sign-ups", "Bookings", "Sales"].map((option) => (
              <label key={option} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.conversionTypes.includes(option)}
                  onChange={() => toggleArrayValue("conversionTypes", option)}
                  className="text-brand-primary h-4 w-4 rounded border-neutral-300 focus:ring-2 focus:ring-neutral-300"
                />
                <span className="text-sm text-neutral-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900">
          How many links (roughly)?
        </h3>
        <div className="space-y-2">
          {[
            { value: "<25", label: "Under 25" },
            { value: "25-100", label: "25–100" },
            { value: "100-500", label: "100–500" },
            { value: "500+", label: "500+" },
            { value: "not-sure", label: "Not sure yet" },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3">
              <input
                type="radio"
                name="linkVolume"
                value={value}
                checked={data.linkVolume === value}
                onChange={() =>
                  setData((prev) => ({
                    ...prev,
                    linkVolume: value as UtmConversionData["linkVolume"],
                  }))
                }
                className="text-brand-primary h-4 w-4 border-neutral-300 focus:ring-2 focus:ring-neutral-300"
              />
              <span className="text-sm text-neutral-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <AppButton
        type="submit"
        variant="primary"
        loading={isSubmitting || isLoading}
        className="w-full"
        disabled={!data.trackingGoal || !data.linkVolume}
      >
        Continue →
      </AppButton>
    </form>
  );
}
