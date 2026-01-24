"use client";

import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { UtmTemplateSelect } from "@/ui/links/link-builder/utm-template-select";
import { UtmParameterSelect } from "@/ui/links/link-builder/utm-parameter-select";
import { COLORS_LIST } from "@/ui/links/tag-badge";
import { TagColorProps, UtmTemplateWithUserProps } from "@/lib/types";
import useWorkspace from "@/lib/swr/use-workspace";
import useUtmSources, {
  useUtmSourcesCount,
} from "@/lib/swr/use-utm-sources";
import useUtmMediums, {
  useUtmMediumsCount,
} from "@/lib/swr/use-utm-mediums";
import useUtmCampaigns, {
  useUtmCampaignsCount,
} from "@/lib/swr/use-utm-campaigns";
import useUtmTerms, { useUtmTermsCount } from "@/lib/swr/use-utm-terms";
import useUtmContents, {
  useUtmContentsCount,
} from "@/lib/swr/use-utm-contents";
import { UtmParameterType } from "@/lib/utils/utm-parameter-utils";
import { cn, fetcher, normalizeUtmValue } from "@dub/utils";
import { HelpTooltip } from "@dub/ui";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import useSWR from "swr";

export type BulkUtmTemplateSelection = {
  instanceId: string;
  templateId: string;
  name: string;
  color: TagColorProps;
  utm_campaign: string;
  utm_medium: string;
  utm_source: string;
  utm_content: string;
  utm_term: string;
};

type BulkUtmChip = {
  instanceId: string;
  color: string;
  value: string;
};

type SelectedTemplateInstance = {
  instanceId: string;
  templateId: string;
  color: TagColorProps;
};



function useUtmParameters(
  parameterType: UtmParameterType,
  query: { sortBy: "name" | "createdAt"; sortOrder: "asc" | "desc"; search?: string },
) {
  const sourceData = useUtmSources({
    query: parameterType === "source" ? query : undefined,
    enabled: parameterType === "source",
  });
  const mediumData = useUtmMediums({
    query: parameterType === "medium" ? query : undefined,
    enabled: parameterType === "medium",
  });
  const campaignData = useUtmCampaigns({
    query: parameterType === "campaign" ? query : undefined,
    enabled: parameterType === "campaign",
  });
  const termData = useUtmTerms({
    query: parameterType === "term" ? query : undefined,
    enabled: parameterType === "term",
  });
  const contentData = useUtmContents({
    query: parameterType === "content" ? query : undefined,
    enabled: parameterType === "content",
  });

  switch (parameterType) {
    case "source":
      return {
        data: sourceData.utmSources,
        loading: sourceData.loading,
        mutate: sourceData.mutate,
      };
    case "medium":
      return {
        data: mediumData.utmMediums,
        loading: mediumData.loading,
        mutate: mediumData.mutate,
      };
    case "campaign":
      return {
        data: campaignData.utmCampaigns,
        loading: campaignData.loading,
        mutate: campaignData.mutate,
      };
    case "term":
      return {
        data: termData.utmTerms,
        loading: termData.loading,
        mutate: termData.mutate,
      };
    case "content":
      return {
        data: contentData.utmContents,
        loading: contentData.loading,
        mutate: contentData.mutate,
      };
  }
}

function useUtmParametersCount(parameterType: UtmParameterType) {
  const sourceCount = useUtmSourcesCount();
  const mediumCount = useUtmMediumsCount();
  const campaignCount = useUtmCampaignsCount();
  const termCount = useUtmTermsCount();
  const contentCount = useUtmContentsCount();

  switch (parameterType) {
    case "source":
      return sourceCount.data;
    case "medium":
      return mediumCount.data;
    case "campaign":
      return campaignCount.data;
    case "term":
      return termCount.data;
    case "content":
      return contentCount.data;
  }
}

