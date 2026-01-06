"use client";

import { useWebhookErrors } from "@/lib/swr/use-webhook-errors";
import useWorkspace from "@/lib/swr/use-workspace";
import { OnboardingSupportSection } from "@/ui/onboarding";
import { UrlDecompositionTooltip } from "@/ui/shared/url-decomposition-tooltip";
import { Button, Tooltip } from "@dub/ui";
import { timeAgo } from "@dub/utils";
import { Info, Settings, X } from "lucide-react";
import Link from "next/link";

interface WebhookErrorsModalProps {
  onClose: () => void;
}

export function WebhookErrorsModal({ onClose }: WebhookErrorsModalProps) {
  const { errors, loading } = useWebhookErrors();
  const { slug, conversionEnabled } = useWorkspace();

  const parseFailedReason = (failedReason: string | null) => {
    if (!failedReason) {
      return null;
    }

    if (failedReason.includes("pimms_id")) {
      return (
        <Tooltip
          content={
            <div className="max-w-xs p-2">
              <div className="mb-2 text-sm font-medium text-gray-900">
                Lead missed - Possible reasons:
              </div>
              <div className="space-y-1 text-xs text-gray-700">
                <div>• Person accessed form without Pimms link</div>
                <div>
                  • Person used Pimms link but conversion tracking disabled
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Check your settings and ensure you always share Pimms links.
              </div>
            </div>
          }
        >
          <div className="truncate text-gray-900">
            Lead missed - Missing pimms_id
          </div>
        </Tooltip>
      );
    }
    return failedReason;
  };

  if (!loading && errors.length === 0) {
    return null;
  }

  return (
    <div className="max-h-[calc(100vh-5rem)] overflow-y-auto p-6">
      <div className="flex flex-col items-start gap-2 sm:py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2 px-1">
          <h3 className="text-md truncate font-medium">
            Missed leads - Actions to improve tracking
          </h3>
        </div>
        <div className="flex items-center gap-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="group hidden rounded-full p-2 text-neutral-500 transition-all duration-75 hover:bg-neutral-100 focus:outline-none active:bg-neutral-200 md:block"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {!conversionEnabled && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Settings className="mt-0.5 h-5 w-5 text-blue-600" />
              <div className="flex flex-1 flex-col space-y-1">
                <p className="mb-2 text-sm font-medium text-blue-900">
                  Enable conversion tracking by default
                </p>
                <Link href={`/${slug}/settings/analytics`}>
                  <Button
                    variant="secondary"
                    text="Change your settings"
                    className="h-8 w-fit p-5 font-medium"
                    type="button"
                  />
                </Link>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <Info className="mt-0.5 h-5 w-5 text-gray-600" />
            <div className="text-sm text-gray-700">
              <strong>Tip:</strong> Always share Pimms links for example on
              emails and social posts to ensure your conversions are tracked and
              you don't miss potential leads.
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <img
              src="https://placehold.co/40x40/10b981/ffffff?text=AS"
              alt="Alexandre Sarfati"
              className="mt-0.5 h-10 w-10 rounded-full"
            />
            <OnboardingSupportSection />
          </div>
        </div>

        <h2 className="text-md mt-2 font-medium">Recent missed leads</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="grid grid-cols-3 gap-4 text-xs font-medium tracking-wide text-gray-600 uppercase">
              <div>Lead details</div>
              <div>Destination URL</div>
              <div>Date</div>
            </div>
          </div>
          <div className="max-h-96 divide-y divide-gray-200 overflow-y-auto">
            {errors.map((error) => (
              <div
                key={error.id}
                className="px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {error.failedReason ? (
                    <div className="max-w-[300px] truncate text-gray-900">
                      {parseFailedReason(error.failedReason)}
                    </div>
                  ) : (
                    <span className="text-gray-400">Unknown</span>
                  )}
                  <div className="truncate">
                    {error.url ? (
                      <UrlDecompositionTooltip url={error.url}>
                        {error.url}
                      </UrlDecompositionTooltip>
                    ) : (
                      <span className="text-gray-400">Unknown</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {timeAgo(new Date(error.createdAt))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
