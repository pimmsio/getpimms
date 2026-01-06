"use client";

import { ExpandedWorkspaceProps } from "@/lib/types";
import { PRO_PLAN, fetcher, getNextPlan } from "@dub/utils";
import { useParams, useSearchParams } from "next/navigation";
import useSWR, { SWRConfiguration } from "swr";

export default function useWorkspace({
  swrOpts,
}: {
  swrOpts?: SWRConfiguration;
} = {}) {
  // `next/navigation` hooks can throw when rendered outside the App Router context
  // (e.g. Storybook/tests). We fall back gracefully instead of crashing the whole page.
  let params: Record<string, unknown> = {};
  let searchParams: ReturnType<typeof useSearchParams> | null = null;
  try {
    params = useParams() as Record<string, unknown>;
  } catch {
    params = {};
  }
  try {
    searchParams = useSearchParams();
  } catch {
    searchParams = null;
  }

  const rawSlug = params?.slug;
  let slug =
    typeof rawSlug === "string"
      ? rawSlug
      : Array.isArray(rawSlug) && typeof rawSlug[0] === "string"
        ? rawSlug[0]
        : null;
  if (!slug) {
    slug = searchParams?.get("slug") || searchParams?.get("workspace") || null;
  }

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

  const {
    data: workspace,
    error,
    mutate,
  } = useSWR<ExpandedWorkspaceProps>(swrKey, fetcher, mergedOpts);

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
