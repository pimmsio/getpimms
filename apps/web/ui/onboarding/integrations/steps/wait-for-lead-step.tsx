"use client";

import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { cn } from "@dub/utils";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import React, { type ReactNode, useEffect, useRef, useState } from "react";

export function WaitForLeadStep({
  title,
  description,
  linkHref,
  canStart,
  waiting,
  done,
  onStartWaiting,
  waitingLabel = "Waiting for contact…",
  successLabel = "Contact recorded. Tracking works.",
  warnings,
}: {
  title: string;
  description?: string;
  linkHref?: string | null;
  canStart: boolean;
  waiting: boolean;
  done: boolean;
  /** @deprecated Polling now auto-starts when linkId is set. Kept for backward compat. */
  onStartWaiting?: () => void;
  waitingLabel?: string;
  successLabel?: string;
  warnings?: ReactNode[];
}) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const copyLink = async () => {
    if (!linkHref) return;
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copyTimerRef.current = null;
    }, 2000);
    try {
      await navigator.clipboard.writeText(linkHref);
    } catch {
      // ignore
    }
  };

  return (
    <StepCard title={title} description={description}>
      {warnings && warnings.length > 0 ? (
        <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <ul className="list-disc space-y-1 pl-4">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {linkHref ? null : (
          <div className="text-sm text-neutral-600">Create the test link first.</div>
        )}

        {canStart && !done && linkHref ? (
          <>
            {waiting ? (
              <div className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700 sm:w-auto">
                <Loader2 className="size-4 animate-spin" />
                {waitingLabel}
              </div>
            ) : (
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
                onClick={() => {
                  try {
                    window.open(linkHref, "_blank", "noopener,noreferrer");
                  } catch {
                    // ignore
                  }
                  onStartWaiting?.();
                }}
              >
                Open test link
                <ExternalLink className="size-4" />
              </button>
            )}
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:w-auto"
              onClick={() => void copyLink()}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </>
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

