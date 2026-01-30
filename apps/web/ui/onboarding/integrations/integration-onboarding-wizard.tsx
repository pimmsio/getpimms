"use client";

import { cn } from "@dub/utils";
import React, { useMemo } from "react";
import { VerticalStepper, VerticalStep } from "./vertical-stepper";

export type WizardStep = {
  id?: string;
  title: string;
  content: React.ReactNode;
  isComplete: boolean;
  isOptional?: boolean;
};

export function IntegrationOnboardingWizard({
  title,
  subtitle,
  headerActions,
  contentTop,
  steps,
  currentStepIndex,
  maxSelectableStepIndex,
  onSelectStep,
}: {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  contentTop?: React.ReactNode;
  steps: WizardStep[];
  currentStepIndex: number;
  maxSelectableStepIndex?: number;
  onSelectStep?: (index: number) => void;
}) {
  const stepperSteps = useMemo<VerticalStep[]>(() => {
    return steps.map((s, idx) => {
      const status: VerticalStep["status"] =
        s.isComplete ? "complete" : idx === currentStepIndex ? "current" : "upcoming";
      return {
        // IMPORTANT: keep IDs stable across renders (don't generate random IDs here),
        // otherwise React keys will change and the stepper can "jump" unexpectedly.
        id: s.id ?? `step-${idx}`,
        title: s.title,
        status,
        ...(s.isOptional ? { indicator: "info" as const } : null),
      };
    });
  }, [currentStepIndex, steps]);

  const current = steps[currentStepIndex] ?? null;

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-neutral-900">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm text-neutral-600">{subtitle}</div>
          ) : null}
        </div>

        {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        <div className="p-0">
          <VerticalStepper
            steps={stepperSteps}
            onSelectStep={onSelectStep}
            canSelectStep={(idx) =>
              Boolean(steps[idx]?.isOptional) ||
              idx <= (maxSelectableStepIndex ?? currentStepIndex)
            }
          />
        </div>

        <div className={cn("min-w-0")}>
          {current ? current.content : null}
          {contentTop ? <div className="mt-4">{contentTop}</div> : null}
        </div>
      </div>
    </div>
  );
}

