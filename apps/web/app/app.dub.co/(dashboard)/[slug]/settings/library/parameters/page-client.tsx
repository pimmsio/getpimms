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
import { AnimatedSizeContainer, Tooltip } from "@dub/ui";
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
import { cn, normalizeUtmValue } from "@dub/utils";
import { useState } from "react";
import { toast } from "sonner";
import { getUtmParameterPlaceholder, UtmParameterType } from "@/lib/utils/utm-parameter-utils";

type ParameterType = UtmParameterType;

interface Parameter {
  id: string;
  name: string;
}

export default function WorkspaceUtmParametersClient() {
  const { id: workspaceId } = useWorkspace();

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

  const { data: sourcesCount } = useUtmSourcesCount();
  const { data: mediumsCount } = useUtmMediumsCount();
  const { data: campaignsCount } = useUtmCampaignsCount();
  const { data: termsCount } = useUtmTermsCount();
  const { data: contentsCount } = useUtmContentsCount();

  return (
    <div className="grid gap-6">
      <div className="overflow-hidden rounded-lg bg-neutral-50/60">
        <div className="flex flex-col items-start gap-1 px-4 py-3">
          <h2 className={cn(text.pageTitle, "text-lg")}>UTM Parameters</h2>
          <p className={cn(text.pageDescription, "text-sm")}>
            Manage your UTM parameter values to streamline campaign tracking
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-neutral-100 rounded-md bg-white md:grid-cols-5 md:divide-x md:divide-y-0">
          <ParameterColumn
            type="source"
            icon={GlobePointer}
            title="Source"
            parameters={utmSources || []}
            count={sourcesCount}
            loading={loadingSources}
            workspaceId={workspaceId}
            mutateCache={mutateSources}
          />
          <ParameterColumn
            type="medium"
            icon={SatelliteDish}
            title="Medium"
            parameters={utmMediums || []}
            count={mediumsCount}
            loading={loadingMediums}
            workspaceId={workspaceId}
            mutateCache={mutateMediums}
          />
          <ParameterColumn
            type="campaign"
            icon={Flag6}
            title="Campaign"
            parameters={utmCampaigns || []}
            count={campaignsCount}
            loading={loadingCampaigns}
            workspaceId={workspaceId}
            mutateCache={mutateCampaigns}
          />
          <ParameterColumn
            type="term"
            icon={InputSearch}
            title="Term"
            parameters={utmTerms || []}
            count={termsCount}
            loading={loadingTerms}
            workspaceId={workspaceId}
            mutateCache={mutateTerms}
          />
          <ParameterColumn
            type="content"
            icon={Page2}
            title="Content"
            parameters={utmContents || []}
            count={contentsCount}
            loading={loadingContents}
            workspaceId={workspaceId}
            mutateCache={mutateContents}
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
}: {
  type: ParameterType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  parameters: Parameter[];
  count?: number;
  loading: boolean;
  workspaceId: string | undefined;
  mutateCache: (data?: any, opts?: any) => Promise<any>;
}) {
  const placeholder = getUtmParameterPlaceholder(type);
  if (!workspaceId) return null;
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const apiEndpoint = `utm-${type}s`;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    setIsAdding(true);
    const normalizedValue = normalizeUtmValue(newValue);

    try {
      const res = await fetch(`/api/${apiEndpoint}?workspaceId=${workspaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedValue }),
      });

      if (res.ok) {
        toast.success(`Successfully added ${title.toLowerCase()}!`);
        setNewValue("");
        await mutateCache(undefined, { revalidate: true });
      } else {
        const { error } = await res.json();
        toast.error(error.message);
      }
    } catch (error) {
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
        await mutateCache(undefined, { revalidate: true });
      } else {
        const { error } = await res.json();
        toast.error(error.message);
      }
    } catch (error) {
      toast.error(`Failed to delete ${title.toLowerCase()}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col bg-white">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-neutral-600" />
          <h3 className="font-medium text-neutral-900">{title}</h3>
          {count !== undefined && (
            <span className="text-sm text-neutral-500">({count})</span>
          )}
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleAdd} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={placeholder || `Add ${title.toLowerCase()}...`}
              className="app-input h-9 !placeholder:text-neutral-400"
              disabled={isAdding}
            />
            <AppButton
              type="submit"
              variant="secondary"
              size="sm"
              className="h-9 px-2"
              disabled={isAdding || !newValue.trim()}
            >
              {isAdding ? (
                <LoadingSpinner className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
            </AppButton>
          </div>
        </form>

        <div className="space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner className="size-5" />
            </div>
          ) : parameters.length > 0 ? (
            parameters.map((param) => (
              <div
                key={param.id}
                className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-neutral-50"
              >
                <span className="text-sm text-neutral-700 truncate">
                  {param.name}
                </span>
                <Tooltip content="Delete">
                  <AppIconButton
                    onClick={() => handleDelete(param.id)}
                    disabled={deletingId === param.id}
                    className={cn(
                      "h-7 w-7 text-neutral-400 hover:text-red-600 disabled:cursor-not-allowed",
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
            ))
          ) : (
            <p className="py-8 text-center text-sm text-neutral-500">
              No {title.toLowerCase()}s yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

