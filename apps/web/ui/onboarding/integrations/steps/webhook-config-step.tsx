"use client";

import { CopyField } from "@/ui/onboarding/integrations/components/copy-field";
import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { cn } from "@dub/utils";
import React from "react";

export function WebhookConfigStep({
  title,
  description,
  fields,
  isDone,
  onConfirm,
  confirmLabel = "Next",
  confirmDisabled,
}: {
  title: string;
  description?: string;
  fields: Array<{ label: string; value: string; disabled?: boolean }>;
  isDone: boolean;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
}) {
  return (
    <StepCard title={title} description={description}>
      <div className="space-y-3">
        {fields.map((f) => (
          <CopyField
            key={f.label}
            label={f.label}
            value={f.value}
            disabled={f.disabled}
          />
        ))}
      </div>

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
              confirmDisabled && "cursor-not-allowed opacity-60 hover:bg-neutral-900",
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

