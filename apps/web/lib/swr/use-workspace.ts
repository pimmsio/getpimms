"use client";

import { ExpandedWorkspaceProps } from "@/lib/types";
import { useWorkspaceSlug } from "../hooks/use-workspace-slug";
import { PRO_PLAN, fetcher, getNextPlan } from "@dub/utils";
import useSWR, { SWRConfiguration } from "swr";

export default function useWorkspace({
  swrOpts,
}: {
  swrOpts?: SWRConfiguration;
} = {}) {
  const slug = useWorkspaceSlug();

  // SWR expects a stable key or `null` (to pause). Avoid passing `undefined`
  // because it can lead to intermittent argument parsing issues in some setups.
  const swrKey = slug ? `/api/workspaces/${slug}` : null;
  const mergedOpts: Record<string, unknown> = {
    dedupingInterval: 60000,
    ...swrOpts,
  };
  // SWR expects `config.use` to be iterable (middleware list). In some environments we
  // see it become `undefined`, which causes `TypeError: undefined is not iterable`.
  // Force a safe default unless explicitly provided as an array.
  if (!Array.isArray(mergedOpts.use)) {
    mergedOpts.use = [];
  }

  const { data: workspace, error, mutate } = useSWR<ExpandedWorkspaceProps>(
    swrKey,
    fetcher,
    mergedOpts,
  );

  return {
    ...(workspace ?? {}),
    nextPlan: workspace?.plan ? getNextPlan(workspace.plan) : PRO_PLAN,
    role: (workspace?.users && workspace.users[0].role) || "member",
    isOwner: Boolean(workspace?.users && workspace.users[0].role === "owner"),
    exceededClicks: workspace && workspace.usage >= workspace.usageLimit,
    exceededLinks: workspace && workspace.linksUsage >= workspace.linksLimit,
    exceededAI: workspace && workspace.aiUsage >= workspace.aiLimit,
    exceededDomains:
      workspace?.domains && workspace.domains.length >= workspace.domainsLimit,
    error,
    defaultFolderId: workspace?.users && workspace.users[0].defaultFolderId,
    mutate,
    loading: Boolean(swrKey && !workspace && !error),
  };
}
