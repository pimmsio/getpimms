"use client";

import { cn, getUrlFromString, getParamsFromURL } from "@dub/utils";
import { useState } from "react";
import { toast } from "sonner";
import { AppTextarea } from "@/ui/components/controls/app-textarea";

export function BulkDestinationUrlInput({
  urls,
  onChange,
  error,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  error?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [urlsText, setUrlsText] = useState(urls.join("\n"));
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleBlur = () => {
    setInlineError(null);
    const lines = urlsText
      .split(/[\n,;]+/) // Split by newline, comma, or semicolon
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      setIsExpanded(false);
      return;
    }

    // Process URLs (add https:// if needed) and validate
    const processedUrls: string[] = [];
    const invalidUrls: string[] = [];

    lines.forEach((url) => {
      const processedUrl = getUrlFromString(url);
      try {
        new URL(processedUrl);
        processedUrls.push(processedUrl);
      } catch {
        invalidUrls.push(url);
      }
    });

    if (invalidUrls.length > 0) {
      setInlineError(`Invalid URL: ${invalidUrls[0]}`);
      return;
    }

    // Check for UTM parameters in any of the URLs
    const urlsWithUtms = processedUrls.filter((url) => {
      const params = getParamsFromURL(url);
      return params && (
        params.utm_source ||
        params.utm_medium ||
        params.utm_campaign ||
        params.utm_term ||
        params.utm_content
      );
    });

    if (urlsWithUtms.length > 0) {
      toast.warning(
        "Some URLs contain UTM parameters. Use the UTM section below to apply UTMs to all links consistently.",
        { duration: 5000 }
      );
    }

    onChange(processedUrls);
    setIsExpanded(false);
  };

  if (isExpanded) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-900">
          Destination URLs
        </label>
        <AppTextarea
          value={urlsText}
          onChange={(e) => {
            setUrlsText(e.target.value);
            if (inlineError) setInlineError(null);
          }}
          onBlur={handleBlur}
          placeholder="Enter URLs, one per line"
          className="h-48 font-mono"
          autoFocus
        />
        {inlineError && <p className="text-sm text-red-500">{inlineError}</p>}
        <p className="text-xs text-neutral-500">
          {urlsText.split(/[\n,;]+/).filter((line) => line.trim()).length} URL(s) • Click outside to save
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-2">
      <label className="block text-sm font-medium text-neutral-900">
        Destination URLs
      </label>
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border bg-white px-4 py-3 text-left outline-none transition min-w-0",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            : "border-neutral-200 hover:border-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/60",
          urls.length === 0 && "text-neutral-400",
        )}
      >
        <div className="min-w-0 flex-1 overflow-hidden">
          {urls.length === 0 ? (
            <span className="truncate block">Click to add destination URLs...</span>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate font-mono text-sm min-w-0">
                {urls[0]}
              </span>
              {urls.length > 1 && (
                <span className="shrink-0 rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                  +{urls.length - 1}
                </span>
              )}
            </div>
          )}
        </div>
        <svg
          className="ml-2 size-5 shrink-0 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

