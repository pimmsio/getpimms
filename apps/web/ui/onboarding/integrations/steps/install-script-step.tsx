"use client";

import { CopyField } from "@/ui/onboarding/integrations/components/copy-field";
import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { cn } from "@dub/utils";
import React from "react";

export function InstallScriptStep({
  title,
  description,
  info,
  scripts,
  script,
  scriptLabel = "Script",
  isDone,
  onConfirm,
  confirmLabel = "Next",
  confirmDisabled,
  guideStepHref,
  guideStepLabel = "Open step in guide",
}: {
  title: string;
  description?: string;
  info?: React.ReactNode;
  /**
   * Preferred: provide one or more scripts (e.g. detection + inject-form).
   * If omitted, falls back to `script` + `scriptLabel`.
   */
  scripts?: Array<{ label: string; value: string }>;
  script?: string;
  scriptLabel?: string;
  isDone: boolean;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  guideStepHref?: string;
  guideStepLabel?: string;
}) {
  const resolvedScripts =
    scripts && scripts.length > 0
      ? scripts
      : [
          {
            label: scriptLabel,
            value: script ?? "",
          },
        ].filter((s) => Boolean(s.value));

  return (
    <StepCard title={title} description={description}>
      <div className="space-y-3">
        {guideStepHref ? (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            onClick={() => {
              window.open(guideStepHref, "_blank", "noopener,noreferrer");
            }}
          >
            {guideStepLabel}
          </button>
        ) : null}

        {resolvedScripts.map((s) => (
          <CopyField key={s.label} label={s.label} value={s.value} copyValue={s.value} />
        ))}
      </div>

      {info ? (
        <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900">
          {info}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        {isDone ? (
          <div className="sm:ml-auto inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
            Completed
          </div>
        ) : (
          <button
            type="button"
            className={cn(
              "inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:ml-auto sm:w-auto",
              confirmDisabled &&
                "cursor-not-allowed opacity-60 hover:bg-neutral-900",
            )}
            onClick={onConfirm}
            disabled={Boolean(confirmDisabled)}
          >
            {confirmLabel}
          </button>
        )}
      </div>
    </StepCard>
  );
}

