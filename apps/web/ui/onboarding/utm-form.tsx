"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useWorkspace from "@/lib/swr/use-workspace";
import { saveOnboardingAnswer } from "@/lib/onboarding/save-answer";
import { useOnboardingProgress } from "@/lib/onboarding/use-onboarding-progress";
import { AppButton } from "@/ui/components/controls/app-button";
import { ChoiceButtons, MultiChoiceButtons } from "@/ui/onboarding/choice-buttons";

type UtmClicksAnswer = {
  utmComfort: "never" | "sometimes" | "always" | "";
  linksPerMonth: "<25" | "25-100" | "100-500" | "500+" | "not-sure" | "";
  orgNeeds: Array<
    "templates" | "bulk" | "enforce"
  >;
};

export function UtmForm() {
  const { continueTo, isLoading } = useOnboardingProgress();
  const searchParams = useSearchParams();
  const { slug: workspaceSlug } = useWorkspace();
  const slug = workspaceSlug || searchParams.get("workspace") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answer, setAnswer] = useState<UtmClicksAnswer>({
    utmComfort: "",
    linksPerMonth: "",
    orgNeeds: [],
  });

  const canContinue = Boolean(answer.utmComfort && answer.linksPerMonth);

  const toggleNeed = (need: UtmClicksAnswer["orgNeeds"][number]) => {
    setAnswer((prev) => ({
      ...prev,
      orgNeeds: prev.orgNeeds.includes(need)
        ? prev.orgNeeds.filter((n) => n !== need)
        : [...prev.orgNeeds, need],
    }));
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    setIsSubmitting(true);
    try {
      await saveOnboardingAnswer("utmClicks", answer, slug);
      continueTo("complete");
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-3">
        <div className="text-sm font-semibold text-neutral-900">
          Do you already use UTMs?
        </div>
        <ChoiceButtons
          columns={3}
          value={answer.utmComfort || null}
          onChange={(v) =>
            setAnswer((p) => ({
              ...p,
              utmComfort: v as UtmClicksAnswer["utmComfort"],
            }))
          }
          options={[
            { value: "never", label: "Never" },
            { value: "sometimes", label: "Sometimes" },
            { value: "always", label: "Yes, everywhere" },
          ]}
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-neutral-900">
          How many links will you create per month?
        </div>
        <ChoiceButtons
          columns={3}
          value={answer.linksPerMonth || null}
          onChange={(v) =>
            setAnswer((p) => ({
              ...p,
              linksPerMonth: v as UtmClicksAnswer["linksPerMonth"],
            }))
          }
          options={[
            { value: "<25", label: "< 25" },
            { value: "25-100", label: "25–100" },
            { value: "100-500", label: "100–500" },
            { value: "500+", label: "500+" },
            { value: "not-sure", label: "Not sure yet" },
          ]}
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-neutral-900">
          What do you need for UTMs?
        </div>
        <MultiChoiceButtons
          columns={2}
          values={answer.orgNeeds}
          onToggle={(v) => toggleNeed(v)}
          options={[
            { value: "templates", label: "UTM templates" },
            { value: "bulk", label: "Bulk create / edit" },
            { value: "enforce", label: "Enforce UTM params" },
          ]}
        />
      </div>

      <AppButton
        type="button"
        onClick={handleContinue}
        loading={isSubmitting || isLoading}
        disabled={!canContinue}
        className="w-full"
        variant="primary"
      >
        Continue →
      </AppButton>
    </div>
  );
}


