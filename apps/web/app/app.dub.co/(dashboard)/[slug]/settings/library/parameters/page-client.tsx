"use client";

import useUtmSources, { useUtmSourcesCount } from "@/lib/swr/use-utm-sources";
import useUtmMediums, { useUtmMediumsCount } from "@/lib/swr/use-utm-mediums";
import useUtmCampaigns, {
  useUtmCampaignsCount,
} from "@/lib/swr/use-utm-campaigns";
import useUtmTerms, { useUtmTermsCount } from "@/lib/swr/use-utm-terms";
import useUtmContents, { useUtmContentsCount } from "@/lib/swr/use-utm-contents";
import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton } from "@/ui/components/controls/app-button";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";
import { text } from "@/ui/design/tokens";
import { Tooltip, ToggleGroup } from "@dub/ui";
import {
  Flag6,
  GlobePointer,
  InputSearch,
  LoadingSpinner,
  Page2,
  Plus,
  SatelliteDish,
  Trash,
} from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { getUtmParameterPlaceholder, UtmParameterType } from "@/lib/utils/utm-parameter-utils";

type ParameterType = UtmParameterType;

interface Parameter {
  id: string;
  name: string;
}

const PARAMETER_TABS: {
  value: ParameterType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "source", label: "Source", icon: GlobePointer },
  { value: "medium", label: "Medium", icon: SatelliteDish },
  { value: "campaign", label: "Campaign", icon: Flag6 },
  { value: "term", label: "Term", icon: InputSearch },
  { value: "content", label: "Content", icon: Page2 },
];

export default function WorkspaceUtmParametersClient() {
  const { id: workspaceId } = useWorkspace();
  const [activeTab, setActiveTab] = useState<ParameterType>("source");

  const { utmSources, loading: loadingSources, mutate: mutateSources } = useUtmSources({
    query: { sortBy: "name", sortOrder: "asc" },
  });
  const { utmMediums, loading: loadingMediums, mutate: mutateMediums } = useUtmMediums({
    query: { sortBy: "name", sortOrder: "asc" },
  });
  const { utmCampaigns, loading: loadingCampaigns, mutate: mutateCampaigns } = useUtmCampaigns({
    query: { sortBy: "name", sortOrder: "asc" },
  });
  const { utmTerms, loading: loadingTerms, mutate: mutateTerms } = useUtmTerms({
    query: { sortBy: "name", sortOrder: "asc" },
  });
  const { utmContents, loading: loadingContents, mutate: mutateContents } = useUtmContents({
    query: { sortBy: "name", sortOrder: "asc" },
  });

  const { data: sourcesCount, mutate: mutateSourcesCount } = useUtmSourcesCount();
  const { data: mediumsCount, mutate: mutateMediumsCount } = useUtmMediumsCount();
  const { data: campaignsCount, mutate: mutateCampaignsCount } = useUtmCampaignsCount();
  const { data: termsCount, mutate: mutateTermsCount } = useUtmTermsCount();
  const { data: contentsCount, mutate: mutateContentsCount } = useUtmContentsCount();

  const tabData: Record<
    ParameterType,
    {
      parameters: Parameter[];
      count?: number;
      loading: boolean;
      mutateCache: (data?: any, opts?: any) => Promise<any>;
      mutateCount: (data?: any, opts?: any) => Promise<any>;
    }
  > = {
    source: { parameters: utmSources || [], count: sourcesCount, loading: loadingSources, mutateCache: mutateSources, mutateCount: mutateSourcesCount },
    medium: { parameters: utmMediums || [], count: mediumsCount, loading: loadingMediums, mutateCache: mutateMediums, mutateCount: mutateMediumsCount },
    campaign: { parameters: utmCampaigns || [], count: campaignsCount, loading: loadingCampaigns, mutateCache: mutateCampaigns, mutateCount: mutateCampaignsCount },
    term: { parameters: utmTerms || [], count: termsCount, loading: loadingTerms, mutateCache: mutateTerms, mutateCount: mutateTermsCount },
    content: { parameters: utmContents || [], count: contentsCount, loading: loadingContents, mutateCache: mutateContents, mutateCount: mutateContentsCount },
  };

  const activeConfig = PARAMETER_TABS.find((t) => t.value === activeTab)!;
  const activeData = tabData[activeTab];

  const toggleOptions = PARAMETER_TABS.map((tab) => {
    const Icon = tab.icon;
    const count = tabData[tab.value].count;
    return {
      value: tab.value,
      label: (
        <span className="flex items-center gap-1.5">
          <Icon className="size-3.5" />
          <span>{tab.label}</span>
          {count !== undefined && (
            <span className="text-neutral-400">({count})</span>
          )}
        </span>
      ),
    };
  });

  return (
    <div className="grid gap-6">
      <div className="overflow-hidden rounded-lg bg-neutral-50/60">
        <div className="flex flex-col items-start gap-1 px-4 py-3">
          <h2 className={cn(text.pageTitle, "text-lg")}>UTM Parameters</h2>
          <p className={cn(text.pageDescription, "text-sm")}>
            Manage your UTM parameter values to streamline campaign tracking
          </p>
        </div>

        <div className="px-4 pb-2">
          <ToggleGroup
            options={toggleOptions}
            selected={activeTab}
            selectAction={(value) => setActiveTab(value as ParameterType)}
            className="flex-wrap"
          />
        </div>

        <div className="rounded-md bg-white">
          <ParameterColumn
            key={activeTab}
            type={activeTab}
            icon={activeConfig.icon}
            title={activeConfig.label}
            parameters={activeData.parameters}
            count={activeData.count}
            loading={activeData.loading}
            workspaceId={workspaceId}
            mutateCache={activeData.mutateCache}
            mutateCount={activeData.mutateCount}
          />
        </div>
      </div>
    </div>
  );
}

