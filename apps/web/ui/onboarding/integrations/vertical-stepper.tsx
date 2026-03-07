"use client";

import { cn } from "@dub/utils";
import { Check, Info } from "lucide-react";
import React from "react";

export type StepStatus = "complete" | "current" | "upcoming";

export type VerticalStep = {
  id: string;
  title: string;
  status: StepStatus;
  indicator?: "info";
};

export function VerticalStepper({
  steps,
  onSelectStep,
  canSelectStep,
}: {
  steps: VerticalStep[];
  onSelectStep?: (index: number) => void;
  canSelectStep?: (index: number, step: VerticalStep) => boolean;
}) {
  return (
    <ol className="space-y-1">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isComplete = step.status === "complete";
        const isCurrent = step.status === "current";
        const selectable = Boolean(
          onSelectStep && (canSelectStep ? canSelectStep(idx, step) : true),
        );

        return (
          <li key={step.id} className="relative flex gap-3">
            <div className="flex flex-col items-center py-2">
              <button
                type="button"
                disabled={!selectable}
                onClick={() => onSelectStep?.(idx)}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-sm",
                  isComplete && "border-brand-primary bg-brand-primary text-white",
                  isCurrent && "border-neutral-900 bg-white text-neutral-900",
                  step.status === "upcoming" &&
                    "border-neutral-200 bg-white text-neutral-400",
                  selectable
                    ? "cursor-pointer hover:opacity-90"
                    : "cursor-default",
                )}
              >
                {step.indicator === "info" ? (
                  <Info className="size-4" />
                ) : isComplete ? (
                  <Check className="size-4" />
                ) : (
                  idx + 1
                )}
              </button>
              {!isLast ? (
                <div
                  className={cn(
                    "mt-1 w-px flex-1 bg-neutral-200",
                    isComplete && "bg-brand-primary/30",
                  )}
                />
              ) : null}
            </div>

            <button
              type="button"
              disabled={!selectable}
              onClick={() => onSelectStep?.(idx)}
              className={cn(
                "min-w-0 py-2 text-left",
                selectable ? "cursor-pointer" : "cursor-default",
              )}
            >
              <div
                className={cn(
                  "text-sm font-semibold leading-7",
                  isComplete && "text-neutral-900",
                  isCurrent && "text-neutral-900",
                  step.status === "upcoming" && "text-neutral-500",
                )}
              >
                {step.title}
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
