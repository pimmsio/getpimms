"use client";

import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { cn } from "@dub/utils";
import React from "react";

export function ManualConfirmStep({
  title,
  description,
  isDone,
  confirmLabel = "Next",
  showConfirmButton = true,
  confirmDisabled,
  onConfirm,
  actions,
}: {
  title: string;
  description?: string;
  isDone: boolean;
  confirmLabel?: string;
  showConfirmButton?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <StepCard title={title} description={description}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        {showConfirmButton ? (
          isDone ? (
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
          )
        ) : null}
      </div>
    </StepCard>
  );
}

