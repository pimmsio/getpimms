"use client";

import { normalizeUtmValue, getParamsFromURL, getUrlFromString } from "@dub/utils";
import { AlertCircle, X, Loader2 } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { LinkFormData } from "./link-builder-provider";
import { useUtmSectionContextOptional } from "./utm-section-context";
import { saveUtmParameters } from "./save-utm-parameters";
import useWorkspace from "@/lib/swr/use-workspace";
import { checkUtmParameterExists, UtmParameterType } from "@/lib/utils/utm-parameter-utils";

export function UtmDetectionBanner() {
  const { control, setValue } = useFormContext<LinkFormData>();
  const url = useWatch({ control, name: "url" });
  const utmSectionContext = useUtmSectionContextOptional();
  const { id: workspaceId } = useWorkspace();

  const [dismissedUrls, setDismissedUrls] = useState<Set<string>>(new Set());
  const [detectedUtms, setDetectedUtms] = useState<Record<string, string>>({});
  const [showBanner, setShowBanner] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const autoFilledUrlRef = useRef<string>("");
  const checkIdRef = useRef(0);

  // Helper function to clean URL (remove UTM parameters)
  const cleanUrlFromUtms = useCallback((urlToClean: string) => {
    try {
      const normalizedUrl = getUrlFromString(urlToClean);
      const urlObj = new URL(normalizedUrl);
      const params = new URLSearchParams(urlObj.search);

      // Remove UTM parameters from URL
      params.delete("utm_source");
      params.delete("utm_medium");
      params.delete("utm_campaign");
      params.delete("utm_term");
      params.delete("utm_content");

      // Reconstruct URL without UTMs
      urlObj.search = params.toString();
      return urlObj.toString();
    } catch (error) {
      console.error("Failed to clean URL:", error);
      return urlToClean;
    }
  }, []);

  useEffect(() => {
    if (!url) {
      setDetectedUtms({});
      setShowBanner(false);
      return;
    }

    // Check if this URL was dismissed
    if (dismissedUrls.has(url)) {
      setShowBanner(false);
      return;
    }

    // Normalize URL first (adds https:// if needed)
    const normalizedUrl = getUrlFromString(url);
    const params = getParamsFromURL(normalizedUrl);
    const utmParams: Record<string, string> = {};

    // Check for UTM parameters
    const utmKeys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ];

    utmKeys.forEach((key) => {
      if (params?.[key]) {
        utmParams[key] = params[key];
      }
    });

    // No UTMs in URL - nothing to do
    if (Object.keys(utmParams).length === 0) {
      setDetectedUtms({});
      setShowBanner(false);
      return;
    }

    setDetectedUtms(utmParams);

    const checkId = ++checkIdRef.current;

    const evaluateUtmExistence = async () => {
      if (!workspaceId) {
        setShowBanner(true);
        return;
      }

      const existenceChecks = await Promise.all(
        Object.entries(utmParams).map(async ([key, value]) => {
          const type = key.replace("utm_", "") as UtmParameterType;
          const exists = await checkUtmParameterExists(
            type,
            value,
            workspaceId,
            { raw: true },
          );
          return { key, exists };
        }),
      );

      if (checkIdRef.current !== checkId) return;

      const missingKeys = existenceChecks
        .filter((entry) => !entry.exists)
        .map((entry) => entry.key);
      const allExist = missingKeys.length === 0;

      if (allExist) {
        if (autoFilledUrlRef.current !== url) {
          autoFilledUrlRef.current = url;
          const cleanUrl = cleanUrlFromUtms(url);
          setValue("url", cleanUrl, { shouldDirty: true });
          Object.entries(utmParams).forEach(([key, value]) => {
            setValue(key as keyof LinkFormData, value, {
              shouldDirty: false,
            });
          });
          if (utmSectionContext) {
            utmSectionContext.expandUtmSection();
          }
        }
        setShowBanner(false);
        return;
      }

      // At least one UTM missing: keep URL and ask user.
      setShowBanner(true);
    };

    void evaluateUtmExistence();
  }, [
    url,
    dismissedUrls,
    workspaceId,
    cleanUrlFromUtms,
    setValue,
    utmSectionContext,
  ]);

  const handleExtract = useCallback(async () => {
    setIsExtracting(true);
    try {
      // Clean the URL
      const cleanUrl = cleanUrlFromUtms(url);
      setValue("url", cleanUrl, { shouldDirty: true });

      // Populate form fields with normalized values
      Object.entries(detectedUtms).forEach(([key, value]) => {
        const normalizedValue = normalizeUtmValue(value);
        setValue(key as keyof LinkFormData, normalizedValue, {
          shouldDirty: true,
        });
      });

      // Expand the UTM section if it's collapsed
      if (utmSectionContext) {
        utmSectionContext.expandUtmSection();
      }

      // Save UTM parameters to the library (only when user explicitly extracts)
      if (workspaceId) {
        try {
          // Check each parameter for existence
          const existenceChecks = await Promise.all(
            Object.entries(detectedUtms).map(async ([key, value]) => {
              const type = key.replace('utm_', '') as UtmParameterType;
              const normalizedValue = normalizeUtmValue(value);
              const exists = await checkUtmParameterExists(type, normalizedValue, workspaceId);
              return { key, exists };
            })
          );
          
          // Only save parameters that don't exist
          const newParams = Object.fromEntries(
            Object.entries(detectedUtms).filter((_, idx) => !existenceChecks[idx].exists)
          );
          
          if (Object.keys(newParams).length > 0) {
            const results = await saveUtmParameters(newParams, workspaceId);
            
            // Check if any parameters were saved successfully
            const successCount = Object.values(results).filter(r => r?.success).length;
            const totalCount = Object.keys(newParams).length;
            
            if (successCount === totalCount) {
              toast.success(
                "UTM parameters extracted and saved to your library!",
              );
            } else if (successCount > 0) {
              toast.success(
                `UTM parameters extracted. ${successCount}/${totalCount} saved to library.`,
              );
            } else {
              toast.success(
                "UTM parameters extracted and normalized.",
              );
            }
          } else {
            // All parameters already exist
            toast.success(
              "UTM parameters extracted and normalized.",
            );
          }
        } catch (error) {
          console.error("Error checking/saving UTM parameters:", error);
          toast.success(
            "UTM parameters extracted and normalized.",
          );
        }
      } else {
        toast.success(
          "UTM parameters extracted and normalized.",
        );
      }

      // Mark this URL as handled
      setDismissedUrls((prev) => new Set(prev).add(url));
      setShowBanner(false);
    } catch (error) {
      console.error("Failed to extract UTMs:", error);
      toast.error("Failed to extract UTM parameters");
    } finally {
      setIsExtracting(false);
    }
  }, [url, cleanUrlFromUtms, setValue, detectedUtms, utmSectionContext, workspaceId]);

  const handleDiscard = useCallback(() => {
    // User wants to keep UTMs in URL - don't touch anything
    // Just mark this URL as dismissed
    setDismissedUrls((prev) => new Set(prev).add(url));
    setShowBanner(false);
  }, [url]);

  const handleDismiss = useCallback(() => {
    setDismissedUrls((prev) => new Set(prev).add(url));
    setShowBanner(false);
  }, [url]);

  // Only show banner when explicitly needed
  if (!showBanner) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200/60">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-neutral-600" />
      <div className="flex-1">
        <p className="text-sm text-neutral-900">
          Your URL contains UTM parameters. Would you like to extract them to save in your library?
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting}
            className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExtracting && <Loader2 className="size-3 animate-spin" />}
            Save parameters
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isExtracting}
            className="rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-800 outline-none transition hover:border-neutral-300 hover:bg-neutral-50 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Skip
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 text-neutral-500 hover:text-neutral-700"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

