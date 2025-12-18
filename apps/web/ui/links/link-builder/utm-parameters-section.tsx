import useWorkspace from "@/lib/swr/use-workspace";
import { UtmTemplateWithUserProps } from "@/lib/types";
import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { UtmParameterSelect } from "@/ui/links/link-builder/utm-parameter-select";
import { UtmTemplateSelect } from "@/ui/links/link-builder/utm-template-select";
import { COLORS_LIST } from "@/ui/links/tag-badge";
import { cn, fetcher, normalizeUtmValue, getUrlFromString } from "@dub/utils";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import useSWR from "swr";
import { UtmSectionProvider } from "./utm-section-context";
import { Badge } from "@dub/ui";

export function UTMParametersSection() {
  const { id: workspaceId } = useWorkspace();
  const { control, setValue } = useFormContext<LinkFormData>();
  const [url, utm_campaign, utm_medium, utm_source, utm_content, utm_term] =
    useWatch({
      control,
      name: [
        "url",
        "utm_campaign",
        "utm_medium",
        "utm_source",
        "utm_content",
        "utm_term",
      ],
    });

  // Get visibility state from localStorage
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("utm-params-visible");
      return stored !== null ? stored === "true" : true; // Default to visible
    }
    return true;
  });

  // Store visibility state in localStorage
  const toggleVisibility = () => {
    const newValue = !isVisible;
    setIsVisible(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem("utm-params-visible", String(newValue));
    }
  };

  // Memoized context value for expanding the section
  const contextValue = useMemo(
    () => ({
      expandUtmSection: () => {
        setIsVisible(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("utm-params-visible", "true");
        }
      },
    }),
    [],
  );

  // Selected template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  // Fetch templates
  const { data: templates } = useSWR<UtmTemplateWithUserProps[]>(
    workspaceId ? `/api/utm?workspaceId=${workspaceId}` : null,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  // Get selected template data
  const selectedTemplate = selectedTemplateId
    ? templates?.find((t) => t.id === selectedTemplateId)
    : null;

  // Get template color
  const templateColor = selectedTemplate?.color || "blue";
  const colorConfig = COLORS_LIST.find((c) => c.color === templateColor);

  // Apply template values when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      if (selectedTemplate.utm_campaign) {
        setValue("utm_campaign", selectedTemplate.utm_campaign, {
          shouldDirty: true,
        });
      }
      if (selectedTemplate.utm_medium) {
        setValue("utm_medium", selectedTemplate.utm_medium, {
          shouldDirty: true,
        });
      }
      if (selectedTemplate.utm_source) {
        setValue("utm_source", selectedTemplate.utm_source, {
          shouldDirty: true,
        });
      }
      if (selectedTemplate.utm_content) {
        setValue("utm_content", selectedTemplate.utm_content, {
          shouldDirty: true,
        });
      }
      if (selectedTemplate.utm_term) {
        setValue("utm_term", selectedTemplate.utm_term, { shouldDirty: true });
      }
    }
  }, [selectedTemplate, setValue]);

  const handleChange = (key: string, value: string) => {
    const normalized = value ? normalizeUtmValue(value) : "";
    setValue(key as any, normalized, { shouldDirty: true });
  };

  // Check if any UTM parameters are set
  const hasUtmParams = Boolean(
    utm_campaign || utm_medium || utm_source || utm_content || utm_term,
  );

  // Clear all UTM parameters
  const clearUtmParams = () => {
    setValue("utm_campaign", "", { shouldDirty: true });
    setValue("utm_medium", "", { shouldDirty: true });
    setValue("utm_source", "", { shouldDirty: true });
    setValue("utm_content", "", { shouldDirty: true });
    setValue("utm_term", "", { shouldDirty: true });
    setSelectedTemplateId(null);
  };

  // Build preview URL with UTMs
  const previewUrl = (() => {
    if (!url || !hasUtmParams) return null;

    try {
      // Normalize URL first (adds https:// if needed)
      const normalizedUrl = getUrlFromString(url);
      const urlObj = new URL(normalizedUrl);
      const params = new URLSearchParams(urlObj.search);

      if (utm_source) params.set("utm_source", utm_source);
      if (utm_medium) params.set("utm_medium", utm_medium);
      if (utm_campaign) params.set("utm_campaign", utm_campaign);
      if (utm_term) params.set("utm_term", utm_term);
      if (utm_content) params.set("utm_content", utm_content);

      urlObj.search = params.toString();
      return urlObj.toString();
    } catch {
      return null;
    }
  })();

  // Copy state for preview URL
  const [copied, setCopied] = useState(false);

  const copyPreviewUrl = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <UtmSectionProvider value={contextValue}>
      <div className="space-y-3">
        {/* Toggle header */}
        <button
        type="button"
        onClick={toggleVisibility}
        className={cn(
          "group w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-all hover:border-neutral-300",
          isVisible && "border-neutral-300",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="text-sm font-medium text-neutral-700">
                <Badge variant={hasUtmParams ? "green" : "neutral"} className="text-sm font-medium text-neutral-700">?utm_</Badge> parameters
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasUtmParams && (
              <span
                className={cn(
                  "inline-flex items-center rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-xs font-medium text-neutral-600",
                  (selectedTemplate || hasUtmParams) &&
                    "border-green-200 bg-green-50 text-green-900",
                )}
              >
                {selectedTemplate ? "Template" : "Active"}
              </span>
            )}
            <ChevronDown
              className={cn(
                "size-4 text-neutral-400 transition-transform duration-200",
                isVisible && "rotate-180",
              )}
            />
          </div>
        </div>
      </button>

      {/* Preview URL - Always visible when UTMs exist */}
      {previewUrl && (
        <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs font-medium text-neutral-600 shrink-0">
                Preview:
              </span>
              <code className="text-xs text-neutral-700 truncate flex-1">
                {previewUrl}
              </code>
            </div>
            <button
              type="button"
              onClick={copyPreviewUrl}
              className="shrink-0 rounded p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
              title="Copy preview URL"
            >
              {copied ? (
                <Check className="size-3.5 text-green-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Collapsible content */}
      {isVisible && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="space-y-4">
            {/* Template selector */}
            <div>
              <div className="flex items-center justify-between">
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Template
                </label>
                {hasUtmParams && (
                  <button
                    type="button"
                    className="text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                    onClick={clearUtmParams}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <UtmTemplateSelect
                value={selectedTemplateId}
                onChange={setSelectedTemplateId}
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                Select a template to apply UTM parameters
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200" />

            {/* UTM inputs */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">
                  Campaign
                </label>
                <div
                  className={cn(
                    "rounded-md",
                    selectedTemplate && colorConfig?.css,
                  )}
                >
                  <UtmParameterSelect
                    parameterType="campaign"
                    value={utm_campaign || ""}
                    onChange={(val) => handleChange("utm_campaign", val)}
                    className={cn(
                      "border-neutral-200 focus-within:border-neutral-400",
                      selectedTemplate && "border",
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">
                  Medium
                </label>
                <div
                  className={cn(
                    "rounded-md",
                    selectedTemplate && colorConfig?.css,
                  )}
                >
                  <UtmParameterSelect
                    parameterType="medium"
                    value={utm_medium || ""}
                    onChange={(val) => handleChange("utm_medium", val)}
                    className={cn(
                      "border-neutral-200 focus-within:border-neutral-400",
                      selectedTemplate && "border",
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">
                  Source
                </label>
                <div
                  className={cn(
                    "rounded-md",
                    selectedTemplate && colorConfig?.css,
                  )}
                >
                  <UtmParameterSelect
                    parameterType="source"
                    value={utm_source || ""}
                    onChange={(val) => handleChange("utm_source", val)}
                    className={cn(
                      "border-neutral-200 focus-within:border-neutral-400",
                      selectedTemplate && "border",
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">
                  Content
                </label>
                <div
                  className={cn(
                    "rounded-md",
                    selectedTemplate && colorConfig?.css,
                  )}
                >
                  <UtmParameterSelect
                    parameterType="content"
                    value={utm_content || ""}
                    onChange={(val) => handleChange("utm_content", val)}
                    className={cn(
                      "border-neutral-200 focus-within:border-neutral-400",
                      selectedTemplate && "border",
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">
                  Term
                </label>
                <div
                  className={cn(
                    "rounded-md",
                    selectedTemplate && colorConfig?.css,
                  )}
                >
                  <UtmParameterSelect
                    parameterType="term"
                    value={utm_term || ""}
                    onChange={(val) => handleChange("utm_term", val)}
                    className={cn(
                      "border-neutral-200 focus-within:border-neutral-400",
                      selectedTemplate && "border",
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </UtmSectionProvider>
  );
}
