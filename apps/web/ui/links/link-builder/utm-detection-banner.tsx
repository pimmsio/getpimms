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

export function UtmDetectionBanner() {
  const { control, setValue } = useFormContext<LinkFormData>();
  const url = useWatch({ control, name: "url" });
  
  // Watch form UTM values to compare with URL UTMs
  const [
    formUtmSource,
    formUtmMedium,
    formUtmCampaign,
    formUtmTerm,
    formUtmContent,
  ] = useWatch({
    control,
    name: ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"],
  });
  
  const utmSectionContext = useUtmSectionContextOptional();
  const { id: workspaceId } = useWorkspace();

  const [dismissedUrls, setDismissedUrls] = useState<Set<string>>(new Set());
  const [detectedUtms, setDetectedUtms] = useState<Record<string, string>>({});
  const [showBanner, setShowBanner] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const previousUrlRef = useRef<string>("");

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

  // Auto-clean URL when UTMs match form values
  const autoCleanUrl = useCallback(() => {
    const cleanUrl = cleanUrlFromUtms(url);
    if (cleanUrl !== url) {
      setValue("url", cleanUrl, { shouldDirty: false }); // Don't mark as dirty for auto-clean
    }
  }, [url, cleanUrlFromUtms, setValue]);

  // Auto-extract UTMs when form is empty
  const autoExtractUtms = useCallback(async (utmParams: Record<string, string>) => {
    try {
      // Clean the URL
      const cleanUrl = cleanUrlFromUtms(url);
      setValue("url", cleanUrl, { shouldDirty: true });

      // Populate form fields with normalized values
      Object.entries(utmParams).forEach(([key, value]) => {
        const normalizedValue = normalizeUtmValue(value);
        setValue(key as keyof LinkFormData, normalizedValue, {
          shouldDirty: true,
        });
      });

      // Expand the UTM section if it's collapsed
      if (utmSectionContext) {
        utmSectionContext.expandUtmSection();
      }

      // Save UTM parameters to the library (silently, no toast)
      if (workspaceId) {
        await saveUtmParameters(utmParams, workspaceId);
      }
    } catch (error) {
      console.error("Failed to auto-extract UTMs:", error);
    }
  }, [url, cleanUrlFromUtms, setValue, utmSectionContext, workspaceId]);

  useEffect(() => {
    if (!url) {
      setDetectedUtms({});
      setShowBanner(false);
      return;
    }

    // Reset dismissed state when URL changes
    if (url !== previousUrlRef.current) {
      previousUrlRef.current = url;
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

    // Get form UTM values
    const formUtms = {
      utm_source: formUtmSource || "",
      utm_medium: formUtmMedium || "",
      utm_campaign: formUtmCampaign || "",
      utm_term: formUtmTerm || "",
      utm_content: formUtmContent || "",
    };

    // Check if form has any UTM values
    const formHasUtms = Object.values(formUtms).some((val) => val);

    // Case 1: Form is empty - auto-extract silently
    if (!formHasUtms) {
      // Use async IIFE to handle async extraction
      (async () => {
        await autoExtractUtms(utmParams);
      })();
      setShowBanner(false);
      return;
    }

    // Case 2: Check if URL UTMs match form UTMs
    const utmsMatch = utmKeys.every((key) => {
      const urlValue = normalizeUtmValue(utmParams[key] || "");
      const formValue = formUtms[key as keyof typeof formUtms];
      return urlValue === formValue;
    });

    if (utmsMatch) {
      // Case 2a: UTMs match - just clean the URL silently
      autoCleanUrl();
      setShowBanner(false);
    } else {
      // Case 3: UTMs differ - show banner to ask user
      setShowBanner(true);
    }
  }, [url, formUtmSource, formUtmMedium, formUtmCampaign, formUtmTerm, formUtmContent, dismissedUrls, autoExtractUtms, autoCleanUrl]);

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

      // Save UTM parameters to the library
      if (workspaceId) {
        const results = await saveUtmParameters(detectedUtms, workspaceId);
        
        // Check if any parameters were saved successfully
        const successCount = Object.values(results).filter(r => r?.success).length;
        const totalCount = Object.keys(detectedUtms).length;
        
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

  const handleKeepInUrl = useCallback(() => {
    // Clear any UTM form fields since user wants to keep them in URL
    setValue("utm_source", "", { shouldDirty: true });
    setValue("utm_medium", "", { shouldDirty: true });
    setValue("utm_campaign", "", { shouldDirty: true });
    setValue("utm_term", "", { shouldDirty: true });
    setValue("utm_content", "", { shouldDirty: true });
    
    // Mark this URL as handled
    setDismissedUrls((prev) => new Set(prev).add(url));
    setShowBanner(false);
    toast.info("UTM parameters kept in URL");
  }, [setValue, url]);

  const handleDismiss = useCallback(() => {
    setDismissedUrls((prev) => new Set(prev).add(url));
    setShowBanner(false);
  }, [url]);

  // Only show banner when explicitly needed (UTMs differ from form)
  if (!showBanner) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-blue-600" />
      <div className="flex-1">
        <p className="text-sm text-blue-900">
          Your URL contains different UTM parameters than the form. Would you like to extract and replace them?
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExtracting && <Loader2 className="size-3 animate-spin" />}
            Extract & Replace
          </button>
          <button
            type="button"
            onClick={handleKeepInUrl}
            disabled={isExtracting}
            className="rounded-md border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-900 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep in URL
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 text-blue-600 hover:text-blue-800"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

