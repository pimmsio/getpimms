"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import useUtmMediums, { useUtmMediumsCount } from "@/lib/swr/use-utm-mediums";
import useUtmSources, { useUtmSourcesCount } from "@/lib/swr/use-utm-sources";
import useUtmCampaigns, { useUtmCampaignsCount } from "@/lib/swr/use-utm-campaigns";
import useUtmTerms, { useUtmTermsCount } from "@/lib/swr/use-utm-terms";
import useUtmContents, { useUtmContentsCount } from "@/lib/swr/use-utm-contents";
import { UTM_PARAMETERS_MAX_PAGE_SIZE } from "@/lib/zod/schemas/utm-parameters";
import { Combobox } from "@dub/ui";
import { cn } from "@dub/utils";
import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useUtmParameterCreate } from "@/lib/hooks/use-utm-parameter-create";
import { UtmParameterType } from "@/lib/utils/utm-parameter-utils";
import { 
  getUtmParameterIcon, 
  getUtmParameterDisplayName,
  getUtmParameterPlural,
  getUtmParameterPlaceholder
} from "@/lib/utils/utm-parameter-utils";
import { TagColorProps } from "@/lib/types";
import { COLORS_LIST } from "@/ui/links/tag-badge";

interface UtmParameterSelectProps {
  parameterType: UtmParameterType;
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  disabledTooltip?: string;
  className?: string;
  iconBadgeColor?: TagColorProps;
}

/**
 * Hook to fetch UTM parameters based on type
 */
function useUtmParameters(
  parameterType: UtmParameterType,
  query: { sortBy: "name" | "createdAt"; sortOrder: "asc" | "desc"; search?: string }
) {
  const sourceData = useUtmSources({ 
    query: parameterType === "source" ? query : undefined,
    enabled: parameterType === "source" 
  });
  const mediumData = useUtmMediums({ 
    query: parameterType === "medium" ? query : undefined,
    enabled: parameterType === "medium" 
  });
  const campaignData = useUtmCampaigns({ 
    query: parameterType === "campaign" ? query : undefined,
    enabled: parameterType === "campaign" 
  });
  const termData = useUtmTerms({ 
    query: parameterType === "term" ? query : undefined,
    enabled: parameterType === "term" 
  });
  const contentData = useUtmContents({ 
    query: parameterType === "content" ? query : undefined,
    enabled: parameterType === "content" 
  });

  switch (parameterType) {
    case "source":
      return {
        data: sourceData.utmSources,
        loading: sourceData.loading,
        error: sourceData.error,
        mutate: sourceData.mutate,
      };
    case "medium":
      return {
        data: mediumData.utmMediums,
        loading: mediumData.loading,
        error: mediumData.error,
        mutate: mediumData.mutate,
      };
    case "campaign":
      return {
        data: campaignData.utmCampaigns,
        loading: campaignData.loading,
        error: campaignData.error,
        mutate: campaignData.mutate,
      };
    case "term":
      return {
        data: termData.utmTerms,
        loading: termData.loading,
        error: termData.error,
        mutate: termData.mutate,
      };
    case "content":
      return {
        data: contentData.utmContents,
        loading: contentData.loading,
        error: contentData.error,
        mutate: contentData.mutate,
      };
  }
}

/**
 * Hook to get the count of UTM parameters based on type
 */
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

export function UtmParameterSelect({
  parameterType,
  value,
  onChange,
  disabled,
  disabledTooltip,
  className,
  iconBadgeColor,
}: UtmParameterSelectProps) {
  const { id: workspaceId } = useWorkspace();

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  const parametersCount = useUtmParametersCount(parameterType);
  const useAsync =
    parametersCount && parametersCount > UTM_PARAMETERS_MAX_PAGE_SIZE;

  const { data: parameters, loading, mutate } = useUtmParameters(
    parameterType,
    {
      sortBy: "name" as const,
      sortOrder: "asc" as const,
      ...(useAsync ? { search: debouncedSearch } : {}),
    },
  );

  const [isOpen, setIsOpen] = useState(false);

  const { createParameter, isCreating } = useUtmParameterCreate({
    parameterType,
    mutate,
    workspaceId: workspaceId || "",
    onSuccess: () => {
      setIsOpen(false);
    },
  });

  const handleCreate = async (name: string) => {
    return await createParameter({
      name,
      previousValue: value || "",
      onChange,
    });
  };

  const options = useMemo(() => {
    const mapped =
      parameters?.map((param) => ({
        value: param.name,
        label: param.name,
      })) ?? [];

    return mapped;
  }, [parameters, parameterType]);

  const selectedOption = value
    ? {
        value: value,
        label: value,
      }
    : null;

  const Icon = getUtmParameterIcon(parameterType);
  const displayName = getUtmParameterDisplayName(parameterType);
  const plural = getUtmParameterPlural(parameterType);
  const colorConfig = iconBadgeColor
    ? COLORS_LIST.find((c) => c.color === iconBadgeColor)
    : null;
  const iconNode = iconBadgeColor ? (
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full",
        colorConfig?.css || "bg-neutral-100 text-neutral-600",
      )}
    >
      <Icon className="size-3.5" />
    </span>
  ) : (
    <Icon className="size-4 text-neutral-500" />
  );
  const placeholder = getUtmParameterPlaceholder(parameterType);

  return (
    <Combobox
      selected={selectedOption}
      setSelected={(option) => {
        onChange(option?.value || "");
      }}
      options={loading ? undefined : options}
      icon={iconNode}
      placeholder={placeholder}
      searchPlaceholder={`Search or add ${displayName.toLowerCase()}...`}
      emptyState={
        <p className="p-2 text-center text-sm text-neutral-500">
          No {plural} found
        </p>
      }
      buttonProps={{
        className: cn(
          "h-auto w-full rounded-md border px-3 py-2 text-sm",
          value ? "!text-neutral-700" : "!text-neutral-400",
          isCreating && "opacity-50 cursor-wait",
          className,
        ),
        disabled: disabled || Boolean(disabledTooltip) || isCreating,
      }}
      onCreate={handleCreate}
      open={isOpen}
      onOpenChange={setIsOpen}
      onSearchChange={setSearch}
      shouldFilter={!useAsync}
      caret={false}
      matchTriggerWidth
    >
      {value && <span className="block truncate">{value}</span>}
    </Combobox>
  );
}

