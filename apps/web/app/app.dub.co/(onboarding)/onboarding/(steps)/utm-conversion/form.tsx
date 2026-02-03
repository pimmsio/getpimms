"use client";

import { AppButton } from "@/ui/components/controls/app-button";
import { AppInput } from "@/ui/components/controls/app-input";
import { AppTextarea } from "@/ui/components/controls/app-textarea";
import useWorkspace from "@/lib/swr/use-workspace";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";

type UtmConversionData = {
  utm: {
    planToUse: boolean;
    alreadyHasPlan: boolean;
    wantsBulkUtm: boolean;
    wantsTemplates: boolean;
    wantsEnforceParams: boolean;
  };
  conversion: {
    contentToTrack: string[];
    websitePlatform: string;
    otherContent: string;
  };
};

export function Form() {
  const { continueTo, isLoading } = useOnboardingProgress();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug } = useWorkspace();
  const slug = workspaceSlug || searchParams.get("workspace") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [utmData, setUtmData] = useState({
    planToUse: false,
    alreadyHasPlan: false,
    wantsBulkUtm: false,
    wantsTemplates: false,
    wantsEnforceParams: false,
  });

  const [conversionData, setConversionData] = useState({
    contentToTrack: [] as string[],
    websitePlatform: "",
    otherContent: "",
  });

  const handleUtmChange = (key: keyof typeof utmData) => {
    setUtmData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConversionTrackChange = (value: string) => {
    setConversionData((prev) => {
      const newContent = prev.contentToTrack.includes(value)
        ? prev.contentToTrack.filter((c) => c !== value)
        : [...prev.contentToTrack, value];
      return { ...prev, contentToTrack: newContent };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await saveOnboardingAnswer(
        "utmConversion",
        {
          utm: utmData,
          conversion: conversionData,
        },
        slug,
      );
      continueTo("complete");
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
      {/* UTM Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900">UTM Tracking</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={utmData.planToUse}
              onChange={() => handleUtmChange("planToUse")}
              className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-2 focus:ring-neutral-300"
            />
            <span className="text-sm text-neutral-700">
              I plan to use UTM parameters
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={utmData.alreadyHasPlan}
              onChange={() => handleUtmChange("alreadyHasPlan")}
              className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-2 focus:ring-neutral-300"
            />
            <span className="text-sm text-neutral-700">
              I already have a UTM plan
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={utmData.wantsBulkUtm}
              onChange={() => handleUtmChange("wantsBulkUtm")}
              className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-2 focus:ring-neutral-300"
            />
            <span className="text-sm text-neutral-700">
              I want to trigger bulk UTM plan
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={utmData.wantsTemplates}
              onChange={() => handleUtmChange("wantsTemplates")}
              className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-2 focus:ring-neutral-300"
            />
            <span className="text-sm text-neutral-700">
              I want to use UTM templates
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={utmData.wantsEnforceParams}
              onChange={() => handleUtmChange("wantsEnforceParams")}
              className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-2 focus:ring-neutral-300"
            />
            <span className="text-sm text-neutral-700">
              I want to use UTM enforce params
            </span>
          </label>
        </div>
      </div>

      {/* Conversion Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900">
          Conversion Tracking
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              What content do you want to track?
            </label>
            <div className="space-y-2">
              {["Contacts", "Sales", "Bookings", "Sign-ups", "Downloads"].map(
                (option) => (
                  <label key={option} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={conversionData.contentToTrack.includes(option)}
                      onChange={() => handleConversionTrackChange(option)}
                      className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-2 focus:ring-neutral-300"
                    />
                    <span className="text-sm text-neutral-700">{option}</span>
                  </label>
                ),
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Website platform
            </label>
            <AppInput
              type="text"
              value={conversionData.websitePlatform}
              onChange={(e) =>
                setConversionData((prev) => ({
                  ...prev,
                  websitePlatform: e.target.value,
                }))
              }
              placeholder="e.g., WordPress, Shopify, Webflow..."
              className="max-w-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Other content (calendars, forms, etc.)
            </label>
            <AppTextarea
              value={conversionData.otherContent}
              onChange={(e) =>
                setConversionData((prev) => ({
                  ...prev,
                  otherContent: e.target.value,
                }))
              }
              placeholder="e.g., Calendly, Typeform, Google Forms..."
              className="min-h-[96px]"
              rows={3}
            />
          </div>
        </div>
      </div>

      <AppButton type="submit" variant="primary" loading={isSubmitting || isLoading} className="w-full">
        Continue →
      </AppButton>
    </form>
  );
}
