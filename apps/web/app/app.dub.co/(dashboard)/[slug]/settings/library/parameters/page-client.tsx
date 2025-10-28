"use client";

import useUtmSources, { useUtmSourcesCount } from "@/lib/swr/use-utm-sources";
import useUtmMediums, { useUtmMediumsCount } from "@/lib/swr/use-utm-mediums";
import useUtmCampaigns, {
  useUtmCampaignsCount,
} from "@/lib/swr/use-utm-campaigns";
import useUtmTerms, { useUtmTermsCount } from "@/lib/swr/use-utm-terms";
import useUtmContents, { useUtmContentsCount } from "@/lib/swr/use-utm-contents";
import useWorkspace from "@/lib/swr/use-workspace";
import { AnimatedSizeContainer, Button, Tooltip } from "@dub/ui";
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
import { normalizeUtmValue } from "@dub/utils";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

type ParameterType = "source" | "medium" | "campaign" | "term" | "content";

interface Parameter {
  id: string;
  name: string;
}

export default function WorkspaceUtmParametersClient() {
  const { id: workspaceId } = useWorkspace();

  const { utmSources, loading: loadingSources } = useUtmSources({
    query: { sortBy: "name", sortOrder: "asc" },
  });
  const { utmMediums, loading: loadingMediums } = useUtmMediums({
    query: { sortBy: "name", sortOrder: "asc" },
  });
  const { utmCampaigns, loading: loadingCampaigns } = useUtmCampaigns({
    query: { sortBy: "name", sortOrder: "asc" },
  });
  const { utmTerms, loading: loadingTerms } = useUtmTerms({
    query: { sortBy: "name", sortOrder: "asc" },
  });
  const { utmContents, loading: loadingContents } = useUtmContents({
    query: { sortBy: "name", sortOrder: "asc" },
  });

  const { data: sourcesCount } = useUtmSourcesCount();
  const { data: mediumsCount } = useUtmMediumsCount();
  const { data: campaignsCount } = useUtmCampaignsCount();
  const { data: termsCount } = useUtmTermsCount();
  const { data: contentsCount } = useUtmContentsCount();

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            UTM Parameters
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Manage your UTM parameter values to streamline campaign tracking
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-neutral-200 md:grid-cols-5">
          <ParameterColumn
            type="source"
            icon={GlobePointer}
            title="Source"
            parameters={utmSources || []}
            count={sourcesCount}
            loading={loadingSources}
            workspaceId={workspaceId}
          />
          <ParameterColumn
            type="medium"
            icon={SatelliteDish}
            title="Medium"
            parameters={utmMediums || []}
            count={mediumsCount}
            loading={loadingMediums}
            workspaceId={workspaceId}
          />
          <ParameterColumn
            type="campaign"
            icon={Flag6}
            title="Campaign"
            parameters={utmCampaigns || []}
            count={campaignsCount}
            loading={loadingCampaigns}
            workspaceId={workspaceId}
          />
          <ParameterColumn
            type="term"
            icon={InputSearch}
            title="Term"
            parameters={utmTerms || []}
            count={termsCount}
            loading={loadingTerms}
            workspaceId={workspaceId}
          />
          <ParameterColumn
            type="content"
            icon={Page2}
            title="Content"
            parameters={utmContents || []}
            count={contentsCount}
            loading={loadingContents}
            workspaceId={workspaceId}
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
}: {
  type: ParameterType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  parameters: Parameter[];
  count?: number;
  loading: boolean;
  workspaceId: string | undefined;
}) {
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

    console.log(`[UTM Parameters] Adding ${type}:`, normalizedValue);

    try {
      const apiUrl = `/api/${apiEndpoint}?workspaceId=${workspaceId}`;
      console.log(`[UTM Parameters] API URL:`, apiUrl);
      
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedValue }),
      });

      if (res.ok) {
        const newParam = await res.json();
        console.log(`[UTM Parameters] Successfully created:`, newParam);
        
        toast.success(`Successfully added ${title.toLowerCase()}!`);
        setNewValue("");
        
        // Mutate with function matcher to invalidate all related queries
        console.log(`[UTM Parameters] Mutating cache for ${apiEndpoint}...`);
        await mutate(
          (key) => {
            const matches = typeof key === "string" && 
              key.startsWith(`/api/${apiEndpoint}`) && 
              key.includes(`workspaceId=${workspaceId}`);
            if (matches) {
              console.log(`[UTM Parameters] Invalidating cache key:`, key);
            }
            return matches;
          },
        );
        console.log(`[UTM Parameters] Cache mutation complete`);
      } else {
        const { error } = await res.json();
        console.error(`[UTM Parameters] API error:`, error);
        toast.error(error.message);
      }
    } catch (error) {
      console.error(`[UTM Parameters] Exception:`, error);
      toast.error(`Failed to add ${title.toLowerCase()}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`))
      return;

    setDeletingId(id);

    try {
      const res = await fetch(
        `/api/${apiEndpoint}/${id}?workspaceId=${workspaceId}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        toast.success(`Successfully deleted ${title.toLowerCase()}!`);
        await mutate(`/api/${apiEndpoint}?workspaceId=${workspaceId}`);
        await mutate(`/api/${apiEndpoint}/count?workspaceId=${workspaceId}`);
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
      <div className="border-b border-neutral-200 px-4 py-3">
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
              placeholder={`Add ${title.toLowerCase()}...`}
              className="block w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-0"
              disabled={isAdding}
            />
            <Button
              type="submit"
              variant="secondary"
              className="h-auto px-2 py-1.5"
              disabled={isAdding || !newValue.trim()}
              icon={
                isAdding ? (
                  <LoadingSpinner className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )
              }
            />
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
                  <button
                    onClick={() => handleDelete(param.id)}
                    disabled={deletingId === param.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-600 disabled:cursor-not-allowed"
                  >
                    {deletingId === param.id ? (
                      <LoadingSpinner className="size-4" />
                    ) : (
                      <Trash className="size-4" />
                    )}
                  </button>
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

