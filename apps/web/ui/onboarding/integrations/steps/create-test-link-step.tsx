"use client";

import { OnboardingTestLink } from "@/ui/onboarding/integrations/onboarding-test-link";
import { StepCard } from "@/ui/onboarding/integrations/components/step-card";
import { cn } from "@dub/utils";
import { ExternalLink, Loader2 } from "lucide-react";
import React from "react";

export function CreateTestLinkStep({
  title,
  description,
  info,
  urlValue,
  urlPlaceholder,
  onChangeUrl,
  creating,
  error,
  created,
  onCreate,
  onOpenCreated,
}: {
  title: string;
  description?: string;
  info?: string;
  urlValue: string;
  urlPlaceholder?: string;
  onChangeUrl: (next: string) => void;
  creating: boolean;
  error: string | null;
  created: OnboardingTestLink | null;
  onCreate: () => Promise<void> | void;
  onOpenCreated?: () => void;
}) {
  return (
    <StepCard title={title} description={description}>
      {!created ? (
        <input
          value={urlValue}
          onChange={(e) => onChangeUrl(e.target.value)}
          placeholder={urlPlaceholder ?? "https://example.com/booking"}
          className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400"
          disabled={creating}
        />
      ) : (
        <input
          value={created.shortLink ?? ""}
          readOnly
          className="h-10 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900"
        />
      )}

      {error ? (
        <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {info ? (
        <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900">
          {info}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!created ? (
          <button
            type="button"
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto",
              (creating || !urlValue.trim()) &&
                "cursor-not-allowed opacity-60 hover:bg-neutral-900",
            )}
            disabled={creating || !urlValue.trim()}
            onClick={() => void onCreate()}
          >
            {creating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create & continue"
            )}
          </button>
        ) : created.shortLink ? (
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
            onClick={() => {
              try {
                window.open(created.shortLink, "_blank", "noopener,noreferrer");
              } catch {
                // ignore
              }
              onOpenCreated?.();
            }}
          >
            Open test link
            <ExternalLink className="size-4" />
          </button>
        ) : null}
      </div>
    </StepCard>
  );
}