export function BulkUTMParametersSection({
  onTemplatesChange,
  onActiveTemplateChange,
}: {
  onTemplatesChange?: (templates: BulkUtmTemplateSelection[]) => void;
  onActiveTemplateChange?: (instanceId: string | null) => void;
}) {
  const { id: workspaceId } = useWorkspace();
  const { setValue } = useFormContext<LinkFormData>();

  // Selected template instances for bulk (allow duplicates)
  const [selectedTemplateInstances, setSelectedTemplateInstances] = useState<
    SelectedTemplateInstance[]
  >([]);

  // Fetch templates
  const { data: templates } = useSWR<UtmTemplateWithUserProps[]>(
    workspaceId ? `/api/utm?workspaceId=${workspaceId}` : null,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  const templatesById = useMemo(() => {
    return new Map((templates || []).map((template) => [template.id, template]));
  }, [templates]);

  // Manual UTM values
  const [defaultUtms, setDefaultUtms] = useState({
    utm_campaign: "",
    utm_medium: "",
    utm_source: "",
    utm_content: "",
    utm_term: "",
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const [templateOverrides, setTemplateOverrides] = useState<
    Record<
      string,
      Partial<{
        utm_campaign: string;
        utm_medium: string;
        utm_source: string;
        utm_content: string;
        utm_term: string;
      }>
    >
  >({});

  const createInstanceId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  };

  const getNextColor = (instances: SelectedTemplateInstance[]) => {
    const preferredOrder: TagColorProps[] = ["blue", "green", "yellow"];
    const colorPool = [
      ...preferredOrder,
      ...COLORS_LIST.map((c) => c.color).filter(
        (color) => !preferredOrder.includes(color),
      ),
    ];
    const used = new Set(instances.map((instance) => instance.color));
    const available = colorPool.find((color) => !used.has(color));
    return available || colorPool[instances.length % colorPool.length] || "blue";
  };

  const handleAddTemplate = (templateId: string | null) => {
    if (!templateId) return;
    const instanceId = createInstanceId();
    const color = getNextColor(selectedTemplateInstances);
    const instance: SelectedTemplateInstance = {
      instanceId,
      templateId,
      color,
    };
    setSelectedTemplateInstances([...selectedTemplateInstances, instance]);
    setActiveTemplateId(instanceId);
    const template = templatesById.get(templateId);
    if (template) {
      setTemplateOverrides((prev) => {
        const next = { ...prev };
        next[instanceId] = {
          ...next[instanceId],
          ...(template.utm_campaign
            ? {}
            : { utm_campaign: defaultUtms.utm_campaign }),
          ...(template.utm_medium
            ? {}
            : { utm_medium: defaultUtms.utm_medium }),
          ...(template.utm_source
            ? {}
            : { utm_source: defaultUtms.utm_source }),
          ...(template.utm_content
            ? {}
            : { utm_content: defaultUtms.utm_content }),
          ...(template.utm_term
            ? {}
            : { utm_term: defaultUtms.utm_term }),
        };
        return next;
      });
    }
  };

  const handleRemoveTemplate = (instanceId: string) => {
    const updated = selectedTemplateInstances.filter(
      (instance) => instance.instanceId !== instanceId,
    );
    setSelectedTemplateInstances(updated);
    setTemplateOverrides((prev) => {
      const next = { ...prev };
      delete next[instanceId];
      return next;
    });
    if (activeTemplateId === instanceId) {
      setActiveTemplateId(updated[0]?.instanceId || null);
    }
  };

  useEffect(() => {
    if (selectedTemplateInstances.length === 0 && activeTemplateId) {
      setActiveTemplateId(null);
    } else if (selectedTemplateInstances.length > 0 && !activeTemplateId) {
      setActiveTemplateId(selectedTemplateInstances[0].instanceId);
    }
  }, [selectedTemplateInstances, activeTemplateId]);

  useEffect(() => {
    if (!onActiveTemplateChange) return;
    onActiveTemplateChange(activeTemplateId);
  }, [activeTemplateId, onActiveTemplateChange, selectedTemplateInstances.length]);

  const resolvedTemplates = useMemo<BulkUtmTemplateSelection[]>(() => {
    return selectedTemplateInstances
      .map((instance) => {
        const template = templatesById.get(instance.templateId);
        if (!template) return null;
        const overrides = templateOverrides[instance.instanceId] || {};
        return {
          instanceId: instance.instanceId,
          templateId: instance.templateId,
          name: template.name,
          color: instance.color,
          utm_campaign:
            overrides.utm_campaign !== undefined
              ? overrides.utm_campaign
              : (template.utm_campaign || defaultUtms.utm_campaign || ""),
          utm_medium:
            overrides.utm_medium !== undefined
              ? overrides.utm_medium
              : (template.utm_medium || defaultUtms.utm_medium || ""),
          utm_source:
            overrides.utm_source !== undefined
              ? overrides.utm_source
              : (template.utm_source || defaultUtms.utm_source || ""),
          utm_content:
            overrides.utm_content !== undefined
              ? overrides.utm_content
              : (template.utm_content || defaultUtms.utm_content || ""),
          utm_term:
            overrides.utm_term !== undefined
              ? overrides.utm_term
              : (template.utm_term || defaultUtms.utm_term || ""),
        };
      })
      .filter(Boolean) as BulkUtmTemplateSelection[];
  }, [selectedTemplateInstances, templatesById, templateOverrides, defaultUtms]);

  // Notify parent of template changes and their resolved UTMs
  const lastTemplatesSignatureRef = useRef<string>("");
  useEffect(() => {
    if (!onTemplatesChange) return;
    const signature = JSON.stringify(
      resolvedTemplates.map((t) => ({
        instanceId: t.instanceId,
        templateId: t.templateId,
        color: t.color,
        utm_campaign: t.utm_campaign,
        utm_medium: t.utm_medium,
        utm_source: t.utm_source,
        utm_content: t.utm_content,
        utm_term: t.utm_term,
      })),
    );
    if (signature === lastTemplatesSignatureRef.current) return;
    lastTemplatesSignatureRef.current = signature;
    onTemplatesChange(resolvedTemplates);
  }, [onTemplatesChange, resolvedTemplates]);

  const handleFieldSelect = (key: keyof typeof defaultUtms, value: string) => {
    const normalized = value ? normalizeUtmValue(value) : "";
    setDefaultUtms((prev) => ({ ...prev, [key]: normalized }));
    if (selectedTemplateInstances.length === 0) {
      setValue(key as any, normalized, { shouldDirty: true });
      return;
    }
    setTemplateOverrides((prev) => {
      const next = { ...prev };
      // Only update the active template when user edits a value
      // This ensures edits only affect the current template, not all templates
      if (activeTemplateId) {
        const activeInstance = selectedTemplateInstances.find(
          (instance) => instance.instanceId === activeTemplateId
        );
        if (activeInstance) {
          next[activeTemplateId] = {
            ...next[activeTemplateId],
            [key]: normalized,
          };
        }
      } else {
        // If no active template, update all templates that don't have a value (fill missing)
        selectedTemplateInstances.forEach((instance) => {
          const template = templatesById.get(instance.templateId);
          const templateValue = (template as any)?.[key] || "";
          const existingOverride = next[instance.instanceId]?.[key];
          const currentValue = existingOverride ?? templateValue;
          
          if (!currentValue || !currentValue.trim()) {
            // Fill missing values for templates without this UTM parameter
            next[instance.instanceId] = {
              ...next[instance.instanceId],
              [key]: normalized,
            };
          }
        });
      }
      return next;
    });
  };

  const renderUtmField = ({
    label,
    field,
    parameterType,
  }: {
    label: string;
    field: keyof typeof defaultUtms;
    parameterType: UtmParameterType;
  }) => {
    const activeTemplate = activeTemplateId
      ? resolvedTemplates.find((template) => template.instanceId === activeTemplateId)
      : null;
    const fieldValue = activeTemplate
      ? activeTemplate[field]
      : defaultUtms[field];
    
    // Get the ORIGINAL template value (before overrides) to compare with current field value
    const activeInstance = activeTemplateId
      ? selectedTemplateInstances.find((instance) => instance.instanceId === activeTemplateId)
      : null;
    const originalTemplate = activeInstance
      ? templatesById.get(activeInstance.templateId)
      : null;
    const originalTemplateValue = originalTemplate?.[field] || "";
    
    // Determine icon color: only show color if:
    // 1. There's an active template
    // 2. The ORIGINAL template has a non-empty value for this field
    // 3. The current field value matches the ORIGINAL template's value (not overridden by user)
    const isTemplateValueEmpty = !originalTemplateValue || originalTemplateValue.trim() === "";
    const isValueMatchingOriginalTemplate = fieldValue === originalTemplateValue;
    const shouldShowIconColor = activeTemplate && !isTemplateValueEmpty && isValueMatchingOriginalTemplate;
    const iconBadgeColor = shouldShowIconColor ? activeTemplate.color : undefined;

    return (
      <div className="w-full max-w-full min-w-0 space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">{label}</label>
        <div className="w-full max-w-full min-w-0 rounded-md">
          <UtmParameterSelect
            parameterType={parameterType}
            value={fieldValue}
            onChange={(val) => handleFieldSelect(field, val)}
            iconBadgeColor={iconBadgeColor}
            className={cn(
              "border-neutral-200 focus-within:border-neutral-400 w-full max-w-full",
            )}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-full rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200/60">
      <div className="w-full max-w-full space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-neutral-900">
            UTM Parameters
          </div>
          <HelpTooltip
            content={
              <div className="max-w-xs px-4 py-2 text-center text-sm text-neutral-700">
                Pick templates. We create one link per URL × template.
              </div>
            }
          />
        </div>

        {/* Template selector */}
        <div className="w-full max-w-full min-w-0">
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Templates
        </label>
        <div className="w-full max-w-full min-w-0">
          <UtmTemplateSelect
            value={null}
            onChange={handleAddTemplate}
          />
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          Each template adds another link per destination URL.
        </p>
      </div>

        {/* Selected templates */}
        {selectedTemplateInstances.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Selected Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedTemplateInstances.map((instance) => {
                const template = templatesById.get(instance.templateId);
                const colorConfig = COLORS_LIST.find(
                  (c) => c.color === instance.color,
                );
                return (
                  <div
                    key={instance.instanceId}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveTemplateId(instance.instanceId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveTemplateId(instance.instanceId);
                      }
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
                      colorConfig?.css || "bg-neutral-100 text-neutral-600",
                      activeTemplateId === instance.instanceId &&
                        "ring-2 ring-neutral-400",
                    )}
                  >
                    {template?.name || "Template"}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveTemplate(instance.instanceId);
                      }}
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
        {selectedTemplateInstances.length > 0 && (
          <div className="border-t border-neutral-200" />
        )}

        {/* Manual UTM inputs */}
        <div className="space-y-3">
          {renderUtmField({
            label: "Campaign",
            field: "utm_campaign",
            parameterType: "campaign",
          })}
          {renderUtmField({
            label: "Medium",
            field: "utm_medium",
            parameterType: "medium",
          })}
          {renderUtmField({
            label: "Source",
            field: "utm_source",
            parameterType: "source",
          })}
          {renderUtmField({
            label: "Content",
            field: "utm_content",
            parameterType: "content",
          })}
          {renderUtmField({
            label: "Term",
            field: "utm_term",
            parameterType: "term",
          })}
        </div>
      </div>
    </div>
  );
}