function ParameterColumn({
  type,
  icon: Icon,
  title,
  parameters,
  count,
  loading,
  workspaceId,
  mutateCache,
  mutateCount,
}: {
  type: ParameterType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  parameters: Parameter[];
  count?: number;
  loading: boolean;
  workspaceId: string | undefined;
  mutateCache: (data?: any, opts?: any) => Promise<any>;
  mutateCount: (data?: any, opts?: any) => Promise<any>;
}) {
  const placeholder = getUtmParameterPlaceholder(type);
  if (!workspaceId) return null;
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const apiEndpoint = `utm-${type}s`;

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  /** Split input by comma, semicolon, or newline and deduplicate */
  const parseValues = (raw: string): string[] => {
    return [...new Set(
      raw.split(/[,;\n]+/).map((v) => v.trim()).filter(Boolean),
    )];
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = parseValues(newValue);
    if (values.length === 0) return;

    setIsAdding(true);

    try {
      const res = await fetch(
        `/api/utm-parameters/bulk?workspaceId=${workspaceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, names: values }),
        },
      );

      if (!res.ok) {
        try {
          const { error } = await res.json();
          toast.error(error?.message ?? "Something went wrong");
        } catch {
          toast.error("Something went wrong");
        }
        return;
      }

      const { created, duplicatesInInput, alreadyExist } =
        (await res.json()) as {
          created: number;
          duplicatesInInput: number;
          alreadyExist: number;
        };

      const label = title.toLowerCase();
      const details: string[] = [];
      if (duplicatesInInput > 0)
        details.push(`${duplicatesInInput} duplicate${duplicatesInInput > 1 ? "s" : ""} removed`);
      if (alreadyExist > 0)
        details.push(`${alreadyExist} already existed`);
      const suffix = details.length > 0 ? ` (${details.join(", ")})` : "";

      if (created > 0) {
        toast.success(
          `Added ${created} ${label}${created > 1 ? "s" : ""}${suffix}`,
        );
        setNewValue("");
        requestAnimationFrame(autoResize);
        await Promise.all([
          mutateCache(undefined, { revalidate: true }),
          mutateCount(undefined, { revalidate: true }),
        ]);
      } else {
        toast.info(`No new ${label}s to add${suffix}`);
      }
    } catch {
      toast.error(`Failed to add ${title.toLowerCase()}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const apiUrl = `/api/${apiEndpoint}/${id}?workspaceId=${workspaceId}`;
      const res = await fetch(apiUrl, { method: "DELETE" });

      if (res.ok) {
        toast.success(`Successfully deleted ${title.toLowerCase()}!`);
        await Promise.all([
          mutateCache(undefined, { revalidate: true }),
          mutateCount(undefined, { revalidate: true }),
        ]);
      } else {
        const { error } = await res.json();
        toast.error(error.message);
      }
    } catch {
      toast.error(`Failed to delete ${title.toLowerCase()}`);
    } finally {
      setDeletingId(null);
    }
  };

  const parsedCount = parseValues(newValue).length;

  return (
    <div className="flex flex-col bg-white">
      <div className="p-4">
        <form onSubmit={handleAdd} className="mb-4">
          <div className="flex items-start gap-2">
            <textarea
              ref={textareaRef}
              value={newValue}
              onChange={(e) => {
                setNewValue(e.target.value);
                autoResize();
              }}
              placeholder={
                placeholder
                  ? `${placeholder} (separate multiple with commas or newlines)`
                  : `Add ${title.toLowerCase()}s separated by commas or newlines...`
              }
              rows={2}
              className="app-input min-h-[56px] resize-none !placeholder:text-neutral-400"
              disabled={isAdding}
            />
            <AppButton
              type="submit"
              variant="secondary"
              size="sm"
              className="h-9 shrink-0 px-2"
              disabled={isAdding || !newValue.trim()}
            >
              {isAdding ? (
                <LoadingSpinner className="size-4" />
              ) : (
                <span className="flex items-center gap-1">
                  <Plus className="size-4" />
                  {parsedCount > 1 && (
                    <span className="text-xs">{parsedCount}</span>
                  )}
                </span>
              )}
            </AppButton>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="size-5" />
          </div>
        ) : parameters.length > 0 ? (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {parameters.map((param) => (
              <div
                key={param.id}
                className="group flex items-center justify-between rounded-md border border-neutral-100 px-2.5 py-1.5 hover:border-neutral-200 hover:bg-neutral-50"
              >
                <span className="truncate text-sm text-neutral-700">
                  {param.name}
                </span>
                <Tooltip content="Delete">
                  <AppIconButton
                    onClick={() => handleDelete(param.id)}
                    disabled={deletingId === param.id}
                    className={cn(
                      "h-7 w-7 shrink-0 text-neutral-400 hover:text-red-600 disabled:cursor-not-allowed",
                      deletingId === param.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {deletingId === param.id ? (
                      <LoadingSpinner className="size-4" />
                    ) : (
                      <Trash className="size-4" />
                    )}
                  </AppIconButton>
                </Tooltip>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-neutral-500">
            No {title.toLowerCase()}s yet
          </p>
        )}
      </div>
    </div>
  );
}

