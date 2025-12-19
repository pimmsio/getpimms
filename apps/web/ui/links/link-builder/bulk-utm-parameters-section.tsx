"use client";

import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { UtmTemplateSelect } from "@/ui/links/link-builder/utm-template-select";
import { UtmParameterSelect } from "@/ui/links/link-builder/utm-parameter-select";
import { COLORS_LIST } from "@/ui/links/tag-badge";
import { UtmTemplateWithUserProps } from "@/lib/types";
import useWorkspace from "@/lib/swr/use-workspace";
import { cn, fetcher, normalizeUtmValue } from "@dub/utils";
import { InfoTooltip } from "@dub/ui";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import useSWR from "swr";

export function BulkUTMParametersSection({
  onTemplatesChange,
}: {
  onTemplatesChange?: (templateIds: string[], colors: string[]) => void;
}) {
  const { id: workspaceId } = useWorkspace();
  const { setValue } = useFormContext<LinkFormData>();

  // Selected templates for bulk (array of template IDs)
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  // Fetch templates
  const { data: templates } = useSWR<UtmTemplateWithUserProps[]>(
    workspaceId ? `/api/utm?workspaceId=${workspaceId}` : null,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  const selectedTemplates = templates?.filter((t) =>
    selectedTemplateIds.includes(t.id),
  );

  // Notify parent of template changes and their colors
  useEffect(() => {
    // Only notify parent when there are actual selections or when selection changes
    if (onTemplatesChange) {
      const colors = selectedTemplates?.map(
        (t) => (t as any).color || "blue",
      ) || [];
      onTemplatesChange(selectedTemplateIds, colors);
    }
  }, [selectedTemplateIds]); // Only depend on selectedTemplateIds, not the callback or computed array

  const handleAddTemplate = (templateId: string | null) => {
    if (!templateId || selectedTemplateIds.includes(templateId)) return;
    setSelectedTemplateIds([...selectedTemplateIds, templateId]);
  };

  const handleRemoveTemplate = (templateId: string) => {
    setSelectedTemplateIds(selectedTemplateIds.filter((id) => id !== templateId));
  };

  // Manual UTM values
  const [manualUtms, setManualUtms] = useState({
    utm_campaign: "",
    utm_medium: "",
    utm_source: "",
    utm_content: "",
    utm_term: "",
  });

  const handleManualChange = (key: string, value: string) => {
    const normalized = value ? normalizeUtmValue(value) : "";
    setManualUtms({ ...manualUtms, [key]: normalized });
    setValue(key as any, normalized, { shouldDirty: true });
  };

  return (
    <div className="rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200/60">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-neutral-900">
            UTM Parameters
          </div>
          <InfoTooltip
            content={
              <div className="max-w-xs px-4 py-2 text-center text-sm text-neutral-700">
                Select multiple UTM templates (each shown in a different color). Each template will be applied to all destination URLs, creating multiple link variations.
              </div>
            }
          />
        </div>

        {/* Template selector */}
        <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Templates
        </label>
        <UtmTemplateSelect
          value={null}
          onChange={handleAddTemplate}
        />
        <p className="mt-1.5 text-xs text-neutral-500">
          Each selected template will create a separate link for each destination URL provided above.
        </p>
      </div>

        {/* Selected templates */}
        {selectedTemplates && selectedTemplates.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Selected Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedTemplates.map((template) => {
                const colorConfig = COLORS_LIST.find(
                  (c) => c.color === (template as any).color,
                );
                return (
                  <div
                    key={template.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
                      colorConfig?.css || "bg-neutral-100 text-neutral-600",
                    )}
                  >
                    {template.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTemplate(template.id)}
                      className="hover:opacity-70"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        {selectedTemplates && selectedTemplates.length > 0 && (
          <div className="border-t border-neutral-200" />
        )}

        {/* Manual UTM inputs */}
        <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">
            Campaign
          </label>
          <UtmParameterSelect
            parameterType="campaign"
            value={manualUtms.utm_campaign}
            onChange={(val) => handleManualChange("utm_campaign", val)}
            className="border-neutral-200 focus-within:border-neutral-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">
            Medium
          </label>
          <UtmParameterSelect
            parameterType="medium"
            value={manualUtms.utm_medium}
            onChange={(val) => handleManualChange("utm_medium", val)}
            className="border-neutral-200 focus-within:border-neutral-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">
            Source
          </label>
          <UtmParameterSelect
            parameterType="source"
            value={manualUtms.utm_source}
            onChange={(val) => handleManualChange("utm_source", val)}
            className="border-neutral-200 focus-within:border-neutral-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">
            Content
          </label>
          <UtmParameterSelect
            parameterType="content"
            value={manualUtms.utm_content}
            onChange={(val) => handleManualChange("utm_content", val)}
            className="border-neutral-200 focus-within:border-neutral-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">
            Term
          </label>
          <UtmParameterSelect
            parameterType="term"
            value={manualUtms.utm_term}
            onChange={(val) => handleManualChange("utm_term", val)}
            className="border-neutral-200 focus-within:border-neutral-400"
          />
        </div>
        </div>
      </div>
    </div>
  );
}

