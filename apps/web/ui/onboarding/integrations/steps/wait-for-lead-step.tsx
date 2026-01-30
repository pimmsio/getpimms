"use client";

import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { cn } from "@dub/utils";
import { ExternalLink, Loader2 } from "lucide-react";
import React from "react";

export function WaitForLeadStep({
  title,
  description,
  linkHref,
  canStart,
  waiting,
  done,
  onStartWaiting,
  waitingLabel = "Waiting for lead…",
  successLabel = "Lead recorded. Tracking works.",
}: {
  title: string;
  description?: string;
  linkHref?: string | null;
  canStart: boolean;
  waiting: boolean;
  done: boolean;
  onStartWaiting: () => void;
  waitingLabel?: string;
  successLabel?: string;
}) {
  return (
    <StepCard title={title} description={description}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {linkHref ? null : (
          <div className="text-sm text-neutral-600">Create the test link first.</div>
        )}

        {canStart && !done && linkHref ? (
          <button
            type="button"
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:ml-auto sm:w-auto",
              waiting && "cursor-not-allowed opacity-70 hover:bg-neutral-900",
            )}
            onClick={() => {
              try {
                window.open(linkHref, "_blank", "noopener,noreferrer");
              } catch {
                // ignore
              }
              onStartWaiting();
            }}
            disabled={waiting}
          >
            {waiting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {waitingLabel}
              </>
            ) : (
              <>
                Open test link & start waiting
                <ExternalLink className="size-4" />
              </>
            )}
          </button>
        ) : null}

        {done ? (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 sm:ml-auto">
            {successLabel}
          </div>
        ) : null}
      </div>
    </StepCard>
  );
}

